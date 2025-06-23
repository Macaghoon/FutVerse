import { getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const db = getFirestore();
const storage = getStorage();

export async function uploadUserPostImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const postId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const storageRef = ref(storage, `user-posts/${userId}/${postId}.${ext}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function addUserPost(userId: string, imageFile: File, caption: string) {
  const imageUrl = await uploadUserPostImage(userId, imageFile);
  const postsRef = collection(db, 'users', userId, 'posts');
  await addDoc(postsRef, {
    imageUrl,
    caption,
    createdAt: new Date(),
  });
}

export async function getUserPosts(userId: string) {
  const postsRef = collection(db, 'users', userId, 'posts');
  const q = query(postsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteUserPost(userId: string, postId: string, imageUrl: string) {
  // Delete Firestore doc
  await deleteDoc(doc(db, 'users', userId, 'posts', postId));
  // Delete image from storage
  const storageRef = ref(storage, imageUrl);
  await deleteObject(storageRef);
} 