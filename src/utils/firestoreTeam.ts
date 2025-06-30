import { getFirestore, doc, setDoc, updateDoc, getDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { app } from "../firebaseConfig";

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export async function createTeam(teamName: string, logoUrl: string, coverPhotoUrl: string) {
  const manager = auth.currentUser;
  if (!manager) throw new Error("Not authenticated");

  const teamRef = doc(db, "teams", teamName.replace(/\s+/g, "_") + "_" + manager.uid);
  const teamId = teamRef.id;
  const managerId = manager.uid;

  await setDoc(teamRef, {
    name: teamName,
    name_lowercase: teamName.toLowerCase(),
    logoUrl,
    coverPhotoUrl,
    points: 0,
    managerId,
    members: [managerId],
    createdAt: serverTimestamp()
  });

  const userRef = doc(db, "users", managerId);
  await updateDoc(userRef, {
    teamId,
    role: "manager"
  });

  return teamId;
}

export async function addPlayerToTeam(teamId: string, playerId: string) {
  const teamRef = doc(db, "teams", teamId);
  const userRef = doc(db, "users", playerId);

  await updateDoc(teamRef, {
    members: arrayUnion(playerId)
  });

  await updateDoc(userRef, {
    teamId,
    role: "player"
  });
}

export async function leaveTeam(playerId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  // Get the user's current team
  const userRef = doc(db, "users", playerId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    throw new Error("User not found");
  }
  
  const userData = userSnap.data();
  const teamId = userData.teamId;
  
  if (!teamId) {
    throw new Error("User is not part of any team");
  }
  
  // Get the team document
  const teamRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  
  if (!teamSnap.exists()) {
    throw new Error("Team not found");
  }
  
  const teamData = teamSnap.data();
  
  // Check if the user is the manager
  if (teamData.managerId === playerId) {
    throw new Error("Managers cannot leave their team. Please transfer management or delete the team.");
  }
  
  // Remove player from team members
  await updateDoc(teamRef, {
    members: arrayRemove(playerId)
  });
  
  // Update user document to remove team association
  await updateDoc(userRef, {
    teamId: null,
    role: null
  });
}

export async function getTeamWithManagerAndMembers(teamId: string) {
  const teamRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) return null;
  const team = { id: teamSnap.id, ...(teamSnap.data() as any) };

  const managerRef = doc(db, "users", team.managerId);
  const managerSnap = await getDoc(managerRef);
  const manager = managerSnap.exists() ? { uid: managerSnap.id, ...managerSnap.data() } : null;

  const members = [];
  for (const memberId of team.members) {
    const memberRef = doc(db, "users", memberId);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) members.push({ uid: memberSnap.id, ...memberSnap.data() });
  }

  return { team, manager, members };
}

export async function updateTeamName(teamId: string, newName: string) {
  const teamRef = doc(db, "teams", teamId);
  await updateDoc(teamRef, {
    name: newName,
    name_lowercase: newName.toLowerCase()
  });
}

export async function uploadTeamLogo(file: File, teamId: string): Promise<string> {
  if (!file) throw new Error("No file provided");
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error("File must be an image");
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size must be less than 5MB");
  }

  const fileExtension = file.name.split('.').pop();
  const fileName = `team-logos/${teamId}/logo.${fileExtension}`;
  const storageRef = ref(storage, fileName);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    throw new Error(`Failed to upload image: ${error}`);
  }
}

export async function updateTeamLogo(teamId: string, logoUrl: string) {
  const teamRef = doc(db, "teams", teamId);
  await updateDoc(teamRef, {
    logoUrl
  });
}

export async function updateTeamCoverPhoto(teamId: string, coverPhotoUrl: string) {
  const teamRef = doc(db, "teams", teamId);
  await updateDoc(teamRef, {
    coverPhotoUrl
  });
}

export async function deleteTeamLogo(teamId: string) {
  try {
    const teamRef = doc(db, "teams", teamId);
    const teamSnap = await getDoc(teamRef);
    if (teamSnap.exists()) {
      const team = teamSnap.data();
      if (team.logoUrl) {
        // Extract the file path from the URL
        const urlParts = team.logoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `team-logos/${teamId}/${fileName}`;
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
      }
    }
  } catch (error) {
    console.error("Error deleting logo:", error);
  }
} 