import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  or,
  and,
  setDoc,
  limit,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import { createNotification } from "./firestoreNotifications";

const db = getFirestore(app);
const chatsRef = collection(db, "chats");

export interface Message {
  id?: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
}

export interface ChatData {
  id: string;
  users: string[];
  userDetails: { uid: string; displayName: string; photoURL: string; }[];
  lastMessage: {
    text: string;
    createdAt: Timestamp;
    senderId: string;
  } | null;
  createdAt: Timestamp;
}

// Generates a consistent chat ID for any two users
const getChatId = (uid1: string, uid2: string) => {
  return [uid1, uid2].sort().join("_");
};

// Gets or creates a chat between two users
export async function getOrCreateChat(
  currentUserId: string,
  otherUserId: string
): Promise<string> {
  const chatId = getChatId(currentUserId, otherUserId);
  const chatRef = doc(db, "chats", chatId);

  const chatSnap = await getDoc(chatRef);
  
  if (!chatSnap.exists()) {
    // Chat doesn't exist, create it
    await setDoc(chatRef, {
      participants: [currentUserId, otherUserId],
      createdAt: serverTimestamp(),
      lastMessage: {
        text: "Chat created",
        createdAt: serverTimestamp(), // Initialize for sorting
        senderId: null,
      },
    });
  }
  
  return chatId;
}

// Sends a message in a specific chat
export async function sendMessage(chatId: string, senderId: string, text: string) {
  if (!text.trim()) return; // Don't send empty messages

  const messagesColRef = collection(db, "chats", chatId, "messages");
  
  const messageData = {
    text,
    senderId,
    createdAt: serverTimestamp(),
  };

  const messageDocRef = await addDoc(messagesColRef, messageData);

  // Also update the last message on the parent chat doc for previews
  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, {
    lastMessage: {
      text,
      createdAt: serverTimestamp(), // This will be slightly different from message, but good enough for ordering
      senderId: senderId,
    }
  });

  // Create notification for the recipient
  try {
    // Get chat data to find the recipient
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
      const chatData = chatSnap.data();
      const participants = chatData.participants || [];
      const recipientId = participants.find((id: string) => id !== senderId);
      
      if (recipientId) {
        // Get sender's display name for the notification
        const senderDoc = await getDoc(doc(db, "users", senderId));
        const senderName = senderDoc.exists() ? senderDoc.data().displayName : "Someone";
        
        await createNotification({
          userId: recipientId,
          type: 'chat',
          title: `New message from ${senderName}`,
          message: text.length > 50 ? `${text.substring(0, 50)}...` : text,
          relatedId: chatId,
          isRead: false,
          metadata: {
            senderId,
            senderName,
            messageId: messageDocRef.id
          }
        });
      }
    }
  } catch (error) {
    console.error('Error creating chat notification:', error);
    // Don't throw error here as the message was already sent successfully
  }
}

// Sets up a real-time listener for messages in a chat
export function getMessagesListener(
  chatId: string,
  callback: (messages: Message[]) => void
) {
  const messagesColRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesColRef, orderBy("createdAt", "asc"));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Message));
    callback(messages);
  });

  return unsubscribe; // Return the function to unsubscribe from the listener
}

// Gets a user's chat list, ordered by the last message
export function listenForUserChats(
  userId: string,
  callback: (chats: ChatData[]) => void,
  onError: (error: Error) => void
) {
  const chatsCollection = collection(db, "chats");
  const q = query(
    chatsCollection, 
    where("participants", "array-contains", userId), 
    orderBy("lastMessage.createdAt", "desc")
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const chats = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ChatData));
    callback(chats);
  },
  (error) => {
    console.error("Chat listener error in listenForUserChats:", error);
    onError(error);
  });

  return unsubscribe;
}

export const getChatsForUser = (userId: string, callback: (chats: any[]) => void) => {
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('users', 'array-contains', userId));

  return onSnapshot(q, (querySnapshot) => {
    const chats = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(chats);
  });
}; 