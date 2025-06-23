import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  Avatar,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Flex,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  Image,
  AspectRatio,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Divider,
  SimpleGrid,
  Stack,
  Icon,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useBreakpointValue,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Switch,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  PinInput,
  PinInputField,
  Editable,
  EditablePreview,
  EditableInput,
  useEditableControls,
  ButtonGroup,
  EditableTextarea,
  useClipboard,
  useColorMode,
  useTheme,
  useToken,
  useMediaQuery,
  useUpdateEffect,
  useInterval,
  useTimeout,
  useBoolean,
  useCounter,
  Container,
} from "@chakra-ui/react";
import { FaEdit, FaTrash, FaPlus, FaCrown, FaUserTie, FaUsers, FaTrophy, FaCalendar, FaMapMarkerAlt, FaClock, FaStar, FaHeart, FaShare, FaBookmark, FaEllipsisH, FaExclamationTriangle } from "react-icons/fa";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot, addDoc, deleteDoc, writeBatch, arrayUnion, arrayRemove, increment, serverTimestamp, Timestamp, FieldValue } from "firebase/firestore";
import { app } from "../firebaseConfig";
import NavBar from "../components/NavBar";
import { useNavigate } from "react-router-dom";
import { useGlobalState } from "../context/GlobalState";
import { createTeam, getTeamWithManagerAndMembers, addPlayerToTeam, updateTeamCoverPhoto } from "../utils/firestoreTeam";
import { getMatchesForTeam, submitMatchResult, disputeMatchResult, acceptMatchRequest, declineMatchRequest, getMatchRequestsForTeam, sendMatchRequest, confirmMatchResult } from "../utils/firestoreMatches";
import type { MatchData, MatchRequestData } from "../utils/firestoreMatches";
import { uploadFileToFirebase } from "../utils/imageUpload";
import {
  getPendingRequestsForUser,
  acceptRequest,
  declineRequest,
} from "../utils/firestoreRequests";
import type { Request } from "../utils/firestoreRequests";

const auth = getAuth();
const db = getFirestore();

function ManageTeam() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  
  const bgGradient = useColorModeValue(
    "linear(to-br, gray.50, blue.50, green.50)",
    "linear(to-br, gray.900, blue.900, green.900)"
  );

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Box minH="100vh" bgGradient={bgGradient}>
        <NavBar />
        <Flex justify="center" align="center" height="80vh">
          <VStack spacing={4}>
            <Icon as={FaUsers} color="green.500" boxSize={8} />
            <Text color={useColorModeValue("gray.700", "white")}>Loading team management...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box minH="100vh" bgGradient={bgGradient}>
        <NavBar />
        <Flex justify="center" align="center" height="80vh">
          <VStack spacing={4}>
            <Icon as={FaExclamationTriangle} color="red.500" boxSize={8} />
            <Text color={useColorModeValue("gray.700", "white")}>Please log in to manage your team.</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  const userDataTyped = userData as { role?: string; teamId?: string } | null;
  
  if (!userDataTyped || userDataTyped.role !== 'manager' || !userDataTyped.teamId) {
    return (
      <Box minH="100vh" bgGradient={bgGradient}>
        <NavBar />
        <Container maxW="7xl" py={8}>
          <VStack spacing={8} textAlign="center">
            <Icon as={FaTrophy} color="green.500" boxSize={16} />
            <Heading size="2xl" color={useColorModeValue("gray.700", "white")}>
              Team Management
            </Heading>
            <Text color={useColorModeValue("gray.600", "gray.300")} fontSize="lg">
              {!userDataTyped?.teamId 
                ? "You need to create or join a team first." 
                : "Only team managers can access this page."}
            </Text>
            <Button 
              colorScheme="green" 
              size="lg"
              onClick={() => navigate("/team-registration")}
            >
              {!userDataTyped?.teamId ? "Create Team" : "Back to Home"}
            </Button>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <NavBar />
      <ManageTeamDashboard teamId={userDataTyped.teamId} managerId={user.uid} />
    </Box>
  );
}

function ManageTeamDashboard({ teamId, managerId }: { teamId: string, managerId: string }) {
  const [teamData, setTeamData] = useState<Record<string, unknown> | null>(null);
  const [applications, setApplications] = useState<Request[]>([]);
  const [matchRequests, setMatchRequests] = useState<(MatchRequestData & { id: string })[]>([]);
  const [matches, setMatches] = useState<(MatchData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  const { 
    isOpen: isResultModalOpen, 
    onOpen: onResultModalOpen, 
    onClose: onResultModalClose 
  } = useDisclosure();
  const { 
    isOpen: isCoverModalOpen, 
    onOpen: onCoverModalOpen, 
    onClose: onCoverModalClose 
  } = useDisclosure();
  
  const [selectedMatch, setSelectedMatch] = useState<(MatchData & { id: string }) | null>(null);
  
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "white");
  
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getTeamWithManagerAndMembers(teamId);
      setTeamData(data);
      
      const appRequests = await getPendingRequestsForUser(managerId);
      setApplications(appRequests.filter((req) => req.teamId === teamId));
      
      const matchReqs = await getMatchRequestsForTeam(teamId);
      setMatchRequests(matchReqs);

      const teamMatches = await getMatchesForTeam(teamId);
      setMatches(teamMatches);

    } catch (error) {
      setError("Error fetching data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [teamId, managerId]);

  const handleOpenSubmitModal = (match: MatchData & { id: string }) => {
    setSelectedMatch(match);
    onResultModalOpen();
  };

  const handleCoverPhotoUpdated = (newUrl: string) => {
    // Optimistically update the UI
    setTeamData((prevData: Record<string, unknown> | null) => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        team: {
          ...(prevData.team as Record<string, unknown>),
          coverPhotoUrl: newUrl,
        },
      };
    });
    // Close the modal
    onCoverModalClose();
  };

  const handleSubmitResult = async (result: MatchData['result']) => {
    if (!selectedMatch || !result) return;
    try {
      await submitMatchResult(selectedMatch.id, result);
      toast({ title: "Result submitted for confirmation.", status: "success" });
      onResultModalClose();
      fetchData(); // Refresh data
    } catch (error) {
      toast({ title: "Error submitting result", description: (error as Error).message, status: "error" });
    }
  };

  const handleConfirmResult = async (matchId: string) => {
    try {
      await confirmMatchResult(matchId);
      toast({ title: "Match Confirmed!", description: "Points and stats have been updated.", status: "success" });
      fetchData();
    } catch (error) {
      toast({ title: "Error confirming match", description: (error as Error).message, status: "error" });
    }
  };

  const handleDisputeResult = async (matchId: string) => {
    try {
      await disputeMatchResult(matchId);
      toast({ title: "Match Disputed", description: "The result is now marked as disputed.", status: "warning" });
      fetchData();
    } catch (error) {
      toast({ title: "Error disputing match", description: (error as Error).message, status: "error" });
    }
  };
  
  const handleAcceptApplication = async (request: Request) => {
    try {
      await acceptRequest(request.id, request.teamId, request.fromId);
      toast({
        title: "Player accepted!",
        description: `${request.fromName} has been added to your team.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setApplications(applications.filter((app) => app.id !== request.id));
    } catch (error) {
      toast({
        title: "Error accepting request.",
        description: (error as Error).message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeclineApplication = async (request: Request) => {
    try {
      await declineRequest(request.id);
      toast({
        title: "Application Declined",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      setApplications(applications.filter((app) => app.id !== request.id));
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not decline the application.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAcceptMatch = async (requestId: string) => {
    try {
      await acceptMatchRequest(requestId);
      toast({ title: "Match Accepted!", status: "success" });
      setMatchRequests(matchRequests.filter(req => req.id !== requestId));
      fetchData(); // Refresh matches
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, status: "error" });
    }
  };

  const handleDeclineMatch = async (requestId: string) => {
    try {
      await declineMatchRequest(requestId);
      toast({ title: "Match Declined", status: "info" });
      setMatchRequests(matchRequests.filter(req => req.id !== requestId));
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, status: "error" });
    }
  };

  const handleRemovePlayer = async (playerId: string, teamId: string) => {
    try {
      console.log(`[1] Starting removal for player ${playerId} from team ${teamId}`);
      const teamDocRef = doc(db, "teams", teamId);
      const teamDocSnap = await getDoc(teamDocRef);
      console.log('[2] Got team doc snapshot.');

      if (!teamDocSnap.exists()) {
        throw new Error("Could not find the team document to update.");
      }

      const data = teamDocSnap.data();
      console.log('[3] Got team data:', data);
      if (!Array.isArray(data.members)) {
        throw new Error("Team data is corrupt: 'members' is not an array.");
      }

      const newMembers = data.members.filter((memberId: string) => memberId !== playerId);
      console.log('[4] Filtered members. New list:', newMembers);
      
      const userDocRef = doc(db, "users", playerId);
      console.log('[5] Got user doc ref.');
      await updateDoc(userDocRef, { teamId: null });
      console.log('[6] Updated user doc.');
      
      await updateDoc(teamDocRef, { members: newMembers });
      console.log('[7] Updated team doc.');

      setTeamData((prev: Record<string, unknown> | null) => {
        console.log('[8] Updating local state.');
        if (!prev) return prev;
        const members = (prev.members as any[]) || [];
        const updatedMembers = members.filter((member: Record<string, unknown>) => (member.uid as string) !== playerId);
        return {
          ...prev,
          members: updatedMembers,
        };
      });
      console.log('[9] Local state updated.');

      toast({
        title: "Player Removed",
        description: "The player has been successfully kicked from the team.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      console.log('[10] Toast shown.');
    } catch (error) {
      console.error("Error during player removal process:", error);
      
      let message = "An unexpected error occurred. Please see console for details.";
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }

      toast({
        title: "Failed to remove player",
        description: message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) return (
    <Flex justify="center" align="center" minH="50vh">
      <VStack spacing={4}>
        <Icon as={FaUsers} color="green.500" boxSize={8} />
        <Text color={textColor}>Loading team data...</Text>
      </VStack>
    </Flex>
  );
  if (error) return (
    <Alert status="error" borderRadius="lg">
      <AlertIcon />
      <Text>{error}</Text>
    </Alert>
  );
  if (!teamData) return (
    <Alert status="warning" borderRadius="lg">
      <AlertIcon />
      <Text>No team data found.</Text>
    </Alert>
  );

  const team = (teamData.team ?? {}) as Record<string, unknown>;
  const finalCoverUrl = (team.coverPhotoUrl as string) || (team.logoUrl as string);

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Team Header */}
        <Card bg={cardBg} borderRadius="2xl" boxShadow="xl" overflow="hidden">
          <Box
            h="200px"
            w="100%"
            bg={finalCoverUrl ? undefined : "#b5e3fa"}
            bgImage={finalCoverUrl ? `url(${finalCoverUrl})` : undefined}
            bgSize="cover"
            bgPos="center"
            position="relative"
          />
          {finalCoverUrl && (
            <Box
              position="absolute"
              top={4}
              right={4}
            >
              <IconButton
                aria-label="Change cover photo"
                icon={<FaCamera />}
                colorScheme="whiteAlpha"
                onClick={onCoverModalOpen}
                size="sm"
              />
            </Box>
          )}
          
          <CardBody p={8}>
            <HStack justify="space-between" align="start" mb={6}>
              <VStack align="start" spacing={2}>
                <Heading size="xl" color={textColor}>
                  {team.name as string}
                </Heading>
                <Text color={useColorModeValue("gray.600", "gray.300")}>
                  Managed by {(teamData.manager as Record<string, unknown>)?.displayName as string}
                </Text>
              </VStack>
              <Button
                colorScheme="green"
                leftIcon={<FaUserPlus />}
                onClick={() => navigate("/team-registration")}
              >
                Add Player
              </Button>
            </HStack>

            <Tabs variant="enclosed" colorScheme="green">
              <TabList>
                <Tab>Overview</Tab>
                <Tab>Applications ({applications.length})</Tab>
                <Tab>Match Requests ({matchRequests.length})</Tab>
                <Tab>Matches</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <TeamOverview teamData={teamData} onRemovePlayer={handleRemovePlayer} />
                </TabPanel>
                <TabPanel>
                  <ApplicationsSection 
                    applications={applications} 
                    onAccept={handleAcceptApplication}
                    onDecline={handleDeclineApplication}
                  />
                </TabPanel>
                <TabPanel>
                  <MatchRequests 
                    requests={matchRequests}
                    onAccept={handleAcceptMatch}
                    onDecline={handleDeclineMatch}
                  />
                </TabPanel>
                <TabPanel>
                  <MatchesSection
                    matches={matches}
                    currentTeamId={teamId}
                    managerId={managerId}
                    onOpenSubmitModal={handleOpenSubmitModal}
                    onConfirm={handleConfirmResult}
                    onDispute={handleDisputeResult}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>

      {/* Cover Photo Modal */}
      <Modal isOpen={isCoverModalOpen} onClose={onCoverModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Update Cover Photo</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <AspectRatio ratio={16 / 9} w="full">
                <Image
                  src={finalCoverUrl}
                  alt="Cover Photo"
                  objectFit="cover"
                  borderRadius="md"
                />
              </AspectRatio>
              <Text fontSize="sm" color="gray.500">
                Upload a new cover photo to personalize your team profile
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Submit Result Modal */}
      {selectedMatch && (
        <SubmitResultModal
          isOpen={isResultModalOpen}
          onClose={onResultModalClose}
          match={selectedMatch}
          onSubmit={handleSubmitResult}
          managerId={managerId}
        />
      )}
    </Container>
  );
}

function TeamRegistrationPrompt() {
  const navigate = useNavigate();
  return (
    <Box>
      <Heading size="lg" mb={4}>
        <Icon as={FaTrophy} mr={2} />
        Team Registration
      </Heading>
      <Text>
        It seems like you're not a manager of a team yet. Register your team to start managing it.
      </Text>
      <Button colorScheme="green" mt={4} onClick={() => navigate("/team-registration")}>
        Register Team
      </Button>
    </Box>
  );
}

function UpdateCoverPhotoModal({ isOpen, onClose, teamId, onCoverPhotoUpdated }: {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onCoverPhotoUpdated: (newUrl: string) => void;
}) {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast({ title: "Invalid file", description: validation.error, status: 'error', duration: 3000 });
        return;
      }
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setCoverPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!coverFile) {
      toast({ title: "No file selected", status: 'warning', duration: 3000 });
      return;
    }
    setLoading(true);
    try {
      const coverUrl = await uploadFileToFirebase(coverFile, `team-cover-photos/${teamId}`);
      await updateTeamCoverPhoto(teamId, coverUrl);
      toast({ title: "Cover photo updated!", status: 'success', duration: 3000 });
      onCoverPhotoUpdated(coverUrl);
    } catch (error: any) {
      let description = "An unknown error occurred during upload.";
      if (error.message) {
        description = error.message;
      }
      toast({ 
        title: "Upload Failed", 
        description: description, 
        status: 'error', 
        duration: 9000, 
        isClosable: true 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Update Cover Photo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>New Cover Photo</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                p={1}
              />
            </FormControl>
            {coverPreview && (
              <Image 
                src={coverPreview} 
                alt="Cover preview" 
                w="100%"
                h="150px"
                objectFit="cover"
                borderRadius="lg"
              />
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="green"
            onClick={handleUpload}
            isLoading={loading}
            isDisabled={!coverFile}
          >
            Upload & Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function SubmitResultModal({ isOpen, onClose, match, onSubmit, managerId }: {
  isOpen: boolean;
  onClose: () => void;
  match: MatchData & { id: string };
  onSubmit: (result: MatchData['result']) => void;
  managerId: string;
}) {
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [scorers, setScorers] = useState<Record<string, number>>({});
  const toast = useToast();

  // Determine both team IDs and names
  const teamAId = match.requestingTeamId;
  const teamBId = match.opponentTeamId;
  const teamAName = match.requestingTeamName;
  const teamBName = match.opponentTeamName;
  const [playersByTeam, setPlayersByTeam] = useState<Record<string, any[]>>({});

  useEffect(() => {
    // Reset state when modal opens
    if (isOpen) {
      setScores([0, 0]);
      setScorers({});
    }

    // Fetch members from both teams and group by team
    const fetchBothTeams = async () => {
      if (isOpen) {
        const [teamAData, teamBData] = await Promise.all([
          getTeamWithManagerAndMembers(teamAId),
          getTeamWithManagerAndMembers(teamBId),
        ]);
        setPlayersByTeam({
          [teamAName]: teamAData?.members || [],
          [teamBName]: teamBData?.members || [],
        });
      }
    };
    fetchBothTeams();
  }, [isOpen, teamAId, teamBId, teamAName, teamBName]);

  const handleScoreChange = (teamIndex: number, value: number) => {
    const newScores = [...scores] as [number, number];
    newScores[teamIndex] = Math.max(0, value);
    setScores(newScores);
  };

  const handleScorerChange = (playerId: string, increment: number) => {
    const currentGoals = scorers[playerId] || 0;
    const newGoals = Math.max(0, currentGoals + increment);
    setScorers({ ...scorers, [playerId]: newGoals });
  };

  const handleSubmit = () => {
    const totalGoals = Object.values(scorers).reduce((sum, count) => sum + count, 0);
    const totalScore = scores[0] + scores[1];
    if (totalGoals !== totalScore) {
      toast({
        title: "Validation Error",
        description: "The number of goals assigned to scorers must match the final score.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const result: MatchData['result'] = {
      score: scores,
      scorers: Object.entries(scorers)
        .filter(([, count]) => count > 0)
        .map(([playerId, count]) => ({ playerId, count })),
      submittedBy: managerId,
    };
    onSubmit(result);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Submit Result for {match.requestingTeamName} vs {match.opponentTeamName}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6}>
            <FormControl>
              <FormLabel>Final Score</FormLabel>
              <HStack>
                <Text fontWeight="bold" w="40%">{match.requestingTeamName}</Text>
                <Input type="number" w="20%" value={scores[0]} onChange={(e) => handleScoreChange(0, parseInt(e.target.value) || 0)} textAlign="center" />
                <Text w="5%" textAlign="center">-</Text>
                <Input type="number" w="20%" value={scores[1]} onChange={(e) => handleScoreChange(1, parseInt(e.target.value) || 0)} textAlign="center" />
                <Text fontWeight="bold" w="40%" textAlign="right">{match.opponentTeamName}</Text>
              </HStack>
            </FormControl>

            <FormControl>
              <FormLabel>Goal Scorers</FormLabel>
              <VStack align="stretch" spacing={2} maxHeight="300px" overflowY="auto" p={2} borderWidth="1px" borderRadius="md">
                {Object.keys(playersByTeam).length > 0 ? (
                  Object.entries(playersByTeam).map(([teamName, players]) => (
                    <Box key={teamName} mb={2}>
                      <Text fontWeight="bold" color="green.600" mb={1}>{teamName}</Text>
                      {players.length > 0 ? (
                        players.map(player => (
                          <Flex key={player.uid} justify="space-between" align="center" mb={1}>
                            <Text>{player.displayName}</Text>
                            <HStack>
                              <IconButton aria-label="Decrease goals" icon={<FaMinus />} size="sm" onClick={() => handleScorerChange(player.uid, -1)} />
                              <Text w="2rem" textAlign="center">{scorers[player.uid] || 0}</Text>
                              <IconButton aria-label="Increase goals" icon={<FaPlus />} size="sm" onClick={() => handleScorerChange(player.uid, 1)} />
                            </HStack>
                          </Flex>
                        ))
                      ) : (
                        <Text color="gray.400" fontSize="sm">No players</Text>
                      )}
                    </Box>
                  ))
                ) : (
                  <Text color="gray.500" textAlign="center">Loading players...</Text>
                )}
              </VStack>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            Submit for Confirmation
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function TeamOverview({ teamData, onRemovePlayer }: { teamData: Record<string, unknown> | null; onRemovePlayer: (playerId: string, teamId: string) => void }) {
  const team = (teamData.team ?? {}) as Record<string, unknown>;
  const finalCoverUrl = (team.coverPhotoUrl as string) || (team.logoUrl as string);

  return (
    <Box
      h="200px"
      position="relative"
      bgImage={`url(${finalCoverUrl})`}
      bgSize="cover"
      bgPosition="center"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {/* Overlay */}
      <Box
        position="absolute"
        w="full"
        h="full"
        bg={"blackAlpha.400"}
        style={{ backdropFilter: 'blur(1px)' }}
      />

      <Avatar 
        size="2xl" 
        src={team.logoUrl} 
        name={team.name as string} 
        bg="white"
        padding="2px"
      />
    </Box>
  );
}

function ApplicationsSection({ applications, onAccept, onDecline }: {
  applications: Request[];
  onAccept: (request: Request) => void;
  onDecline: (request: Request) => void;
}) {
  return (
    <Card bg={useColorModeValue("white", "gray.800")} borderRadius="2xl" boxShadow="xl">
      <CardHeader pb={applications.length > 0 ? 4 : 2}>
        <HStack spacing={3}>
          <Icon as={FaUserPlus} color="green.500" boxSize={5} />
          <Heading size="md" color={useColorModeValue("gray.700", "white")}>
            Player Applications ({applications.length})
          </Heading>
        </HStack>
      </CardHeader>
      {applications.length > 0 && (
        <CardBody pt={0}>
          <VStack spacing={4} align="stretch">
            {applications.map((app) => (
              <Box
                key={app.id}
                p={4}
                borderWidth="1px"
                borderColor={useColorModeValue("gray.200", "gray.600")}
                borderRadius="lg"
                bg={useColorModeValue("gray.50", "gray.700")}
              >
                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="semibold" color={useColorModeValue("gray.700", "white")}>
                      {app.fromName}
                    </Text>
                    <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.300")}>
                      Wants to join your team
                    </Text>
                  </VStack>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      colorScheme="green"
                      leftIcon={<FaCheckCircle />}
                      onClick={() => onAccept(app)}
                      borderRadius="lg"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="red"
                      leftIcon={<FaTimes />}
                      onClick={() => onDecline(app)}
                      borderRadius="lg"
                    >
                      Decline
                    </Button>
                  </HStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </CardBody>
      )}
    </Card>
  );
}

function MatchRequests({ requests, onAccept, onDecline }: {
  requests: (MatchRequestData & {id: string})[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}) {
  return (
    <Card bg={useColorModeValue("white", "gray.800")} borderRadius="2xl" boxShadow="xl">
      <CardHeader pb={requests.length > 0 ? 4 : 2}>
        <HStack spacing={3}>
          <Icon as={FaCalendarCheck} color="green.500" boxSize={5} />
          <Heading size="md" color={useColorModeValue("gray.700", "white")}>
            Match Requests ({requests.length})
          </Heading>
        </HStack>
      </CardHeader>
      {requests.length > 0 && (
        <CardBody pt={0}>
          <VStack spacing={4} align="stretch">
            {requests.map((req) => {
              if (!req.matchDateTime) {
                return (
                  <Alert key={req.id} status="error" borderRadius="lg">
                    <AlertIcon />
                    <Text>Invalid match request data for team: {req.requestingTeamName}. Please delete and recreate.</Text>
                  </Alert>
                )
              }
              const matchDateTime = req.matchDateTime.toDate();
              return (
                <Box
                  key={req.id}
                  p={4}
                  borderWidth="1px"
                  borderColor={useColorModeValue("gray.200", "gray.600")}
                  borderRadius="lg"
                  bg={useColorModeValue("gray.50", "gray.700")}
                >
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={2}>
                      <HStack spacing={2}>
                        <Icon as={FaFutbol} color="green.500" />
                        <Text fontWeight="bold" color={useColorModeValue("gray.700", "white")}>
                          vs. {req.requestingTeamName}
                        </Text>
                      </HStack>
                      <HStack spacing={2} color={useColorModeValue("gray.600", "gray.300")}>
                        <Icon as={FaCalendarAlt} />
                        <Text fontSize="sm">
                          {matchDateTime.toLocaleDateString()} at {matchDateTime.toLocaleTimeString()}
                        </Text>
                      </HStack>
                      <HStack spacing={2} color={useColorModeValue("gray.600", "gray.300")}>
                        <Icon as={FaMapMarkerAlt} />
                        <Text fontSize="sm">
                          {req.venue} | {req.format}
                        </Text>
                      </HStack>
                    </VStack>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="green"
                        leftIcon={<FaCheckCircle />}
                        onClick={() => onAccept(req.id)}
                        borderRadius="lg"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        leftIcon={<FaTimes />}
                        onClick={() => onDecline(req.id)}
                        borderRadius="lg"
                      >
                        Decline
                      </Button>
                    </HStack>
                  </HStack>
                </Box>
              );
            })}
          </VStack>
        </CardBody>
      )}
    </Card>
  );
}

function MatchesSection({ matches, currentTeamId, managerId, onOpenSubmitModal }: {
  matches: (MatchData & { id: string })[];
  currentTeamId: string;
  managerId: string;
  onOpenSubmitModal: (match: MatchData & { id: string }) => void;
}) {
  const now = new Date();

  const upcomingMatches = matches
    .filter(m => m.status === 'scheduled' && m.matchDateTime && m.matchDateTime.toDate() > now)
    .sort((a, b) => a.matchDateTime.toMillis() - b.matchDateTime.toMillis());

  const actionRequiredMatches = matches
    .filter(m => 
        m.status === 'pending_confirmation' || 
        m.status === 'disputed' ||
        (m.status === 'scheduled' && m.matchDateTime && m.matchDateTime.toDate() <= now)
    )
    .sort((a, b) => a.matchDateTime.toMillis() - b.matchDateTime.toMillis());

  const historyMatches = matches
    .filter(m => m.status === 'confirmed')
    .sort((a, b) => b.matchDateTime.toMillis() - a.matchDateTime.toMillis());

  const MatchList: React.FC<{
      matchList: (MatchData & { id: string })[],
      emptyText: string
  }> = ({ matchList, emptyText }) => (
    matchList.length > 0 ? (
      <VStack spacing={4} align="stretch">
        {matchList.map(match => (
          <MatchCard 
            key={match.id} 
            match={match}
            currentTeamId={currentTeamId}
            managerId={managerId}
            onOpenSubmitModal={onOpenSubmitModal}
          />
        ))}
      </VStack>
    ) : (
      <Box textAlign="center" py={8}>
        <Icon as={FaFutbol} color="gray.400" boxSize={12} mb={4} />
        <Text color="gray.500">{emptyText}</Text>
      </Box>
    )
  );

  return (
    <Card bg={useColorModeValue("white", "gray.800")} borderRadius="2xl" boxShadow="xl">
      <CardHeader pb={4}>
        <HStack spacing={3}>
          <Icon as={FaFutbol} color="green.500" boxSize={5} />
          <Heading size="md" color={useColorModeValue("gray.700", "white")}>
            Matches
          </Heading>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <Tabs isFitted variant="enclosed" colorScheme="green">
          <TabList borderRadius="lg" overflow="hidden">
            <Tab _selected={{ color: 'white', bg: 'green.500' }}>
              <HStack spacing={2}>
                <Text>Upcoming</Text>
                <Badge colorScheme="green" variant="solid" borderRadius="full" fontSize="xs">
                  {upcomingMatches.length}
                </Badge>
              </HStack>
            </Tab>
            <Tab _selected={{ color: 'white', bg: 'orange.500' }}>
              <HStack spacing={2}>
                <Text>Action Required</Text>
                <Badge colorScheme="orange" variant="solid" borderRadius="full" fontSize="xs">
                  {actionRequiredMatches.length}
                </Badge>
              </HStack>
            </Tab>
            <Tab _selected={{ color: 'white', bg: 'gray.500' }}>
              <HStack spacing={2}>
                <Text>History</Text>
                <Badge colorScheme="gray" variant="solid" borderRadius="full" fontSize="xs">
                  {historyMatches.length}
                </Badge>
              </HStack>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
                <MatchList matchList={upcomingMatches} emptyText="No upcoming matches scheduled." />
            </TabPanel>
            <TabPanel>
                <MatchList matchList={actionRequiredMatches} emptyText="No matches requiring action." />
            </TabPanel>
            <TabPanel>
                 <MatchList matchList={historyMatches} emptyText="No completed matches yet." />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </CardBody>
    </Card>
  );
}

function MatchCard({ match, currentTeamId, managerId, onOpenSubmitModal }: {
  match: MatchData & { id: string };
  currentTeamId: string;
  managerId: string;
  onOpenSubmitModal: (match: MatchData & { id: string }) => void;
}) {
  if (!match.matchDateTime) {
    return (
       <Box p={4} borderWidth="1px" borderRadius="lg">
        <Text color="red.500">Invalid match data for {match.requestingTeamName} vs {match.opponentTeamName}. Please have the requester delete and recreate it.</Text>
      </Box>
    )
  }
  const matchDateTime = match.matchDateTime.toDate(); // Convert Firestore Timestamp to JS Date
  const isRequestingManager = match.requestingTeamId === currentTeamId && match.manager.uid === managerId;
  const isOpponentManager = match.opponentTeamId === currentTeamId && match.manager.uid === managerId;
  const matchDateHasPassed = matchDateTime < new Date();

  const renderStatusBadge = () => {
    switch (match.status) {
      case "scheduled":
         if (!matchDateHasPassed) {
           return <Badge colorScheme="blue">Scheduled</Badge>;
         }
         return <Badge colorScheme="yellow">Awaiting Result</Badge>;
      case "pending_confirmation":
        return <Badge colorScheme="orange">Pending Confirmation</Badge>;
      case "confirmed":
        return <Badge colorScheme="green">Confirmed</Badge>;
      case "disputed":
        return <Badge colorScheme="red">Disputed</Badge>;
      default:
        return null;
    }
  };

  const renderActions = () => {
    if (match.status === 'scheduled' && matchDateHasPassed && isRequestingManager) {
      return <Button size="sm" colorScheme="blue" onClick={() => onOpenSubmitModal(match)}>Submit Result</Button>;
    }
    if (match.status === 'pending_confirmation' && isOpponentManager) {
      return (
        <HStack>
          <Button size="sm" colorScheme="green" onClick={() => onOpenSubmitModal(match)}>Confirm</Button>
          <Button size="sm" colorScheme="red" onClick={() => onOpenSubmitModal(match)}>Dispute</Button>
        </HStack>
      );
    }
    if (match.status === 'pending_confirmation' && isRequestingManager) {
      return <Text fontSize="xs" color="gray.500">Waiting for opponent to confirm.</Text>;
    }
    return null;
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" display="flex" justifyContent="space-between" alignItems="center">
      <Box>
        <HStack align="center" mb={1}>
          <Text fontWeight="bold" fontSize="lg">
            {match.requestingTeamName} vs {match.opponentTeamName}
          </Text>
          {renderStatusBadge()}
        </HStack>
        <Text fontSize="sm" color="gray.500">
          {matchDateTime.toLocaleDateString()} at {matchDateTime.toLocaleTimeString()} | Venue: {match.venue}
        </Text>
        {match.status === 'pending_confirmation' && match.result && (
          <Text fontSize="sm" mt={2}>
            Submitted Score: <b>{match.result?.score.join(' - ')}</b>
          </Text>
        )}
        {match.status === 'confirmed' && match.result && (
           <Text fontSize="sm" mt={2}>
            Final Score: <b>{match.result?.score.join(' - ')}</b>
          </Text>
        )}
      </Box>
      <Box>{renderActions()}</Box>
    </Box>
  );
}

export default ManageTeam;