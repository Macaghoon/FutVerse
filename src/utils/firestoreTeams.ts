import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";

const db = getFirestore(app);
const auth = getAuth(app);

export async function createTeam(teamName: string, logoUrl: string) {
  const manager = auth.currentUser;
  if (!manager) throw new Error("Not authenticated");

  const teamRef = doc(db, "teams", teamName.replace(/\s+/g, "_") + "_" + manager.uid);
  const teamId = teamRef.id;
  const managerId = manager.uid;

  // 1. Create the team document
  await setDoc(teamRef, {
    name: teamName,
    logoUrl,
    points: 0,
    managerId,
    members: [managerId],
    createdAt: serverTimestamp()
  });

  // 2. Update the manager's user document
  const userRef = doc(db, "users", managerId);
  await updateDoc(userRef, {
    teamId,
    role: "manager"
  });

  return teamId;
}

export async function getAllTeams() {
  const teamsRef = collection(db, "teams");
  const q = query(teamsRef, orderBy("points", "desc")); // Order teams by points
  const querySnapshot = await getDocs(q);

  const teams = await Promise.all(
    querySnapshot.docs.map(async (teamDoc) => {
      const teamData = teamDoc.data();
      const teamId = teamDoc.id;

      // Fetch manager's details
      let managerName = "N/A";
      if (teamData.managerId) {
        // Correctly fetch manager by document ID
        const managerRef = doc(db, "users", teamData.managerId);
        const managerSnap = await getDoc(managerRef);
        if (managerSnap.exists()) {
          managerName = managerSnap.data().displayName;
        }
      }

      return {
        id: teamId,
        ...teamData,
        managerName,
      };
    })
  );

  return teams;
}

export async function getTeamForManager(managerId: string) {
  const teamsRef = collection(db, "teams");
  const q = query(teamsRef, where("managerId", "==", managerId), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("No team found for this manager.");
  }

  const teamDoc = querySnapshot.docs[0];
  return { id: teamDoc.id, ...teamDoc.data() };
}