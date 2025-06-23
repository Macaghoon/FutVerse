import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Avatar,
  Flex,
  useColorModeValue,
  Spinner,
  VStack,
  SimpleGrid,
  Badge,
  Button,
  useToast,
  Container,
  Card,
  CardBody,
  HStack,
  Divider,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getTeamWithManagerAndMembers } from "../utils/firestoreTeam";
import NavBar from "../components/NavBar";
import { 
  FaTrophy, 
  FaUserTie, 
  FaUsers, 
  FaUserPlus, 
  FaFutbol,
  FaEye,
} from "react-icons/fa";
import { Icon } from "@chakra-ui/react";
import { sendRequest } from "../utils/firestoreRequests";
import { getMatchesForTeam } from "../utils/firestoreMatches";
import type { MatchData } from "../utils/firestoreMatches";

const auth = getAuth();
const db = getFirestore();

const TeamProfile: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState<any>(null);
  const [matches, setMatches] = useState<(MatchData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const toast = useToast();

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId) {
        navigate("/teams"); // Redirect if no teamId is provided
        return;
      }
      try {
        const data = await getTeamWithManagerAndMembers(teamId);
        setTeamData(data);
        const matchData = await getMatchesForTeam(teamId);
        setMatches(matchData);
      } catch (error) {
        console.error("Failed to fetch team data:", error);
      }
      setLoading(false);
    };
    fetchTeamData();
  }, [teamId, navigate]);

  useEffect(() => {
    // Also fetch the currently logged-in user's data
    const fetchCurrentUser = async () => {
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          let teamName = null;
          // If the user is a manager, fetch their team name
          if (userData.role === 'manager' && userData.teamId) {
            const teamDocRef = doc(db, "teams", userData.teamId);
            const teamDoc = await getDoc(teamDocRef);
            if (teamDoc.exists()) {
              teamName = teamDoc.data().name;
            }
          }
          setCurrentUserData({ id: userDoc.id, ...userData, teamName });
        }
      }
    };
    fetchCurrentUser();
  }, []);

  const handleApply = async () => {
    if (!currentUserData || !teamData || !teamId) return;

    try {
      await sendRequest(
        "application",
        currentUserData.id,
        currentUserData.displayName,
        teamData.manager.uid,
        teamId,
        teamData.team.name
      );
      toast({
        title: "Application sent.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: "Error sending application.",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={bgColor}>
        <NavBar />
        <Flex justify="center" align="center" minH="80vh">
          <Spinner size="xl" color="green.500" />
        </Flex>
      </Box>
    );
  }

  if (!teamData) {
    return (
      <Box minH="100vh" bg={bgColor}>
        <NavBar />
        <Flex justify="center" align="center" minH="80vh">
          <Heading>Team Not Found</Heading>
        </Flex>
      </Box>
    );
  }

  const { team, manager, members } = teamData;
  const coverPhotoUrl = team.coverPhotoUrl || team.logoUrl;

  const canApply = currentUserData?.role === "player" && !currentUserData?.teamId;
  const canRequestMatch = currentUserData?.role === "manager" && currentUserData?.teamId && currentUserData?.teamId !== teamId;

  return (
    <Box minH="100vh" bg={bgColor}>
      <NavBar />
      <Container maxW="6xl" py={8}>
        {/* Team Header Card */}
        <Card
          bg={cardBg}
          borderRadius="2xl"
          boxShadow="xl"
          mb={8}
          overflow="hidden"
        >
          {/* Cover Photo Banner */}
          <Box
            h={{ base: "150px", md: "200px" }}
            position="relative"
            bgImage={`url(${coverPhotoUrl})`}
            bgSize="cover"
            bgPosition="center"
          >
            <Box
              position="absolute"
              w="full"
              h="full"
              bg="blackAlpha.400"
              style={{ backdropFilter: 'blur(3px)' }}
            />
            <Flex
              position="absolute"
              bottom={{ base: 4, md: 6 }}
              left={{ base: 4, md: 6 }}
              align="center"
              gap={4}
            >
              <Avatar
                size="xl"
                src={team.logoUrl}
                name={team.name}
                bg="gray.300"
                color="white"
                showBorder
                borderColor={cardBg}
              />
              <VStack align="flex-start" spacing={1}>
                <Heading size="lg" color="white" textShadow="1px 1px 3px black">
                  {team.name}
                </Heading>
                <Text color="gray.200" textShadow="1px 1px 2px black">
                  {team.points || 0} Points
                </Text>
              </VStack>
            </Flex>
            
            {/* Action Buttons */}
            <Flex
              position="absolute"
              bottom={{ base: 4, md: 6 }}
              right={{ base: 4, md: 6 }}
              gap={3}
            >
              {canApply && (
                <Button 
                  leftIcon={<FaUserPlus />} 
                  colorScheme="green"
                  onClick={handleApply}
                >
                  Apply to Join
                </Button>
              )}
              {canRequestMatch && (
                <Button
                  leftIcon={<FaFutbol />}
                  colorScheme="blue"
                  onClick={() => navigate('/challenge-team', { state: { opponentTeam: { ...team, id: teamId } } })}
                >
                  Challenge Team
                </Button>
              )}
            </Flex>
          </Box>
        </Card>

        {/* Page Content */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {/* Left Column (Manager & Roster) */}
          <VStack spacing={6} align="stretch">
            {/* Manager Card */}
            <Card bg={cardBg} borderRadius="xl" boxShadow="lg">
              <CardBody>
                <HStack spacing={4} justify="space-between">
                  <HStack spacing={4}>
                    <Avatar src={manager.photoURL} name={manager.displayName} />
                    <Box>
                      <Text fontSize="sm" color="gray.500">
                        Team Manager
                      </Text>
                      <Text fontWeight="bold" fontSize="lg">
                        {manager.displayName}
                      </Text>
                    </Box>
                  </HStack>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                    leftIcon={<FaEye />}
                    onClick={() => navigate(`/profile/${manager.uid}`)}
                  >
                    View
                  </Button>
                </HStack>
              </CardBody>
            </Card>

            {/* Roster Card */}
            <Card bg={cardBg} borderRadius="xl" boxShadow="lg">
              <CardBody>
                <HStack mb={4} spacing={4}>
                  <Icon as={FaUsers} w={6} h={6} color="green.400" />
                  <Heading size="md">Team Roster</Heading>
                  <Badge colorScheme="green" variant="solid" fontSize="md">
                    {members.length}
                  </Badge>
                </HStack>
                <Divider my={4} />
                <VStack divider={<Divider />} spacing={4} align="stretch">
                  {members.map((member: any) => (
                    <Flex
                      key={member.uid}
                      align="center"
                      justify="space-between"
                      p={2}
                      borderRadius="md"
                      _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                      cursor="pointer"
                      onClick={() => navigate(`/profile/${member.uid}`)}
                    >
                      <HStack>
                        <Avatar
                          size="sm"
                          name={member.displayName}
                          src={member.photoURL}
                        />
                        <Text fontWeight="medium">{member.displayName}</Text>
                      </HStack>
                      <Badge
                        colorScheme={
                          member.role === "manager" ? "purple" : "gray"
                        }
                      >
                        {member.role}
                      </Badge>
                    </Flex>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </VStack>

          {/* Right Column (Team Info) */}
          <Box gridColumn={{ base: 1, md: "span 2" }}>
            <Card bg={cardBg} borderRadius="xl" boxShadow="lg">
              <CardBody>
                <HStack mb={4} spacing={4}>
                  <Icon as={FaTrophy} w={6} h={6} color="yellow.400" />
                  <Heading size="md">Team Stats</Heading>
                </HStack>
                <Divider my={4} />
                <SimpleGrid columns={2} spacing={4}>
                  <Box p={4} bg={useColorModeValue("gray.50", "gray.700")} borderRadius="lg">
                    <Text fontSize="sm" color="gray.500">Points</Text>
                    <Text fontSize="2xl" fontWeight="bold">{team.points || 0}</Text>
                  </Box>
                  <Box p={4} bg={useColorModeValue("gray.50", "gray.700")} borderRadius="lg">
                    <Text fontSize="sm" color="gray.500">Members</Text>
                    <Text fontSize="2xl" fontWeight="bold">{members.length}</Text>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>
            <MatchHistory matches={matches} currentTeamId={teamId} />
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

const MatchHistory: React.FC<{ matches: (MatchData & { id: string })[], currentTeamId: string | undefined }> = ({ matches, currentTeamId }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const confirmedMatches = matches.filter(m => m.status === 'confirmed' && m.result);

  if (confirmedMatches.length === 0) {
    return null; // Don't render the card if there's no history
  }

  return (
    <Card bg={cardBg} borderRadius="xl" boxShadow="lg" mt={8}>
      <CardBody>
        <HStack mb={4} spacing={4}>
          <Icon as={FaTrophy} w={6} h={6} color="purple.400" />
          <Heading size="md">Match History</Heading>
        </HStack>
        <Divider my={4} />
        <VStack spacing={4} align="stretch">
          {confirmedMatches.map(match => {
            const isHomeTeam = match.requestingTeamId === currentTeamId;
            const homeScore = match.result!.score[0];
            const awayScore = match.result!.score[1];

            const opponentName = isHomeTeam ? match.opponentTeamName : match.requestingTeamName;
            
            let result: 'Win' | 'Loss' | 'Draw' = 'Draw';
            let resultColorScheme = 'gray';

            if (isHomeTeam) {
              if (homeScore > awayScore) {
                result = 'Win';
                resultColorScheme = 'green';
              } else if (homeScore < awayScore) {
                result = 'Loss';
                resultColorScheme = 'red';
              }
            } else { // Is away team
              if (awayScore > homeScore) {
                result = 'Win';
                resultColorScheme = 'green';
              } else if (awayScore < homeScore) {
                result = 'Loss';
                resultColorScheme = 'red';
              }
            }

            return (
              <Flex 
                key={match.id} 
                justify="space-between" 
                align="center" 
                p={3}
                bg={useColorModeValue("gray.50", "gray.700")}
                borderRadius="lg"
              >
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">vs {opponentName}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {new Date(match.matchDateTime.seconds * 1000).toLocaleDateString()}
                  </Text>
                </VStack>
                <HStack>
                  <Text fontWeight="bold" fontSize="lg">
                    {homeScore} - {awayScore}
                  </Text>
                  <Badge colorScheme={resultColorScheme} variant="solid" p={2} borderRadius="md">
                    {result}
                  </Badge>
                </HStack>
              </Flex>
            );
          })}
        </VStack>
      </CardBody>
    </Card>
  );
}

export default TeamProfile; 