import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Avatar,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Button,
  Link,
  Icon,
  Input,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Flex,
  Divider,
  Tooltip,
  FormControl,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Image,
  Spinner,
  useToast,
  Stat,
  StatNumber,
  StatLabel,
  SimpleGrid,
  IconButton,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, updateProfile } from "firebase/auth";
import {
  FaUser,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTrophy,
  FaUsers,
  FaFutbol,
  FaStar,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaEnvelopeOpenText,
  FaUserPlus,
  FaCog,
  FaFutbol as FaFootball,
  FaShieldAlt,
  FaInfo,
  FaPhone,
  FaCamera,
  FaCheck,
  FaEye,
  FaUserTie,
} from "react-icons/fa";
import NavBar from "../components/NavBar";
import { getTeamWithManagerAndMembers } from "../utils/firestoreTeam";
import { sendRequest } from "../utils/firestoreRequests";
import { getOrCreateChat } from "../utils/firestoreChat";
import { addUserPost, getUserPosts, deleteUserPost } from '../utils/firestoreUserPosts';
import { uploadFileToFirebase } from '../utils/imageUpload';

const db = getFirestore();
const auth = getAuth();

const TABS = [
  { label: "Personal", icon: FaUser },
  { label: "Football", icon: FaFootball },
  { label: "Team", icon: FaShieldAlt },
  { label: "Settings", icon: FaCog },
];

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "gray.800");
  const [profile, setProfile] = useState<any>(null);
  const [teamData, setTeamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [managerTeamData, setManagerTeamData] = useState<any>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string>("");
  const [postCaption, setPostCaption] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [recruiting, setRecruiting] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate("/home");
      return;
    }
    const loadUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile(userData);
          setForm(userData);
          if (userData.teamId) {
            const team = await getTeamWithManagerAndMembers(userData.teamId);
            setTeamData(team);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
      setLoading(false);
    };
    loadUserProfile();
  }, [userId, navigate]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCurrentUserData({ id: userDoc.id, ...data });
          if (data.role === "manager" && data.teamId) {
            const team = await getTeamWithManagerAndMembers(data.teamId);
            setManagerTeamData(team);
          }
        }
      }
    };
    fetchCurrentUser();
  }, [auth.currentUser]);

  // Fetch posts
  useEffect(() => {
    if (!userId) return;
    setLoadingPosts(true);
    getUserPosts(userId).then(posts => {
      setPosts(posts);
      setLoadingPosts(false);
    });
  }, [userId]);

  // Add post handler
  const handleAddPost = async () => {
    if (!auth.currentUser || !postImage) return;
    try {
      await addUserPost(auth.currentUser.uid, postImage, postCaption);
      setPostImage(null);
      setPostImagePreview("");
      setPostCaption("");
      onClose();
      // Refresh posts
      setLoadingPosts(true);
      const newPosts = await getUserPosts(auth.currentUser.uid);
      setPosts(newPosts);
      setLoadingPosts(false);
      toast({ title: 'Post added!', status: 'success', duration: 2000 });
    } catch (e) {
      toast({ title: 'Failed to add post', status: 'error', duration: 3000 });
    }
  };

  // Delete post handler
  const handleDeletePost = async (postId: string, imageUrl: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteUserPost(auth.currentUser.uid, postId, imageUrl);
      setPosts(posts.filter(p => p.id !== postId));
      toast({ title: 'Post deleted', status: 'info', duration: 2000 });
    } catch (e) {
      toast({ title: 'Failed to delete post', status: 'error', duration: 3000 });
    }
  };

  const handleRecruit = async () => {
    if (!currentUserData || !profile || !userId || !managerTeamData) return;
    setRecruiting(true);
    try {
      await sendRequest(
        "recruitment",
        currentUserData.id,
        currentUserData.displayName,
        userId,
        currentUserData.teamId,
        managerTeamData.team.name
      );
      console.log("Recruitment request sent.");
      toast({ title: 'Recruitment request sent!', status: 'success', duration: 2000 });
    } catch (error: any) {
      console.error("Error sending request:", error.message);
      if (error.message && error.message.includes('pending request already exists')) {
        toast({ title: 'Request is pending', description: 'A recruitment request for this player is already pending.', status: 'info', duration: 3000 });
      } else {
        toast({ title: 'Failed to send recruitment request', status: 'error', duration: 3000 });
      }
    }
    setRecruiting(false);
  };

  const handleStartChat = async () => {
    if (!currentUserData || !userId) return;
    try {
      const chatId = await getOrCreateChat(currentUserData.id, userId);
      navigate("/chat", { state: { openChatId: chatId } });
    } catch (error: any) {
      console.error("Error starting chat:", error.message);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;
    try {
      const url = await uploadFileToFirebase(file, `user-photos/${auth.currentUser.uid}`);
      await updateProfile(auth.currentUser, { photoURL: url });
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { photoURL: url });
      setProfile((prev: any) => ({ ...prev, photoURL: url }));
      toast({ title: 'Profile photo updated!', status: 'success', duration: 2000 });
    } catch (err: any) {
      toast({ title: 'Failed to update photo', description: err.message, status: 'error', duration: 3000 });
    }
  };

  if (loading || !profile) {
    return <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}><NavBar /><Box h="80vh" /></Box>;
  }

  // --- LAYOUT STARTS HERE ---
  console.log('auth.currentUser?.uid', auth.currentUser?.uid, 'profile.uid', profile.uid);
  return (
    <Box minH="100vh" bgGradient="linear(to-br, blue.50, green.50, white)" pb={8}>
      <NavBar />
      <Flex maxW="6xl" mx="auto" mt={8} gap={8} px={2} direction={{ base: "column", md: "row" }} align="flex-start">
        {/* Left: Player Card */}
        <Box
          bg={cardBg}
          borderRadius="2xl"
          boxShadow="lg"
          minW={{ base: "100%", md: 340 }}
          maxW={{ base: "100%", md: 340 }}
          w={{ base: "100%", md: 340 }}
          p={0}
          overflow="hidden"
          pb={6}
          position={{ base: 'static', md: 'sticky' }}
          top={{ base: undefined, md: 8 }}
          alignSelf={{ base: 'auto', md: 'flex-start' }}
        >
          {/* Gradient header */}
          <Box h="80px" w="100%" bgGradient="linear(to-r, #38b2ac, #4299e1)" borderTopLeftRadius="2xl" borderTopRightRadius="2xl" position="relative" />
          {/* Avatar - overlaps gradient and card */}
          <Flex justify="center" align="center" mt={-12} mb={2} direction="column">
            <Avatar 
              size="xl" 
              src={profile.photoURL}
              name={profile.displayName}
              borderWidth={4}
              borderColor={cardBg}
              bg={cardBg}
            />
          </Flex>
          <VStack spacing={2} mb={4} px={6} align="center" position="relative">
            <Heading size="lg" color="green.700" fontWeight="extrabold" textAlign="center">
              {profile.displayName}
            </Heading>
            <Text color="gray.400" fontSize="md" textAlign="center">
              {profile.email}
            </Text>
            {/* Experience Level Badge */}
            {profile.experienceLevel && (
              <Box display="flex" justifyContent="center" mt={2} mb={2}>
                <Badge colorScheme="green" variant="subtle" px={3} py={1} borderRadius="full" fontWeight="bold" fontSize="sm" letterSpacing={1}>
                  {profile.experienceLevel.toUpperCase()}
                </Badge>
              </Box>
            )}
            {/* Goals Scored Section */}
            <Box textAlign="center" p={3} bg="#FFFEF3" borderRadius="lg" border="1px solid" borderColor="#FFE28A" mb={4} mt={2} w="100%">
              <Stat>
                <StatNumber fontSize="2xl" color="#A97A1A" fontWeight="bold">
                  {profile.goals !== undefined ? profile.goals : 0}
                </StatNumber>
                <StatLabel fontSize="md" color="#A97A1A">
                  Goals Scored
                </StatLabel>
              </Stat>
            </Box>
            {/* Badges */}

            {/* Team card header: icon + team name, then role label below, with colored box and matching size/font */}
            {teamData && teamData.team && (
              <Box mb={1} mt={0.5} bg="#eaf6fd" border="1.5px solid #b5e3fa" borderRadius="12px" px={4} py={2} minH="60px" w="100%" display="flex" flexDirection="column" justifyContent="center">
                <HStack spacing={2} align="center" h="32px">
                  <Icon as={FaUser} color="#3182ce" boxSize={5} />
                  <Text fontWeight={700} color="#1a365d" fontSize="20px">{teamData.team.name}</Text>
                </HStack>
                {teamData.manager && (() => {
                  const member = teamData.members.find((m: any) => m.uid === profile.uid);
                  if (!member) return null;
                  if (teamData.manager.uid === profile.uid) {
                    return (
                      <Text color="#3182ce" fontSize="16px" fontWeight={500} mt={1} ml={6}>Manager</Text>
                    );
                  } else {
                    return (
                      <Text color="#3182ce" fontSize="16px" fontWeight={500} mt={1} ml={6}>Player</Text>
                    );
                  }
                })()}
              </Box>
            )}
            {/* Message Button */}
            {auth.currentUser?.uid !== userId && (
              <Button
                colorScheme="green"
                leftIcon={<FaEnvelopeOpenText />}
                borderRadius="lg"
                fontWeight="bold"
                fontSize="md"
                w="full"
                mt={0.5}
                mb={1}
                onClick={handleStartChat}
                _hover={{ bg: "green.500" }}
                transition="all 0.2s"
              >
                Message
              </Button>
            )}
            {/* Recruit Button: Only show if current user is a manager, viewed user is not in a team, and not viewing own profile */}
            {currentUserData && currentUserData.role === 'manager' && !profile.teamId && auth.currentUser?.uid !== userId && (
              <Button
                colorScheme="blue"
                borderRadius="lg"
                fontWeight="bold"
                fontSize="md"
                w="full"
                mt={1}
                mb={1}
                onClick={handleRecruit}
                isLoading={recruiting}
                _hover={{ bg: "blue.500" }}
                transition="all 0.2s"
              >
                Recruit
              </Button>
            )}
          </VStack>
          {/* Team Card Lite below player card */}
          {teamData && teamData.team && (
            <Box mt={6} w="100%" display="flex" justifyContent="center">
              <Box
                bg="#eaf6fd"
                border="1.5px solid #b5e3fa"
                borderRadius="16px"
                boxShadow="0 2px 8px rgba(0,0,0,0.04)"
                p={0}
                position="relative"
                minW="320px"
                maxW="360px"
                textAlign="center"
                overflow="hidden"
              >
                {/* Cover Photo (always show if available) */}
                <Box position="relative" h="110px" w="100%" borderTopLeftRadius="16px" borderTopRightRadius="16px" overflow="hidden">
                  <Box
                    h="110px"
                    w="100%"
                    bg={teamData.team.coverPhotoUrl ? undefined : "#b5e3fa"}
                    bgImage={teamData.team.coverPhotoUrl ? `url(${teamData.team.coverPhotoUrl})` : undefined}
                    bgSize="cover"
                    bgPos="center"
                  />
                  {teamData.team.coverPhotoUrl && (
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      w="100%"
                      h="100%"
                      bg="rgba(0,0,0,0.35)"
                    />
                  )}
                </Box>
                {/* Overlapping Team Logo */}
                <Avatar
                  src={teamData.team.logoUrl}
                  name={teamData.team.name}
                  size="xl"
                  position="absolute"
                  top="85px"
                  left="50%"
                  transform="translateX(-50%)"
                  border="4px solid white"
                  boxShadow="0 4px 16px rgba(0,0,0,0.10)"
                  bg="white"
                  zIndex={2}
                />
                {/* Spacer to push content below logo */}
                <Box h="64px" />
                <Box px={6} pb={5} pt={2}>
                  <Text fontWeight="bold" fontSize="2xl" color="#1a365d" mt={2} mb={1} noOfLines={1}>
                    {teamData.team.name}
                  </Text>
                  <HStack justify="center" spacing={6} mb={4} mt={2}>
                    <HStack spacing={1}>
                      <Icon as={FaTrophy} color="#b7791f" boxSize={5} />
                      <Text color="#b7791f" fontWeight="bold" fontSize="md" ml={1}>{teamData.team.points || 0}</Text>
                      <Text color="#b7791f" fontSize="sm" ml={1}>Points</Text>
                    </HStack>
                    <HStack spacing={1}>
                      <Icon as={FaUsers} color="#3182ce" boxSize={5} />
                      <Text color="#1a365d" fontWeight="bold" fontSize="md" ml={1}>{teamData.members.length}</Text>
                      <Text color="#3182ce" fontSize="sm" ml={1}>Members</Text>
                    </HStack>
                  </HStack>
                  <Button
                    variant="outline"
                    colorScheme="green"
                    size="lg"
                    borderRadius="lg"
                    fontWeight="bold"
                    fontSize="lg"
                    w="100%"
                    boxShadow="0 2px 8px rgba(0,0,0,0.06)"
                    onClick={() => {
                      if (teamData.team?.id) {
                        navigate(`/team/${teamData.team.id}`);
                      }
                    }}
                    mt={1}
                  >
                    Visit Team
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Right: Essentials only */}
        <Box
          bg={cardBg}
          borderRadius="2xl"
          boxShadow="lg"
          flex={1}
          minW={0}
          p={{ base: 4, md: 8 }}
        >
          {/* View Profile Info Button for owner */}
          {auth.currentUser?.uid === userId && (
            <>
              <Button colorScheme="blue" leftIcon={<FaUser />} borderRadius="lg" mb={4} onClick={onOpen}>
                View Profile Info
              </Button>
              <Modal isOpen={isOpen} onClose={onClose} size="md">
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>Profile Information</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <VStack spacing={4} align="center">
                      <Avatar size="xl" src={profile.photoURL} name={profile.displayName} />
                      <Text fontWeight="bold">{profile.displayName}</Text>
                      <Text color="gray.400">{profile.email}</Text>
                      <Button
                        size="sm"
                        colorScheme="teal"
                        variant="outline"
                        onClick={() => document.getElementById('profile-photo-input')?.click()}
                      >
                        Change Photo
                      </Button>
                      <Input
                        id="profile-photo-input"
                        type="file"
                        accept="image/*"
                        display="none"
                        onChange={handlePhotoUpload}
                      />
                    </VStack>
                  </ModalBody>
                </ModalContent>
              </Modal>
            </>
          )}
          <VStack spacing={4} align="flex-start">
            <Heading size="md" color="green.700">About</Heading>
            <Text color="gray.700" fontSize="md">
              {profile.bio && profile.bio.trim() !== "" ? profile.bio : <span style={{ color: '#A0AEC0' }}>No bio yet. Add something about yourself!</span>}
            </Text>
            {profile.location && (
              <HStack color="gray.500" fontSize="sm">
                <Icon as={FaMapMarkerAlt} />
                <Text>{profile.location}</Text>
              </HStack>
            )}
            {/* Socials */}
            {profile.socialMedia && Object.keys(profile.socialMedia).length > 0 && (
              <HStack spacing={2} pt={2}>
                {profile.socialMedia.facebook && (
                  <Link href={profile.socialMedia.facebook} isExternal _hover={{ textDecoration: "underline" }} transition="all 0.2s"><Icon as={FaFacebook} color="blue.500" boxSize={5} /></Link>
                )}
                {profile.socialMedia.twitter && (
                  <Link href={profile.socialMedia.twitter} isExternal _hover={{ textDecoration: "underline" }} transition="all 0.2s"><Icon as={FaTwitter} color="blue.400" boxSize={5} /></Link>
                )}
                {profile.socialMedia.instagram && (
                  <Link href={profile.socialMedia.instagram} isExternal _hover={{ textDecoration: "underline" }} transition="all 0.2s"><Icon as={FaInstagram} color="pink.400" boxSize={5} /></Link>
                )}
                {profile.socialMedia.linkedin && (
                  <Link href={profile.socialMedia.linkedin} isExternal _hover={{ textDecoration: "underline" }} transition="all 0.2s"><Icon as={FaLinkedin} color="blue.700" boxSize={5} /></Link>
                )}
              </HStack>
            )}
            {/* Add Post Button (only for owner) */}
            {auth.currentUser?.uid === userId && (
              <Button colorScheme="green" leftIcon={<FaCamera />} borderRadius="lg" onClick={onOpen} mt={2}>
                Add Post
              </Button>
            )}
          </VStack>
          {/* Posts Grid/List */}
          <Box mt={6}>
            <Heading size="md" mb={4} color="green.700">Posts</Heading>
            {loadingPosts ? (
              <Text>Loading...</Text>
            ) : posts.length === 0 ? (
              <Text color="gray.500">No posts yet.</Text>
            ) : (
              <SimpleGrid columns={1} spacing={8} justifyItems="center">
                {posts.map((post) => (
                  <Box key={post.id} borderWidth={1} borderRadius="2xl" overflow="hidden" bg={cardBg} boxShadow="2xl" maxW="650px" w="100%" mx="auto" my={4}>
                    <Image src={post.imageUrl} w="100%" maxH="420px" minH="300px" objectFit="cover" />
                    <Box p={8}>
                      <Text mb={6} fontSize="2xl" fontWeight="bold">{post.caption}</Text>
                      <Text fontSize="lg" color="gray.400" mb={3}>{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ''}</Text>
                      {auth.currentUser?.uid === userId && (
                        <Button size="lg" colorScheme="red" mt={2} onClick={() => handleDeletePost(post.id, post.imageUrl)}>
                          Delete
                        </Button>
                      )}
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Box>
        </Box>
      </Flex>
      {/* Add Post Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add a Post</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Input type="file" accept="image/*" onChange={e => {
                const file = e.target.files?.[0];
                setPostImage(file || null);
                if (file) {
                  const reader = new FileReader();
                  reader.onload = ev => setPostImagePreview(ev.target?.result as string);
                  reader.readAsDataURL(file);
                } else {
                  setPostImagePreview("");
                }
              }} />
              {postImagePreview && <Image src={postImagePreview} alt="Preview" borderRadius="md" w="100%" h="140px" objectFit="cover" />}
              <Input placeholder="Caption" value={postCaption} onChange={e => setPostCaption(e.target.value)} />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" mr={3} onClick={handleAddPost} isDisabled={!postImage}>
              Post
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default UserProfile; 