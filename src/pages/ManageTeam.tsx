import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Flex,
  Text,
  Avatar,
  Button,
  SimpleGrid,
  Divider,
  useColorModeValue,
  HStack,
  Input,
  IconButton,
  FormControl,
  FormLabel,
  VStack,
  Image,
  useToast,
  Container,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Badge,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { createTeam, getTeamWithManagerAndMembers, updateTeamCoverPhoto } from "../utils/firestoreTeam";
import { uploadFileToFirebase, validateImageFile } from "../utils/imageUpload";
import {
  getPendingRequestsForUser,
  acceptRequest,
  declineRequest,
} from "../utils/firestoreRequests";
import type { Request } from "../utils/firestoreRequests";
import NavBar from "../components/NavBar";
import { 
  FaTrophy, 
  FaUserPlus, 
  FaUsers, 
  FaCamera, 
  FaUserTie, 
  FaEnvelope, 
  FaCalendarCheck, 
  FaFutbol, 
  FaPlus, 
  FaMinus,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTrash,
  FaImage,
  FaExclamationTriangle,
  FaEye,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";
import { Icon } from "@chakra-ui/react";
import {
  acceptMatchRequest,
  declineMatchRequest,
  getMatchRequestsForTeam,
  getMatchesForTeam,
  submitMatchResult,
  confirmMatchResult,
  disputeMatchResult,
} from "../utils/firestoreMatches";
import type { MatchRequestData, MatchData } from "../utils/firestoreMatches";

const auth = getAuth();
const db = getFirestore();

function ManageTeam() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const bgGradient = useColorModeValue(
    "linear(to-br, gray.50, blue.50, green.50)",
    "linear(to-br, gray.900, blue.900, green.900)"
  );

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

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <NavBar />
      <Container maxW="7xl" py={8}>
        {user && userData ? (
          userData.role === "manager" && userData.teamId ? (
            <ManageTeamDashboard teamId={userData.teamId} managerId={user.uid} />
          ) : (
            <TeamRegistrationForm onRegistered={() => window.location.reload()} />
          )
        ) : (
          <Flex justify="center" align="center" minH="60vh">
            <VStack spacing={4}>
              <Icon as={FaExclamationTriangle} color="red.500" boxSize={8} />
              <Text color={useColorModeValue("gray.700", "white")}>Please log in to manage your team.</Text>
            </VStack>
          </Flex>
        )}
      </Container>
    </Box>
  );
}

function ManageTeamDashboard({ teamId, managerId }: { teamId: string, managerId: string }) {
  const [teamData, setTeamData] = useState<any>(null);
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
  const mutedTextColor = useColorModeValue("gray.600", "gray.300");
  
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

    } catch (err) {
      setError("Error fetching data.");
      console.error(err);
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
    setTeamData((prevData: any) => ({
      ...prevData,
      team: {
        ...prevData.team,
        coverPhotoUrl: newUrl,
      },
    }));
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
    } catch (error: any) {
      toast({ title: "Error submitting result", description: error.message, status: "error" });
    }
  };

  const handleConfirmResult = async (matchId: string) => {
    try {
      await confirmMatchResult(matchId);
      toast({ title: "Match Confirmed!", description: "Points and stats have been updated.", status: "success" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error confirming match", description: error.message, status: "error" });
    }
  };

  const handleDisputeResult = async (matchId: string) => {
    try {
      await disputeMatchResult(matchId);
      toast({ title: "Match Disputed", description: "The result is now marked as disputed.", status: "warning" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error disputing match", description: error.message, status: "error" });
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
    } catch (err) {
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
    } catch (error: any) {
      toast({ title: "Error", description: error.message, status: "error" });
    }
  };

  const handleDeclineMatch = async (requestId: string) => {
    try {
      await declineMatchRequest(requestId);
      toast({ title: "Match Declined", status: "info" });
      setMatchRequests(matchRequests.filter(req => req.id !== requestId));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, status: "error" });
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

      setTeamData((prev: any) => {
        console.log('[8] Updating local state.');
        const updatedMembers = prev.members.filter((member: any) => member.uid !== playerId);
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
    } catch (e: unknown) {
      console.error("Error during player removal process:", e);
      
      let message = "An unexpected error occurred. Please see console for details.";
      if (e instanceof Error) {
        message = e.message;
      } else if (typeof e === 'string') {
        message = e;
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

  const { team } = teamData;
  const finalCoverUrl = team.coverPhotoUrl || team.logoUrl;

  return (
    <React.Fragment>
      {/* Header Section */}
      <VStack spacing={6} mb={8}>
        <Box textAlign="center">
          <Heading 
            size="2xl" 
            bgGradient="linear(to-r, green.400, blue.500)"
            bgClip="text"
            fontWeight="black"
            mb={2}
            py={2}
          >
            Team Management
          </Heading>
          <Text color={mutedTextColor} fontSize="lg">
            Manage your team, players, and matches
          </Text>
        </Box>
      </VStack>

      {/* Team Overview Card */}
      <Card
        bg={cardBg}
        borderRadius="2xl"
        boxShadow="xl"
        mb={8}
        overflow="hidden"
      >
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

          <IconButton
            aria-label="Change cover photo"
            icon={<FaCamera />}
            position="absolute"
            top={4}
            right={4}
            size="sm"
            colorScheme="whiteAlpha"
            borderRadius="full"
            onClick={onCoverModalOpen}
          />

          <VStack spacing={4} position="relative" zIndex={1} textAlign="center">
              <Avatar 
                size="2xl" 
                src={team.logoUrl} 
                name={team.name} 
              bg="white"
              padding="2px"
            />
            <Heading size="lg" color="white" textShadow="1px 1px 3px rgba(0,0,0,0.4)">
              {team.name}
            </Heading>
          </VStack>
        </Box>

        <CardBody>
          <HStack spacing={4} justify="space-around" py={2}>
            <HStack>
              <Icon as={FaTrophy} color="yellow.400" boxSize={8} />
              <Stat>
                <StatNumber fontSize="2xl" fontWeight="bold">
                  {team.points || 0}
                </StatNumber>
                <StatLabel color={mutedTextColor}>Team Points</StatLabel>
              </Stat>
            </HStack>
            <Divider orientation="vertical" h="50px" />
            <HStack>
              <Icon as={FaUsers} color="cyan.400" boxSize={8} />
              <Stat>
                <StatNumber fontSize="2xl" fontWeight="bold">
                  {teamData.members.length}
                </StatNumber>
                <StatLabel color={mutedTextColor}>Members</StatLabel>
              </Stat>
            </HStack>
          </HStack>
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} alignItems="start">
        <VStack spacing={8} align="stretch">
          <ManagerCard manager={teamData.manager} />
          <PlayerApplications
            applications={applications}
            onAccept={handleAcceptApplication}
            onDecline={handleDeclineApplication}
          />
          <MatchRequests
            requests={matchRequests}
            onAccept={handleAcceptMatch}
            onDecline={handleDeclineMatch}
          />
        </VStack>
        <VStack spacing={8} align="stretch">
          <MatchesSection
            matches={matches}
            currentTeamId={teamId}
            managerId={managerId}
            onOpenSubmitModal={handleOpenSubmitModal}
            onConfirm={handleConfirmResult}
            onDispute={handleDisputeResult}
            teamData={teamData}
          />
          <CurrentSquad
            members={teamData.members}
            managerId={teamData.manager.uid}
            onRemovePlayer={handleRemovePlayer}
            teamId={teamId}
          />
        </VStack>
      </SimpleGrid>

      {selectedMatch && (
        <SubmitResultModal
          isOpen={isResultModalOpen}
          onClose={onResultModalClose}
          match={selectedMatch}
          onSubmit={handleSubmitResult}
          teamData={teamData}
          managerId={managerId}
        />
      )}

      <UpdateCoverPhotoModal
        isOpen={isCoverModalOpen}
        onClose={onCoverModalClose}
        teamId={teamId}
        onCoverPhotoUpdated={handleCoverPhotoUpdated}
      />
    </React.Fragment>
  );
}

function TeamRegistrationForm({ onRegistered }: { onRegistered: (teamId: string) => void }) {
  const [teamName, setTeamName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setError(validation.error || "Invalid file");
        return;
      }
      
      if (type === 'logo') {
      setLogoFile(file);
      } else {
        setCoverFile(file);
      }
      setError("");
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (type === 'logo') {
          setLogoPreview(event.target?.result as string);
        } else {
          setCoverPreview(event.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!teamName) {
      setError("Team name is required.");
      return;
    }
    setLoading(true);
    setError("");
    
    try {
      let logoUrl = "";
      let coverUrl = "";
      
      if (logoFile) {
        logoUrl = await uploadFileToFirebase(logoFile, `team-logos/${teamName}`);
      }
      if (coverFile) {
        coverUrl = await uploadFileToFirebase(coverFile, `team-cover-photos/${teamName}`);
      }
      
      const teamId = await createTeam(teamName, logoUrl, coverUrl);
      onRegistered(teamId);
      
      toast({
        title: "Team created successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
    setLoading(false);
  };

  const cardBg = useColorModeValue("white", "gray.800");

  return (
    <Card bg={cardBg} borderRadius="2xl" boxShadow="xl" p={8} maxW="lg" mx="auto" mt={8}>
      <form onSubmit={handleSubmit}>
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading 
              size="xl" 
              bgGradient="linear(to-r, green.400, blue.500)"
              bgClip="text"
              fontWeight="black"
            >
              Register Your Team
            </Heading>
            <Text color={useColorModeValue("gray.600", "gray.300")}>
              Create your team to get started
            </Text>
          </Box>
      
          <FormControl isRequired>
        <FormLabel>Team Name</FormLabel>
        <Input 
          placeholder="Enter team name" 
          value={teamName} 
          onChange={e => setTeamName(e.target.value)} 
              borderRadius="lg"
        />
      </FormControl>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <FormControl>
        <FormLabel>Team Logo</FormLabel>
              <VStack spacing={3}>
          {logoPreview && (
              <Image 
                src={logoPreview} 
                alt="Logo preview" 
                    boxSize="100px"
                    objectFit="cover"
                    borderRadius="full"
                    border="2px solid"
                    borderColor="gray.200"
                  />
          )}
          <Input
            type="file"
            accept="image/*"
                  onChange={(e) => handleFileChange(e, 'logo')}
            display="none"
            id="logo-upload"
          />
          <Button
            as="label"
            htmlFor="logo-upload"
            leftIcon={<FaCamera />}
            colorScheme="blue"
            variant="outline"
            w="100%"
            cursor="pointer"
                  borderRadius="lg"
          >
            {logoFile ? "Change Logo" : "Upload Logo"}
          </Button>
              </VStack>
      </FormControl>

            <FormControl>
              <FormLabel>Team Cover Photo</FormLabel>
              <VStack spacing={3}>
                {coverPreview && (
                  <Image 
                    src={coverPreview} 
                    alt="Cover preview" 
                    w="100%"
                    h="100px"
                    objectFit="cover"
                    borderRadius="lg"
                    border="2px solid"
                    borderColor="gray.200"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'cover')}
                  display="none"
                  id="cover-upload"
                />
                <Button
                  as="label"
                  htmlFor="cover-upload"
                  leftIcon={<FaImage />}
                  colorScheme="purple"
                  variant="outline"
                  w="100%"
                  cursor="pointer"
                  borderRadius="lg"
                >
                  {coverFile ? "Change Cover" : "Upload Cover"}
                </Button>
              </VStack>
            </FormControl>
          </SimpleGrid>

          {error && <Alert status="error" borderRadius="lg"><AlertIcon />{error}</Alert>}
      
      <Button 
        type="submit" 
        colorScheme="green" 
        isLoading={loading}
        w="100%"
            size="lg"
            borderRadius="lg"
            leftIcon={<FaPlus />}
      >
        Register Team
      </Button>
        </VStack>
      </form>
    </Card>
  );
}

const ManagerCard: React.FC<{ manager: any }> = ({ manager }) => {
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "white");
  const mutedTextColor = useColorModeValue("gray.600", "gray.300");
  
  return (
    <Card bg={cardBg} borderRadius="2xl" boxShadow="xl" overflow="hidden">
      <Box
        bgGradient="linear(to-r, green.400, blue.500)"
        h="80px"
        position="relative"
      />
      <CardBody pt={0}>
        <VStack spacing={4} mt="-40px">
        <Avatar
          size="xl"
          src={manager?.photoURL}
          name={manager?.displayName}
            borderWidth={4}
            borderColor="white"
            boxShadow="lg"
        />
          <Box textAlign="center">
            <Heading size="lg" color={textColor} mb={2}>
          {manager?.displayName || "N/A"}
        </Heading>
            <HStack justify="center" spacing={2} color={mutedTextColor} mb={4}>
              <Icon as={FaUserTie} color="green.500" />
              <Text fontSize="sm">Team Manager</Text>
            </HStack>
            <HStack justify="center" spacing={2} color={mutedTextColor} mb={4}>
              <Icon as={FaEnvelope} />
              <Text fontSize="sm">{manager?.email || "No email provided"}</Text>
            </HStack>
        <Button
          colorScheme="green"
          variant="outline"
          size="sm"
              leftIcon={<FaEye />}
              borderRadius="lg"
              onClick={() => navigate(`/user/${manager.uid}`)}
        >
          View Profile
        </Button>
      </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

const PlayerApplications: React.FC<{
  applications: Request[];
  onAccept: (request: Request) => void;
  onDecline: (request: Request) => void;
}> = ({ applications, onAccept, onDecline }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "white");

  return (
    <Card bg={cardBg} borderRadius="2xl" boxShadow="xl">
      <CardHeader pb={applications.length > 0 ? 4 : 2}>
        <HStack spacing={3}>
          <Icon as={FaUserPlus} color="green.500" boxSize={5} />
          <Heading size="md" color={textColor}>
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
                    <Text fontWeight="semibold" color={textColor}>
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
};

const MatchRequests: React.FC<{
  requests: (MatchRequestData & {id: string})[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}> = ({ requests, onAccept, onDecline }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "white");
  const mutedTextColor = useColorModeValue("gray.600", "gray.300");

  return (
    <Card bg={cardBg} borderRadius="2xl" boxShadow="xl">
      <CardHeader pb={requests.length > 0 ? 4 : 2}>
        <HStack spacing={3}>
          <Icon as={FaCalendarCheck} color="green.500" boxSize={5} />
          <Heading size="md" color={textColor}>
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
                        <Text fontWeight="bold" color={textColor}>
                          vs. {req.requestingTeamName}
                        </Text>
                      </HStack>
                      <HStack spacing={2} color={mutedTextColor}>
                        <Icon as={FaCalendarAlt} />
                <Text fontSize="sm">
                  {matchDateTime.toLocaleDateString()} at {matchDateTime.toLocaleTimeString()}
                </Text>
                      </HStack>
                      <HStack spacing={2} color={mutedTextColor}>
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
};

const MatchesSection: React.FC<{
  matches: (MatchData & { id: string })[];
  currentTeamId: string;
  managerId: string;
  onOpenSubmitModal: (match: MatchData & { id: string }) => void;
  onConfirm: (matchId: string) => void;
  onDispute: (matchId: string) => void;
  teamData: any;
}> = ({ matches, currentTeamId, managerId, onOpenSubmitModal, onConfirm, onDispute, teamData }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "white");
  
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
        onConfirm={onConfirm}
        onDispute={onDispute}
        teamData={teamData}
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
    <Card bg={cardBg} borderRadius="2xl" boxShadow="xl">
      <CardHeader pb={4}>
        <HStack spacing={3}>
          <Icon as={FaFutbol} color="green.500" boxSize={5} />
          <Heading size="md" color={textColor}>
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
};

const MatchCard: React.FC<{
  match: MatchData & { id: string };
  currentTeamId: string;
  managerId: string;
  onOpenSubmitModal: (match: MatchData & { id: string }) => void;
  onConfirm: (matchId: string) => void;
  onDispute: (matchId: string) => void;
  teamData: any;
}> = ({ match, currentTeamId, managerId, onOpenSubmitModal, onConfirm, onDispute, teamData }) => {
  if (!match.matchDateTime) {
    return (
       <Box p={4} borderWidth="1px" borderRadius="lg">
        <Text color="red.500">Invalid match data for {match.requestingTeamName} vs {match.opponentTeamName}. Please have the requester delete and recreate it.</Text>
      </Box>
    )
  }
  const matchDateTime = match.matchDateTime.toDate(); // Convert Firestore Timestamp to JS Date
  const isRequestingManager = match.requestingTeamId === currentTeamId && teamData.manager.uid === managerId;
  const isOpponentManager = match.opponentTeamId === currentTeamId && teamData.manager.uid === managerId;
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
          <Button size="sm" colorScheme="green" onClick={() => onConfirm(match.id)}>Confirm</Button>
          <Button size="sm" colorScheme="red" onClick={() => onDispute(match.id)}>Dispute</Button>
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
};

const SubmitResultModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  match: MatchData & { id: string };
  onSubmit: (result: MatchData['result']) => void;
  teamData: any; // Contains members of both teams
  managerId: string;
}> = ({ isOpen, onClose, match, onSubmit, managerId }) => {
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
};

const CurrentSquad: React.FC<{
  members: any[];
  managerId: string;
  onRemovePlayer: (playerId: string, teamId: string) => void;
  teamId: string;
}> = ({ members, managerId, onRemovePlayer, teamId }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "white");
  
  return (
    <Card bg={cardBg} borderRadius="2xl" boxShadow="xl">
      <CardHeader pb={4}>
        <HStack spacing={3}>
          <Icon as={FaUsers} color="green.500" boxSize={5} />
          <Heading size="md" color={textColor}>
            Current Squad ({members.length})
      </Heading>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
      {members.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Icon as={FaUsers} color="gray.400" boxSize={12} mb={4} />
            <Text color="gray.500">
          No players in your squad yet. Add some above!
        </Text>
          </Box>
      ) : (
        <VStack align="stretch" spacing={3}>
          {members.map((player: any) => (
              <HStack
              key={player.uid}
              p={3}
                bg={useColorModeValue("gray.50", "gray.700")}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={useColorModeValue("gray.200", "gray.600")}
                justify="space-between"
                align="center"
              >
                <HStack spacing={3}>
                  <Avatar size="sm" name={player.displayName} src={player.photoURL} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold" color={textColor}>
                      {player.displayName}
                    </Text>
                    {player.uid === managerId && (
                      <Badge colorScheme="yellow" variant="subtle" size="sm">
                        Manager
                      </Badge>
                    )}
                  </VStack>
                </HStack>
                {player.uid !== managerId && (
                  <IconButton
                    aria-label="Remove player"
                    icon={<FaTrash />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => onRemovePlayer(player.uid, teamId)}
                    borderRadius="full"
                  />
                )}
              </HStack>
          ))}
        </VStack>
      )}
      </CardBody>
    </Card>
  );
};

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

export default ManageTeam;