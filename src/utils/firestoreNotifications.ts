import { getFirestore, doc, updateDoc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot, writeBatch, addDoc, orderBy } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

export interface NotificationData {
  id: string;
  userId: string;
  type: 'chat' | 'request' | 'match_request' | 'team_update';
  title: string;
  message: string;
  relatedId?: string; // ID of related item (chat ID, request ID, etc.)
  isRead: boolean;
  createdAt: any;
  metadata?: any; // Additional data specific to notification type
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: new Date()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Mark all notifications of a specific type as read for a user
export async function markAllNotificationsAsRead(userId: string, type: NotificationData['type']): Promise<void> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('type', '==', type),
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isRead: true,
        readAt: new Date()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// Get unread notification count for a user
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}

// Get unread notification count by type for a user
export async function getUnreadNotificationCountByType(userId: string, type: NotificationData['type']): Promise<number> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('type', '==', type),
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread notification count by type:', error);
    return 0;
  }
}

// Listen for unread notification count changes
export function listenForUnreadNotifications(
  userId: string,
  callback: (count: number) => void,
  onError: (error: Error) => void
) {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('isRead', '==', false)
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    callback(querySnapshot.size);
  }, (error) => {
    console.error('Error listening for unread notifications:', error);
    onError(error);
  });

  return unsubscribe;
}

// Listen for unread notification count changes by type
export function listenForUnreadNotificationsByType(
  userId: string,
  type: NotificationData['type'],
  callback: (count: number) => void,
  onError: (error: Error) => void
) {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('type', '==', type),
    where('isRead', '==', false)
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    callback(querySnapshot.size);
  }, (error) => {
    console.error('Error listening for unread notifications by type:', error);
    onError(error);
  });

  return unsubscribe;
}

// Create a new notification
export async function createNotification(notification: Omit<NotificationData, 'id' | 'createdAt'>): Promise<string> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const newNotification = {
      ...notification,
      createdAt: new Date(),
      isRead: false
    };
    
    const docRef = await addDoc(notificationsRef, newNotification);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Get all notifications for a user
export async function getUserNotifications(userId: string): Promise<NotificationData[]> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as NotificationData));
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
} 