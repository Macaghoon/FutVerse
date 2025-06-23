import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Flex,
  useToast,
  Select,
  VStack,
  Text,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { app } from "../firebaseConfig";
import { sendMatchRequest } from "../utils/firestoreMatches";
import { getTeamForManager } from "../utils/firestoreTeams";
import NavBar from "../components/NavBar";

const auth = getAuth(app);

const ChallengeTeam: React.FC = () => {
  const [managerTeam, setManagerTeam] = useState<Record<string, unknown> | null>(null);
  const [matchDate, setMatchDate] = useState("");
  const [venue, setVenue] = useState("");
  const [format, setFormat] = useState<"2-halves" | "4-quarters">("2-halves");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const opponentTeam = location.state?.opponentTeam;

  useEffect(() => {
    if (!opponentTeam) {
      toast({
        title: "No opponent selected.",
        description: "Please select a team to challenge from the teams list.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      navigate("/teams");
      return;
    }

    const fetchManagerTeam = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const team = await getTeamForManager(user.uid);
          setManagerTeam(team);
        } catch (error) {
          setError("You must be a manager of a team to challenge another team.");
          console.error(error);
        }
      }
      setLoading(false);
    };

    fetchManagerTeam();
  }, [navigate, toast, opponentTeam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!managerTeam || !opponentTeam) {
      toast({
        title: "Error",
        description: "Missing team information.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await sendMatchRequest({
        requestingTeamId: String(managerTeam?.id ?? ''),
        requestingTeamName: String(managerTeam?.name ?? ''),
        opponentTeamId: String(opponentTeam?.id ?? ''),
        opponentTeamName: String(opponentTeam?.name ?? ''),
        matchDateTime: new Date(matchDate),
        venue,
        format,
      });

      toast({
        title: "Challenge Sent!",
        description: `Your match request has been sent to ${String(opponentTeam.name ?? '')}.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      navigate("/manage-team");
    } catch (error) {
      toast({
        title: "Error sending challenge",
        description: "Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
        <NavBar />
        <Flex justify="center" align="center" minH="80vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="green.500" />
            <Text>Loading...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
        <NavBar />
        <Flex justify="center" align="center" minH="80vh">
          <VStack spacing={4}>
            <Text color="red.500">{error}</Text>
            <Button onClick={() => navigate("/teams")}>
              Back to Teams
            </Button>
          </VStack>
        </Flex>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      <NavBar />
      <Flex justify="center" align="center" minH="80vh" p={4}>
        <VStack spacing={8} p={8} bg="white" rounded="lg" boxShadow="xl" w={{ base: "90%", md: "500px" }}>
          <Heading as="h1" size="lg" textAlign="center" color="gray.700">
            Challenge {String(opponentTeam?.name ?? '')}
          </Heading>
          
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={6}>
              <FormControl isRequired>
                <FormLabel>Match Date & Time</FormLabel>
                <Input
                  type="datetime-local"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Venue</FormLabel>
                <Input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Enter venue address"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Match Format</FormLabel>
                <Select value={format} onChange={(e) => setFormat(e.target.value as "2-halves" | "4-quarters")}>
                  <option value="2-halves">2 Halves (45 min each)</option>
                  <option value="4-quarters">4 Quarters (22.5 min each)</option>
                </Select>
              </FormControl>

              <Button
                type="submit"
                colorScheme="green"
                size="lg"
                w="full"
              >
                Send Challenge
              </Button>
            </VStack>
          </form>
        </VStack>
      </Flex>
    </Box>
  );
};

export default ChallengeTeam; 