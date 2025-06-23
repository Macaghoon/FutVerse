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
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../firebaseConfig";
import { sendMatchRequest } from "../utils/firestoreMatches";
import { getTeamForManager } from "../utils/firestoreTeams";
import NavBar from "../components/NavBar";

const auth = getAuth(app);
const db = getFirestore(app);

const ChallengeTeam: React.FC = () => {
  const [managerTeam, setManagerTeam] = useState<any>(null);
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
        } catch (err) {
          setError("You must be a manager of a team to challenge another team.");
          console.error(err);
        }
      }
      setLoading(false);
    };

    fetchManagerTeam();
  }, [navigate, toast, opponentTeam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!managerTeam || !opponentTeam || !opponentTeam.id) {
      setError("Opponent team information is missing. Please go back and try again.");
      setLoading(false);
      return;
    }

    try {
      await sendMatchRequest({
        requestingTeamId: managerTeam.id,
        requestingTeamName: managerTeam.name,
        opponentTeamId: opponentTeam.id,
        opponentTeamName: opponentTeam.name,
        matchDateTime: new Date(matchDate),
        venue,
        format,
      });

      toast({
        title: "Challenge Sent!",
        description: `Your match request has been sent to ${opponentTeam.name}.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      navigate(`/team/${opponentTeam.id}`);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error Sending Challenge",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box>
      <NavBar />
      <Flex align="center" justify="center" minH="calc(100vh - 80px)" bgGradient="linear(to-br, gray.50, blue.50)">
        <VStack spacing={8} p={8} bg="white" rounded="lg" boxShadow="xl" w={{ base: "90%", md: "500px" }}>
          <Heading as="h1" size="lg" textAlign="center" color="gray.700">
            Challenge {opponentTeam?.name}
          </Heading>
          
          {error && (
            <Text color="red.500" textAlign="center">{error}</Text>
          )}

          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <VStack spacing={6}>
              <FormControl isRequired>
                <FormLabel>Date and Time</FormLabel>
                <Input
                  type="datetime-local"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Venue / Location</FormLabel>
                <Input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g., Central Park Pitch 5"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Match Format</FormLabel>
                <Select value={format} onChange={(e) => setFormat(e.target.value as any)}>
                  <option value="2-halves">2 Halves (Standard)</option>
                  <option value="4-quarters">4 Quarters</option>
                </Select>
              </FormControl>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={loading}
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