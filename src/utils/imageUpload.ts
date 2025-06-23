import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../firebaseConfig";

const storage = getStorage(app);

// New generic upload function
export async function uploadFileToFirebase(file: File, path: string): Promise<string> {
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
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const fileName = `${path}/${uniqueSuffix}.${fileExtension}`;
  const storageRef = ref(storage, fileName);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Firebase upload error:", error);
    throw new Error(`Failed to upload image: ${error}`);
  }
}

export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'File must be an image.' };
  }
  if (file.size > 2 * 1024 * 1024) { // 2MB limit
    return { isValid: false, error: 'Image must be smaller than 2MB.' };
  }
  return { isValid: true };
} 