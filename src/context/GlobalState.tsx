import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { 
  listenForUnreadNotificationsByType,
  markAllNotificationsAsRead 
} from '../utils/firestoreNotifications';

interface GlobalStateContextType {
  unreadMessages: number;
  pendingActions: number;
  markChatsAsRead: () => void;
  markNotificationsAsRead: () => void;
}

const GlobalStateContext = createContext<GlobalStateContextType>({
  unreadMessages: 0,
  pendingActions: 0,
  markChatsAsRead: () => {},
  markNotificationsAsRead: () => {},
});

export const useGlobalState = () => useContext(GlobalStateContext);

interface GlobalStateProviderProps {
  children: ReactNode;
}

export const GlobalStateProvider: React.FC<GlobalStateProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingActions, setPendingActions] = useState(0);
  const [requestNotifications, setRequestNotifications] = useState(0);
  const [matchRequestNotifications, setMatchRequestNotifications] = useState(0);

  const auth = getAuth();
  const db = getFirestore();

  // Effect to listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, [auth, db]);

  // Effect to listen for unread chat notifications
  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      return;
    }

    const unsubscribe = listenForUnreadNotificationsByType(
      user.uid,
      'chat',
      (count) => {
        console.log(`[GlobalState] Unread chat notifications: ${count}`);
        setUnreadMessages(count);
      },
      (error) => {
        console.error("Failed to listen for chat notifications:", error);
        setUnreadMessages(0);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Effect to listen for request notifications
  useEffect(() => {
    if (!user) {
      setRequestNotifications(0);
      return;
    }

    const unsubscribeRequests = listenForUnreadNotificationsByType(
      user.uid,
      'request',
      (requestCount) => {
        console.log(`[GlobalState] Unread request notifications: ${requestCount}`);
        setRequestNotifications(requestCount);
      },
      (error) => {
        console.error("Failed to listen for request notifications:", error);
        setRequestNotifications(0);
      }
    );

    return () => unsubscribeRequests();
  }, [user]);

  // Effect to listen for match request notifications (for managers)
  useEffect(() => {
    if (!user || userData?.role !== 'manager' || !userData?.teamId) {
      setMatchRequestNotifications(0);
      return;
    }

    const unsubscribeMatchRequests = listenForUnreadNotificationsByType(
      user.uid,
      'match_request',
      (matchRequestCount) => {
        console.log(`[GlobalState] Unread match request notifications: ${matchRequestCount}`);
        setMatchRequestNotifications(matchRequestCount);
      },
      (error) => {
        console.error("Failed to listen for match request notifications:", error);
        setMatchRequestNotifications(0);
      }
    );

    return () => unsubscribeMatchRequests();
  }, [user, userData]);

  // Calculate total pending actions
  useEffect(() => {
    const total = requestNotifications + matchRequestNotifications;
    setPendingActions(total);
  }, [requestNotifications, matchRequestNotifications]);

  // Function to mark all chat notifications as read
  const markChatsAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      await markAllNotificationsAsRead(user.uid, 'chat');
      console.log('[GlobalState] Marked all chat notifications as read');
    } catch (error) {
      console.error('Error marking chat notifications as read:', error);
    }
  }, [user]);

  // Function to mark all request notifications as read
  const markNotificationsAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      await markAllNotificationsAsRead(user.uid, 'request');
      if (userData?.role === 'manager') {
        await markAllNotificationsAsRead(user.uid, 'match_request');
      }
      console.log('[GlobalState] Marked all request notifications as read');
    } catch (error) {
      console.error('Error marking request notifications as read:', error);
    }
  }, [user, userData]);

  const value = {
    unreadMessages,
    pendingActions,
    markChatsAsRead,
    markNotificationsAsRead,
  };

  return <GlobalStateContext.Provider value={value}>{children}</GlobalStateContext.Provider>;
}; 