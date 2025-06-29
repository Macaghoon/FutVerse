import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import { createNotification } from "./firestoreNotifications";

const db = getFirestore(app);
const requestsRef = collection(db, "requests");

export type RequestType = "recruitment" | "application";

export interface Request {
  id: string;
  type: RequestType;
  fromId: string;
  fromName: string;
  toId: string;
  teamId: string;
  teamName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
}

// Send a request (either recruitment or application)
export async function sendRequest(
  type: RequestType,
  fromId: string,
  fromName: string,
  toId: string,
  teamId: string,
  teamName: string
) {
  // Prevent duplicate requests
  const q = query(
    requestsRef,
    where("fromId", "==", fromId),
    where("toId", "==", toId),
    where("teamId", "==", teamId),
    where("status", "==", "pending")
  );
  const existingRequest = await getDocs(q);
  if (!existingRequest.empty) {
    throw new Error("A pending request already exists.");
  }

  const requestDoc = await addDoc(requestsRef, {
    type, // 'recruitment' or 'application'
    fromId, // managerId for recruitment, playerId for application
    fromName,
    toId, // playerId for recruitment, managerId for application
    teamId,
    teamName,
    status: "pending", // 'pending', 'accepted', 'declined'
    createdAt: serverTimestamp(),
  });

  // Create notification for the recipient
  try {
    const notificationTitle = type === 'recruitment' 
      ? `Team invitation from ${fromName}`
      : `Team application from ${fromName}`;
    
    const notificationMessage = type === 'recruitment'
      ? `${fromName} has invited you to join ${teamName}`
      : `${fromName} has applied to join ${teamName}`;

    await createNotification({
      userId: toId,
      type: 'request',
      title: notificationTitle,
      message: notificationMessage,
      relatedId: requestDoc.id,
      isRead: false,
      metadata: {
        requestType: type,
        fromId,
        fromName,
        teamId,
        teamName
      }
    });
  } catch (error) {
    console.error('Error creating request notification:', error);
    // Don't throw error here as the request was already created successfully
  }
}

// Get all pending requests for a specific user (as the recipient)
export async function getPendingRequestsForUser(userId: string): Promise<Request[]> {
  const q = query(
    requestsRef,
    where("toId", "==", userId),
    where("status", "==", "pending")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Request));
}

// Accept a request
export async function acceptRequest(requestId: string, teamId: string, playerId: string) {
  const batch = writeBatch(db);

  // 1. Update the request status to 'accepted'
  const requestRef = doc(db, "requests", requestId);
  batch.update(requestRef, { status: "accepted" });

  // 2. Add the player to the team's 'members' array
  const teamRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  if (teamSnap.exists()) {
    const teamData = teamSnap.data();
    batch.update(teamRef, { members: [...teamData.members, playerId] });
  }

  // 3. Update the player's user document
  const userRef = doc(db, "users", playerId);
  batch.update(userRef, { teamId: teamId, role: "player" });

  await batch.commit();
}

// Decline a request
export async function declineRequest(requestId: string) {
  const requestRef = doc(db, "requests", requestId);
  await updateDoc(requestRef, { status: "declined" });
} 