import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { app } from "../firebaseConfig";

const db = getFirestore(app);

// Helper function to perform a "starts with" query
const createStartsWithQuery = (
  collectionName: string,
  field: string,
  searchText: string
) => {
  const searchField = `${field}_lowercase`;
  const lowercasedSearchText = searchText.toLowerCase();
  const endText = lowercasedSearchText + "\uf8ff";
  return query(
    collection(db, collectionName),
    orderBy(searchField),
    where(searchField, ">=", lowercasedSearchText),
    where(searchField, "<=", endText),
    limit(5) // Limit results to keep it snappy
  );
};

export async function searchTeams(searchText: string) {
  if (!searchText) return [];
  const q = createStartsWithQuery("teams", "name", searchText);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function searchUsers(searchText: string) {
  if (!searchText) return [];
  const q = createStartsWithQuery("users", "displayName", searchText);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function globalSearch(searchText: string) {
  const [teams, users] = await Promise.all([
    searchTeams(searchText),
    searchUsers(searchText),
  ]);
  return { teams, users };
} 