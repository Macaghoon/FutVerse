import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  VStack,
  Text,
  Button,
  Flex,
  useColorModeValue,
  Spinner,
  HStack,
  useToast,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { getAuth } from "firebase/auth";
import {
  getPendingRequestsForUser,
  acceptRequest,
  declineRequest,
} from "../utils/firestoreRequests";
import NavBar from "../components/NavBar";
import { FaUserPlus, FaEnvelopeOpenText } from "react-icons/fa";
import { Icon } from "@chakra-ui/react";
import { useGlobalState } from "../context/GlobalState";

const auth = getAuth();

export interface Request {
    id: string;
    type: 'recruitment' | 'application';
    fromId: string;
    fromName: string;
    toId: string;
    teamId: string;
    teamName: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: any;
}

const Notifications: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const { markNotificationsAsRead } = useGlobalState();

  // Mark notifications as read when component mounts
  useEffect(() => {
    if (auth.currentUser) {
      markNotificationsAsRead();
    }
  }, [markNotificationsAsRead]);

  const fetchRequests = async () => {
    if (auth.currentUser) {
      try {
        const userRequests = await getPendingRequestsForUser(auth.currentUser.uid);
        setRequests(userRequests as Request[]);
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchRequests();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAccept = async (request: Request) => {
    const playerId = request.type === "recruitment" ? request.toId : request.fromId;
    try {
      await acceptRequest(request.id, request.teamId, playerId);
      toast({
        title: "Request accepted!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // Refresh the list
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error accepting request.",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await declineRequest(requestId);
      toast({
        title: "Request declined.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      // Refresh the list
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error declining request.",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box minH="100vh" bg={bgColor}>
      <NavBar />
      <Box maxW="3xl" mx="auto" py={8} px={4}>
        <Heading
          size="2xl"
          color={useColorModeValue("green.700", "green.400")}
          mb={8}
          textAlign="center"
        >
          Notifications
        </Heading>
        {loading ? (
          <Flex justify="center">
            <Spinner size="xl" color="green.500" />
          </Flex>
        ) : requests.length === 0 ? (
          <Alert status="info" borderRadius="lg">
            <AlertIcon />
            You have no pending notifications.
          </Alert>
        ) : (
          <VStack spacing={4} align="stretch">
            {requests.map((req) => (
              <Box key={req.id} bg={cardBg} p={5} borderRadius="lg" boxShadow="md">
                <Flex align="center" justify="space-between">
                  <Box>
                    <HStack mb={2}>
                      <Icon as={req.type === 'recruitment' ? FaUserPlus : FaEnvelopeOpenText} color="green.500" />
                      <Text fontWeight="bold">
                        {req.type === "recruitment"
                          ? "Recruitment Offer"
                          : "Team Application"}
                      </Text>
                    </HStack>
                    <Text>
                      {req.type === "recruitment"
                        ? `${req.fromName} has invited you to join ${req.teamName}.`
                        : `${req.fromName} has applied to join ${req.teamName}.`}
                    </Text>
                  </Box>
                  <HStack>
                    <Button
                      colorScheme="green"
                      size="sm"
                      onClick={() => handleAccept(req)}
                    >
                      Accept
                    </Button>
                    <Button
                      colorScheme="red"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecline(req.id)}
                    >
                      Decline
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
};

export default Notifications; 