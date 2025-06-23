import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  serverTimestamp,
  doc,
  updateDoc,
  runTransaction,
  orderBy,
  Timestamp,
  or,
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import { createNotification } from "./firestoreNotifications";

const db = getFirestore(app);
const matchRequestsRef = collection(db, "matchRequests");
const matchesRef = collection(db, "matches");
const usersRef = collection(db, "users");
const teamsRef = collection(db, "teams");

export type MatchFormat = "2-halves" | "4-quarters";
export type MatchStatus = "scheduled" | "pending_confirmation" | "confirmed" | "disputed";

export interface MatchRequestData {
  requestingTeamId: string;
  requestingTeamName: string;
  opponentTeamId: string;
  opponentTeamName: string;
  matchDateTime: any; // Firestore Timestamp
  venue: string;
  format: MatchFormat;
}

export interface MatchData extends Omit<MatchRequestData, 'matchDateTime'> {
    status: MatchStatus;
    matchDateTime: any; // Firestore Timestamp
    result?: {
      score: [number, number]; // [requestingTeamScore, opponentTeamScore]
      scorers: { playerId: string; count: number }[];
      submittedBy: string; // ID of the manager who submitted
    };
    createdAt: any;
    updatedAt: any;
}

/**
 * Sends a match request to another team.
 * @param data - The match request details.
 */
export async function sendMatchRequest(data: MatchRequestData) {
  // Check for existing pending requests between the two teams
  const q = query(
    matchRequestsRef,
    where("requestingTeamId", "in", [data.requestingTeamId, data.opponentTeamId]),
    where("opponentTeamId", "in", [data.requestingTeamId, data.opponentTeamId]),
    where("status", "==", "pending")
  );

  const existingRequests = await getDocs(q);
  if (!existingRequests.empty) {
    throw new Error("There is already a pending match request between these two teams.");
  }

  const requestDoc = await addDoc(matchRequestsRef, { ...data, status: "pending", createdAt: serverTimestamp() });

  // Create notification for the opponent team's manager
  try {
    // Get the opponent team's manager
    const opponentTeamRef = doc(db, "teams", data.opponentTeamId);
    const opponentTeamSnap = await getDoc(opponentTeamRef);
    
    if (opponentTeamSnap.exists()) {
      const opponentTeamData = opponentTeamSnap.data();
      const managerId = opponentTeamData.managerId;
      
      if (managerId) {
        const matchDate = data.matchDateTime.toDate ? data.matchDateTime.toDate() : new Date(data.matchDateTime);
        const formattedDate = matchDate.toLocaleDateString();
        const formattedTime = matchDate.toLocaleTimeString();
        
        await createNotification({
          userId: managerId,
          type: 'match_request',
          title: `Match request from ${data.requestingTeamName}`,
          message: `${data.requestingTeamName} wants to play against ${data.opponentTeamName} on ${formattedDate} at ${formattedTime}`,
          relatedId: requestDoc.id,
          isRead: false,
          metadata: {
            requestingTeamId: data.requestingTeamId,
            requestingTeamName: data.requestingTeamName,
            opponentTeamId: data.opponentTeamId,
            opponentTeamName: data.opponentTeamName,
            matchDateTime: data.matchDateTime,
            venue: data.venue,
            format: data.format
          }
        });
      }
    }
  } catch (error) {
    console.error('Error creating match request notification:', error);
    // Don't throw error here as the match request was already created successfully
  }
}

/**
 * Gets all match requests for a specific team (where the team is the opponent).
 * @param teamId - The ID of the opponent team.
 */
export async function getMatchRequestsForTeam(teamId: string) {
    const q = query(
        matchRequestsRef,
        where("opponentTeamId", "==", teamId),
        where("status", "==", "pending")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchRequestData & { id: string }));
}


/**
 * Accepts a match request and creates a new match document.
 * @param requestId - The ID of the match request to accept.
 */
export async function acceptMatchRequest(requestId: string) {
    const requestRef = doc(db, "matchRequests", requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
        throw new Error("Request not found.");
    }
    const requestData = requestSnap.data() as MatchRequestData;

    // Create a new document in the 'matches' collection
    await addDoc(matchesRef, {
        ...requestData,
        status: "scheduled",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Update the original request status to 'accepted'
    await updateDoc(requestRef, { status: "accepted" });
}

/**
 * Declines a match request.
 * @param requestId - The ID of the match request to decline.
 */
export async function declineMatchRequest(requestId: string) {
    const requestRef = doc(db, "matchRequests", requestId);
    await updateDoc(requestRef, { status: "declined" });
}

/**
 * Gets all matches for a team (scheduled, pending, etc.).
 * @param teamId The ID of the team.
 */
export async function getMatchesForTeam(teamId: string) {
     const q = query(
         matchesRef,
         where("requestingTeamId", "==", teamId)
     );
     const q2 = query(
         matchesRef,
         where("opponentTeamId", "==", teamId)
     );
     
     const [requestingSnap, opponentSnap] = await Promise.all([getDocs(q), getDocs(q2)]);
     
     const matches = new Map<string, MatchData & { id: string }>();
     requestingSnap.forEach(doc => matches.set(doc.id, { id: doc.id, ...doc.data() } as MatchData & { id: string }));
     opponentSnap.forEach(doc => matches.set(doc.id, { id: doc.id, ...doc.data() } as MatchData & { id: string }));
     
     return Array.from(matches.values()).sort((a, b) => {
       if (!a.matchDateTime || !b.matchDateTime) return 0; // Handle old data gracefully
       return b.matchDateTime.toMillis() - a.matchDateTime.toMillis();
     });
}

/**
 * Submits the result of a match for confirmation.
 * @param matchId The ID of the match.
 * @param result The match result details.
 */
export async function submitMatchResult(matchId: string, result: MatchData['result']) {
    if (!result) return;
    const matchRef = doc(db, "matches", matchId);
    await updateDoc(matchRef, {
        result,
        status: "pending_confirmation",
        updatedAt: serverTimestamp(),
    });
}

/**
 * Confirms a match result and updates team/player stats.
 * @param matchId The ID of the match to confirm.
 */
export async function confirmMatchResult(matchId: string) {
    await runTransaction(db, async (transaction) => {
        const matchRef = doc(db, "matches", matchId);
        const matchSnap = await transaction.get(matchRef);

        if (!matchSnap.exists() || !matchSnap.data().result) {
            throw new Error("Match or result not found!");
        }

        const match = matchSnap.data() as MatchData;
        const { result, requestingTeamId, opponentTeamId } = match;
        
        if (!result) throw new Error("Result data is missing.");

        const [reqScore, oppScore] = result.score;

        // 1. Read all necessary documents first
        const reqTeamRef = doc(teamsRef, requestingTeamId);
        const oppTeamRef = doc(teamsRef, opponentTeamId);
        const reqTeamSnap = await transaction.get(reqTeamRef);
        const oppTeamSnap = await transaction.get(oppTeamRef);

        if (!reqTeamSnap.exists() || !oppTeamSnap.exists()) {
            throw new Error("One or both teams not found.");
        }

        const playerRefs = result.scorers.map(s => doc(usersRef, s.playerId));
        const playerSnaps = await Promise.all(playerRefs.map(ref => transaction.get(ref)));

        // 2. Now, perform all writes
        transaction.update(matchRef, { status: "confirmed", updatedAt: serverTimestamp() });

        let reqPoints = reqTeamSnap.data().points || 0;
        let oppPoints = oppTeamSnap.data().points || 0;

        if (reqScore > oppScore) reqPoints += 3; // Requesting team wins
        else if (oppScore > reqScore) oppPoints += 3; // Opponent team wins
        else { // Draw
            reqPoints += 1;
            oppPoints += 1;
        }
        transaction.update(reqTeamRef, { points: reqPoints });
        transaction.update(oppTeamRef, { points: oppPoints });

        playerSnaps.forEach((playerSnap, index) => {
            if (playerSnap.exists()) {
                const currentGoals = playerSnap.data().goals || 0;
                const scorerInfo = result.scorers[index];
                transaction.update(playerRefs[index], { goals: currentGoals + scorerInfo.count });
            }
        });
    });
}

/**
 * Disputes a match result.
 * @param matchId The ID of the match to dispute.
 */
export async function disputeMatchResult(matchId: string) {
    const matchRef = doc(db, "matches", matchId);
    await updateDoc(matchRef, {
        status: "disputed",
        updatedAt: serverTimestamp(),
    });
} 