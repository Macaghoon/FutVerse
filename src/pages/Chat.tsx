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
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import NavBar from '../components/NavBar';
import { getMessagesListener, sendMessage, listenForUserChats } from '../utils/firestoreChat';
import type { Message, ChatData } from '../utils/firestoreChat';
import { useLocation } from 'react-router-dom';
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

  // 2. Fetch user data for all participants
  useEffect(() => {
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

    const usersToFetch = new Set<string>();
    chats.forEach(chat => {
      const otherUserId = (chat as any).participants.find((p: string) => p !== currentUser?.uid);
      if (otherUserId && !otherUsers[otherUserId]) {
        usersToFetch.add(otherUserId);
      }
    });

    if (usersToFetch.size > 0) {
      fetchNewUsers();
    }
  }, [chats, currentUser, otherUsers]);

  // 3. Handle chat selection from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatId = params.get('chat');
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setSelectedChat(chat);
      }
    } else if (chats.length > 0 && !selectedChat) {
      setSelectedChat(chats[0]);
    }
  }, [chats, location.search, selectedChat]);

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

const Chat: React.FC = () => {
  const {
    chats,
    selectedChat,
    setSelectedChat,
    otherUsers,
    loading,
    error,
    currentUser,
  } = useChatData();

  if (!currentUser) {
    return (
      <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        <NavBar />
        <Flex justify="center" align="center" minH="80vh">
          <VStack spacing={4}>
            <Heading>Please log in to access chat</Heading>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        <NavBar />
        <Flex justify="center" align="center" minH="80vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="green.500" />
            <Text>Loading conversations...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        <NavBar />
        <Flex justify="center" align="center" minH="80vh">
          <VStack spacing={4}>
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              {error}
            </Alert>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (chats.length === 0) {
    return (
      <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        <NavBar />
        <Flex justify="center" align="center" minH="80vh">
          <VStack spacing={4}>
            <Heading>No conversations yet</Heading>
            <Text>Start chatting with other players!</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  const getOtherUserInChat = (chat: ChatData) => {
    if (!chat || !currentUser) return null;
    const otherUserId = (chat as any).participants.find((p: string) => p !== currentUser.uid);
    return otherUsers[otherUserId];
  };

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <NavBar />
      <Container maxW="7xl" py={8}>
        <Flex h="calc(100vh - 200px)" bg={useColorModeValue('white', 'gray.800')} borderRadius="lg" overflow="hidden" boxShadow="xl">
          {/* Chat List */}
          <ChatList
            chats={chats}
            currentUser={currentUser}
            otherUsers={otherUsers}
            onSelectChat={setSelectedChat}
            selectedChat={selectedChat}
          />

          {/* Chat Window */}
          {selectedChat && (
            <ChatWindow
              chat={selectedChat}
              currentUser={currentUser}
              otherUser={getOtherUserInChat(selectedChat)}
            />
          )}
        </Flex>
      </Container>
    </Box>
  );
};

const ChatList: React.FC<{
  chats: ChatData[];
  currentUser: User;
  otherUsers: Record<string, User>;
  onSelectChat: (chat: ChatData) => void;
  selectedChat: ChatData | null;
}> = ({ chats, currentUser, otherUsers, onSelectChat, selectedChat }) => {
  const sidebarBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <VStack w="300px" bg={sidebarBg} borderRightWidth="1px" borderColor={borderColor} spacing={0}>
      <Box p={4} w="full" borderBottomWidth="1px" borderColor={borderColor}>
        <Heading size="md" mb={4}>Conversations</Heading>
        {chats.map(chat => {
          const otherUserId = (chat as any).participants.find((p: string) => p !== currentUser.uid);
          const otherUser = otherUsers[otherUserId];

          return (
            <Box
              key={chat.id}
              p={3}
              cursor="pointer"
              bg={selectedChat?.id === chat.id ? useColorModeValue('blue.50', 'blue.900') : 'transparent'}
              borderRadius="md"
              mb={2}
              onClick={() => onSelectChat(chat)}
              _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
            >
              <HStack spacing={3}>
                <Avatar size="sm" src={otherUser?.photoURL || undefined} name={otherUser?.displayName || undefined} />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontWeight="medium" fontSize="sm">
                    {otherUser?.displayName || 'Unknown User'}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          );
        })}
      </Box>
    </VStack>
  );
};

const ChatWindow: React.FC<{
  chat: ChatData,
  currentUser: User,
  otherUser: User | null,
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
        <Avatar src={otherUser?.photoURL || undefined} name={otherUser?.displayName || undefined} />
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

export default Chat; 