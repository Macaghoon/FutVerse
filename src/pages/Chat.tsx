import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Avatar,
  Text,
  Input,
  IconButton,
  useColorModeValue,
  Spinner,
  Heading,
  Container,
  Divider,
  Alert,
  AlertIcon,
  useToast,
} from '@chakra-ui/react';
import { FaPaperPlane } from 'react-icons/fa';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import NavBar from '../components/NavBar';
import { getMessagesListener, sendMessage, listenForUserChats, getOrCreateChat } from '../utils/firestoreChat';
import type { Message, ChatData } from '../utils/firestoreChat';
import { useLocation, useNavigate } from 'react-router-dom';
import type { User } from "firebase/auth";
import { useGlobalState } from '../context/GlobalState';

const auth = getAuth(app);
const db = getFirestore(app);

// Custom hook for managing all chat data and state
const useChatData = () => {
  const location = useLocation();
  const [chats, setChats] = useState<ChatData[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatData | null>(null);
  const [otherUsers, setOtherUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = auth.currentUser;
  const toast = useToast();
  const { markChatsAsRead } = useGlobalState();

  // Mark chat notifications as read when component mounts
  useEffect(() => {
    if (currentUser) {
      markChatsAsRead();
    }
  }, [currentUser, markChatsAsRead]);

  // 1. Listen for the user's chats
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    const unsubscribe = listenForUserChats(
      currentUser.uid,
      (loadedChats) => {
        setChats(loadedChats);
        setError(null);
        if (loading) setLoading(false); // Stop loading only on the first fetch
      },
      (err) => {
        console.error(err);
        setError("Could not load chats. This may be due to a missing database index. Check the browser console for a link to create it.");
        setLoading(false);
        toast({
          title: "Could not load chats.",
          description: "There was an error fetching your conversations. You might need to add a firestore index.",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      }
    );
    return () => unsubscribe();
  }, [currentUser, toast]);

  // 2. Fetch user data for the other participants in the chats
  useEffect(() => {
    if (!currentUser || chats.length === 0) return;

    const usersToFetch = new Set<string>();
    chats.forEach(chat => {
      const otherUserId = (chat as any).participants.find((p: string) => p !== currentUser.uid);
      if (otherUserId && !otherUsers[otherUserId]) {
        usersToFetch.add(otherUserId);
      }
    });

    if (usersToFetch.size === 0) return;

    const fetchNewUsers = async () => {
      const newUsers: Record<string, User> = {};
      for (const userId of Array.from(usersToFetch)) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          newUsers[userId] = userDoc.data() as User;
        }
      }
      setOtherUsers(prev => ({ ...prev, ...newUsers }));
    };

    fetchNewUsers();
  }, [chats, currentUser]);

  // 3. Handle opening a specific chat from navigation state
  useEffect(() => {
    const state = location.state as { openChatId?: string };
    // Only proceed if we have a chat ID from navigation and haven't already selected a chat
    if (state?.openChatId && !selectedChat) {
      const chatAlreadyInList = chats.find(c => c.id === state.openChatId);

      if (chatAlreadyInList) {
        // The listener was fast and the chat is already in our list
        setSelectedChat(chatAlreadyInList);
        window.history.replaceState({}, ''); // Clean up state
      } else if (state.openChatId) { // Ensure openChatId is not undefined
        // The listener is slower than navigation; fetch the chat doc directly
        const fetchChatManually = async (chatId: string) => {
          try {
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);
            if (chatSnap.exists()) {
              const chatData = { id: chatSnap.id, ...chatSnap.data() } as ChatData;
              // We need to make sure this new chat is also in the main list
              setChats(prevChats => {
                if (prevChats.some(c => c.id === chatData.id)) {
                  return prevChats;
                }
                return [chatData, ...prevChats];
              });
              setSelectedChat(chatData);
              window.history.replaceState({}, ''); // Clean up state
            }
          } catch (err) {
            console.error("Failed to manually fetch chat:", err);
            setError("Could not open the specified chat.");
          }
        };
        fetchChatManually(state.openChatId);
      }
    }
  }, [chats, location.state, selectedChat, currentUser]);

  return {
    chats,
    selectedChat,
    setSelectedChat,
    otherUsers,
    loading,
    error,
    currentUser,
  };
};

const ChatPage: React.FC = () => {
  const {
    chats,
    selectedChat,
    setSelectedChat,
    otherUsers,
    loading,
    error,
    currentUser,
  } = useChatData();

  if (loading) {
    return (
      <Box>
        <NavBar />
        <Flex justify="center" align="center" h="calc(100vh - 80px)">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <NavBar />
        <Flex justify="center" align="center" h="calc(100vh - 80px)" p={4}>
           <Alert status="error" borderRadius="lg">
            <AlertIcon />
            {error}
          </Alert>
        </Flex>
      </Box>
    );
  }
  
  const getOtherUserInChat = (chat: any) => {
    if (!chat || !currentUser) return null;
    const otherUserId = (chat as any).participants.find((p: string) => p !== currentUser.uid);
    return otherUsers[otherUserId];
  };

  return (
    <Box h="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <NavBar />
      <Container maxW="8xl" h="calc(100vh - 80px)" p={0}>
        <Flex h="full">
          <ChatList
            chats={chats}
            currentUser={currentUser}
            otherUsers={otherUsers}
            onSelectChat={setSelectedChat}
            selectedChatId={selectedChat?.id}
          />
          <Divider orientation="vertical" />
          {selectedChat ? (
            <ChatWindow 
              key={selectedChat.id} // Add key to force re-mount on chat change
              chat={selectedChat} 
              currentUser={currentUser} 
              otherUser={getOtherUserInChat(selectedChat)} 
            />
          ) : (
            <Flex flex={1} justify="center" align="center" direction="column" textAlign="center" p={4}>
              <Heading size="lg" color={useColorModeValue('gray.400', 'gray.600')}>Select a Chat</Heading>
              <Text color={useColorModeValue('gray.500', 'gray.500')}>Choose a conversation from the list to start messaging.</Text>
            </Flex>
          )}
        </Flex>
      </Container>
    </Box>
  );
};

const ChatList: React.FC<{
  chats: any[],
  currentUser: any,
  otherUsers: Record<string, any>,
  onSelectChat: (chat: any) => void,
  selectedChatId?: string,
}> = ({ chats, currentUser, otherUsers, onSelectChat, selectedChatId }) => {
  const listBg = useColorModeValue('white', 'gray.800');
  const selectedBg = useColorModeValue('green.50', 'green.900');

  if (chats.length === 0) {
    return (
      <VStack
        w={{ base: '100%', md: '350px' }}
        bg={listBg}
        p={4}
        spacing={4}
        align="stretch"
        borderRightWidth="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <Heading size="md" mb={4}>Conversations</Heading>
        <Text color="gray.500">No chats yet. Start a conversation from a user's profile!</Text>
      </VStack>
    )
  }

  return (
    <VStack
      w={{ base: '100%', md: '350px' }}
      bg={listBg}
      p={4}
      spacing={4}
      align="stretch"
      borderRightWidth="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      overflowY="auto"
    >
      <Heading size="md" mb={4}>Conversations</Heading>
      {chats.map(chat => {
        const otherUserId = (chat as any).participants.find((p: string) => p !== currentUser.uid);
        const otherUser = otherUsers[otherUserId];

        return (
          <HStack
            key={chat.id}
            p={3}
            borderRadius="lg"
            cursor="pointer"
            onClick={() => onSelectChat(chat)}
            bg={chat.id === selectedChatId ? selectedBg : 'transparent'}
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
            transition="background 0.2s"
          >
            <Avatar src={otherUser?.photoURL} name={otherUser?.displayName} />
            <VStack align="start" spacing={0} w="full" overflow="hidden">
              <Text fontWeight="bold">{otherUser?.displayName || 'Loading...'}</Text>
              <Text fontSize="sm" color="gray.500" noOfLines={1}>
                {chat.lastMessage?.senderId === currentUser.uid && 'You: '}{chat.lastMessage?.text || 'No messages yet'}
              </Text>
            </VStack>
          </HStack>
        );
      })}
    </VStack>
  );
};

const ChatWindow: React.FC<{
  chat: any,
  currentUser: any,
  otherUser: any,
}> = ({ chat, currentUser, otherUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chat?.id) return;
    const unsubscribe = getMessagesListener(chat.id, (fetchedMessages) => {
      setMessages(fetchedMessages);
    });
    return () => unsubscribe();
  }, [chat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    await sendMessage(chat.id, currentUser.uid, newMessage);
    setNewMessage('');
  };

  const windowBg = useColorModeValue('gray.50', 'gray.900');
  const messageBoxBg = useColorModeValue('white', 'gray.800');

  return (
    <Flex flex={1} direction="column" bg={windowBg}>
      <HStack p={4} bg={messageBoxBg} borderBottomWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
        <Avatar src={otherUser?.photoURL} name={otherUser?.displayName} />
        <Heading size="md">{otherUser?.displayName || 'Chat'}</Heading>
      </HStack>
      <VStack flex={1} p={4} spacing={4} overflowY="auto">
        {messages.map(msg => (
          <Flex
            key={msg.id}
            w="full"
            justify={msg.senderId === currentUser.uid ? 'flex-end' : 'flex-start'}
          >
            <Box
              bg={msg.senderId === currentUser.uid ? 'green.500' : messageBoxBg}
              color={msg.senderId === currentUser.uid ? 'white' : useColorModeValue('black', 'white')}
              px={4}
              py={2}
              borderRadius="lg"
              maxW="70%"
              boxShadow="sm"
            >
              <Text>{msg.text}</Text>
            </Box>
          </Flex>
        ))}
        <div ref={messagesEndRef} />
      </VStack>
      <Box p={4} bg={messageBoxBg} borderTopWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
        <form onSubmit={handleSendMessage}>
          <HStack>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              borderRadius="full"
              bg={windowBg}
            />
            <IconButton
              type="submit"
              icon={<FaPaperPlane />}
              aria-label="Send message"
              colorScheme="green"
              isRound
            />
          </HStack>
        </form>
      </Box>
    </Flex>
  );
};

export default ChatPage; 