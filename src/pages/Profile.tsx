import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  Avatar,
  VStack,
  HStack,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Divider,
  Badge,
  IconButton,
  useToast,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Spacer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Switch,
  Link,
  Image as ChakraImage,
  Alert,
  AlertIcon,
  Container,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { getAuth, updateProfile } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaCalendarAlt,
  FaTrophy,
  FaUsers,
  FaCog,
  FaHeart,
  FaShieldAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaFutbol,
  FaStar,
  FaBell,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUserEdit,
  FaSignOutAlt,
  FaTrash,
  FaCamera,
} from "react-icons/fa";
import { Icon } from "@chakra-ui/react";
import NavBar from "../components/NavBar";
import { uploadFileToFirebase, validateImageFile } from "../utils/imageUpload";
import { getTeamWithManagerAndMembers } from "../utils/firestoreTeam";
import { addUserPost, getUserPosts, deleteUserPost } from '../utils/firestoreUserPosts';

const auth = getAuth();
const db = getFirestore();

interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  location?: string;
  bio?: string;
  position?: string;
  experienceLevel?: string;
  favoriteTeam?: string;
  yearsPlaying?: number;
  goals?: number;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  notifications?: {
    email?: boolean;
    push?: boolean;
    teamUpdates?: boolean;
  };
  privacy?: {
    profilePublic?: boolean;
    showEmail?: boolean;
    showPhone?: boolean;
  };
  uid?: string;
}

interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt?: any;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teamData, setTeamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postLoading, setPostLoading] = useState(false);
  const [isPostModalOpen, setPostModalOpen] = useState(false);
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postPreview, setPostPreview] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();

  const bgGradient = useColorModeValue(
    "linear(to-br, gray.50, blue.50, green.50)",
    "linear(to-br, gray.900, blue.900, green.900)"
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.700", "white");
  const mutedTextColor = useColorModeValue("gray.600", "gray.300");

  const isOwner = user && profile && user.uid === profile.uid;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserProfile(currentUser.uid);
        await loadTeamData(currentUser.uid);
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfile({
          uid: userDoc.id,
          displayName: userData.displayName || user?.displayName || "",
          email: userData.email || user?.email || "",
          photoURL: userData.photoURL || user?.photoURL || "",
          phoneNumber: userData.phoneNumber || userData.phone || "",
          dateOfBirth: userData.dateOfBirth || "",
          location: userData.location || "",
          bio: userData.bio || "",
          position: userData.position || "",
          experienceLevel: userData.experienceLevel || "",
          favoriteTeam: userData.favoriteTeam || "",
          yearsPlaying: userData.yearsPlaying || 0,
          goals: userData.goals || 0,
          socialMedia: userData.socialMedia || {},
          notifications: userData.notifications || {
            email: true,
            push: true,
            teamUpdates: true
          },
          privacy: userData.privacy || {
            profilePublic: true,
            showEmail: false,
            showPhone: false
          }
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadTeamData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.teamId) {
          const team = await getTeamWithManagerAndMembers(userData.teamId);
          setTeamData(team);
        }
      }
    } catch (error) {
      console.error("Error loading team data:", error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setProfilePhoto(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && auth.currentUser) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast({ title: "Invalid Image", description: validation.error, status: "error" });
        return;
      }
      setPhotoLoading(true);
      try {
        const photoURL = await uploadFileToFirebase(file, `user-photos/${auth.currentUser.uid}`);
        
        await updateProfile(auth.currentUser, { photoURL });
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userDocRef, {
          photoURL: photoURL
        });
        
        setProfile(prev => prev ? { ...prev, photoURL: photoURL } : null);
        toast({ title: "Profile photo updated!", status: "success" });

      } catch (error) {
        toast({ title: "Upload Failed", description: String(error), status: "error" });
      } finally {
        setPhotoLoading(false);
      }
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoLoading(true);
    try {
      const url = await uploadFileToFirebase(file, `user-photos/${user.uid}`);
      await updateProfile(user, { photoURL: url });
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
      setProfile(prev => prev ? { ...prev, photoURL: url } : prev);
      setPhotoPreview("");
      toast({ title: 'Profile photo updated!', status: 'success', duration: 2000 });
    } catch (err: any) {
      toast({ title: 'Failed to update photo', description: err.message, status: 'error', duration: 3000 });
    }
    setPhotoLoading(false);
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: profile.displayName });

      // Update Firestore user document
      await updateDoc(doc(db, "users", user.uid), {
        displayName: profile.displayName,
        phoneNumber: profile.phoneNumber,
        dateOfBirth: profile.dateOfBirth,
        location: profile.location,
        bio: profile.bio,
        position: profile.position,
        experienceLevel: profile.experienceLevel,
        favoriteTeam: profile.favoriteTeam,
        yearsPlaying: profile.yearsPlaying,
        socialMedia: profile.socialMedia,
        notifications: profile.notifications,
        privacy: profile.privacy
      });

      setEditing(false);
      toast({
        title: "Profile updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const fetchPosts = async () => {
    setPostLoading(true);
    try {
      if (user?.uid) {
        const userPostsRaw = await getUserPosts(user.uid);
        const userPosts: Post[] = userPostsRaw.map((p: any) => ({
          id: p.id,
          imageUrl: p.imageUrl || '',
          caption: p.caption || '',
          createdAt: p.createdAt,
        }));
        setPosts(userPosts);
      }
    } finally {
      setPostLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchPosts();
  }, [user]);

  const handleAddPost = async () => {
    if (!postImage) return;
    setPostLoading(true);
    try {
      await addUserPost(user.uid, postImage, postCaption);
      setPostImage(null);
      setPostPreview('');
      setPostCaption('');
      setPostModalOpen(false);
      fetchPosts();
      toast({ title: 'Post added!', status: 'success' });
    } catch (e) {
      toast({ title: 'Failed to add post', status: 'error' });
    } finally {
      setPostLoading(false);
    }
  };

  const handleDeletePost = async (postId: string, imageUrl: string) => {
    setPostLoading(true);
    try {
      await deleteUserPost(user.uid, postId, imageUrl);
      fetchPosts();
      toast({ title: 'Post deleted', status: 'info' });
    } catch (e) {
      toast({ title: 'Failed to delete post', status: 'error' });
    } finally {
      setPostLoading(false);
    }
  };

  const handlePostImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPostPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bgGradient={bgGradient}>
        <NavBar />
        <Flex minH="100vh" align="center" justify="center">
          <VStack spacing={4}>
            <Icon as={FaUser} color="green.500" boxSize={8} />
            <Text color={textColor}>Loading your profile...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (!user || !profile) {
    return (
      <Box minH="100vh" bgGradient={bgGradient}>
        <NavBar />
        <Flex minH="100vh" align="center" justify="center">
          <VStack spacing={4}>
            <Icon as={FaExclamationTriangle} color="red.500" boxSize={8} />
            <Text color={textColor}>No user info available.</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <NavBar />
      
      <Container maxW="7xl" py={8}>
        {/* Header Section */}
        <VStack spacing={6} mb={8}>
          <Box textAlign="center">
            <Heading 
              size="2xl" 
              bgGradient="linear(to-r, green.400, blue.500)"
              bgClip="text"
              fontWeight="black"
              mb={2}
            >
              Your Profile
            </Heading>
            <Text color={mutedTextColor} fontSize="lg">
              Manage your personal information and preferences
            </Text>
          </Box>
        </VStack>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={8}>
          {/* Left Column - Profile Card */}
          <GridItem
            position={{ base: 'static', lg: 'sticky' }}
            top={{ base: undefined, lg: 8 }}
            alignSelf={{ base: 'auto', lg: 'flex-start' }}
          >
            <Card 
              bg={cardBg} 
              borderWidth={0} 
              borderRadius="2xl"
              boxShadow="xl"
              overflow="hidden"
              p={0}
            >
              {/* Gradient Header */}
              <Box h="80px" w="100%" bgGradient="linear(to-r, #38b2ac, #4299e1)" borderTopLeftRadius="2xl" borderTopRightRadius="2xl" position="relative" />
              {/* Avatar - overlaps gradient and card */}
              <Flex justify="center" align="center" mt={-12} mb={2}>
                <Avatar 
                  size="xl" 
                  src={photoPreview || profile?.photoURL}
                  name={profile?.displayName}
                  borderWidth={4}
                  borderColor={cardBg}
                  bg={cardBg}
                />
              </Flex>
              <CardBody pt={0}>
                <VStack spacing={2} mb={4}>
                  <Heading size="lg" color="green.700" fontWeight="extrabold" textAlign="center">
                    {profile.displayName}
                  </Heading>
                  <Text color="gray.400" fontSize="md" textAlign="center">
                    {profile.email}
                  </Text>
                </VStack>

                {/* Experience Level Badge */}
                <Box display="flex" justifyContent="center" mt={2} mb={2}>
                  <Badge 
                    colorScheme="green" 
                    variant="subtle"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontWeight="bold"
                    fontSize="sm"
                    letterSpacing={1}
                  >
                    {profile.experienceLevel?.toUpperCase() || "BEGINNER"}
                  </Badge>
                </Box>

                {/* Goals Scored Section */}
                <Box textAlign="center" p={3} bg="#FFFEF3" borderRadius="lg" border="1px solid" borderColor="#FFE28A" mb={4} mt={2}>
                  <Stat>
                    <StatNumber fontSize="2xl" color="#A97A1A" fontWeight="bold">
                      {profile.goals !== undefined ? profile.goals : 0}
                    </StatNumber>
                    <StatLabel fontSize="md" color="#A97A1A">
                      Goals Scored
                    </StatLabel>
                  </Stat>
                </Box>

                {/* Team Info Section */}
                {teamData && (
                  <Box
                    bg="#E9F7FE"
                    border="1px solid #B5D9F8"
                    borderRadius="lg"
                    px={4}
                    py={3}
                    mb={4}
                  >
                    <HStack align="flex-start">
                      <Icon as={FaUser} color="#3182ce" boxSize={5} mt={1} />
                      <Box>
                        <Text fontWeight="bold" color="#1a365d" fontSize="lg">
                          {teamData.team.name}
                        </Text>
                        <Text fontSize="md" color="#3182ce">
                          {teamData.manager?.uid === user.uid ? "Manager" : "Player"}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                )}

                {/* Lite Team Card */}
                {teamData && (
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
                        <HStack justify="center" spacing={1} mb={2}>
                          <Icon as={FaUser} color="#3182ce" boxSize={4} />
                          <Text color="#3182ce" fontSize="md">
                            {teamData.manager?.displayName ? `Manager: ${teamData.manager.displayName}` : "Manager"}
                          </Text>
                        </HStack>
                        <HStack justify="center" spacing={6} mb={4} mt={2}>
                          <HStack spacing={1}>
                            <Icon as={FaTrophy} color="#b7791f" boxSize={5} />
                            <Text color="#b7791f" fontWeight="bold" fontSize="md">{teamData.team.points || 0}</Text>
                            <Text color="#b7791f" fontSize="sm">Points</Text>
                          </HStack>
                          <HStack spacing={1}>
                            <Icon as={FaUsers} color="#3182ce" boxSize={5} />
                            <Text color="#1a365d" fontWeight="bold" fontSize="md">{teamData.members.length}</Text>
                            <Text color="#3182ce" fontSize="sm">Members</Text>
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
              </CardBody>
            </Card>
          </GridItem>

          {/* Right Column - Detailed Profile */}
          <GridItem>
            <Button
              colorScheme="blue"
              leftIcon={<FaUserEdit />} 
              borderRadius="lg"
              onClick={() => setProfileModalOpen(true)}
              w="100%"
              mb={4}
            >
              View Profile Info
            </Button>
            <Modal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} size="xl" isCentered>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Profile Information</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Card 
                    bg={cardBg} 
                    borderWidth={1} 
                    borderColor={borderColor}
                    borderRadius="2xl"
                    boxShadow="xl"
                  >
                    <CardHeader pb={4}>
                      <Flex align="center">
                        <HStack spacing={3}>
                          <Icon as={FaUser} color="green.500" boxSize={5} />
                          <Heading size="md" color={textColor}>Profile Information</Heading>
                        </HStack>
                        <Spacer />
                        {editing ? (
                          <HStack spacing={3}>
                            <Button
                              size="sm"
                              colorScheme="green"
                              onClick={handleSave}
                              isLoading={saving}
                              leftIcon={<FaSave />}
                              borderRadius="lg"
                            >
                              Save Changes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditing(false)}
                              leftIcon={<FaTimes />}
                              borderRadius="lg"
                            >
                              Cancel
                            </Button>
                          </HStack>
                        ) : (
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => setEditing(true)}
                            leftIcon={<FaEdit />}
                            borderRadius="lg"
                          >
                            Edit Profile
                          </Button>
                        )}
                      </Flex>
                    </CardHeader>
                    <CardBody pt={0}>
                      <VStack spacing={4} align="center" mb={4}>
                        <Avatar size="xl" src={photoPreview || profile?.photoURL} name={profile?.displayName} />
                        <Text fontWeight="bold">{profile?.displayName}</Text>
                        <Text color="gray.400">{profile?.email}</Text>
                        <Button
                          size="sm"
                          colorScheme="teal"
                          variant="outline"
                          isLoading={photoLoading}
                          leftIcon={<FaCamera />}
                          onClick={() => document.getElementById('profile-photo-input')?.click()}
                        >
                          Change Photo
                        </Button>
                        <Input
                          id="profile-photo-input"
                          type="file"
                          accept="image/*"
                          display="none"
                          onChange={handleProfilePhotoUpload}
                        />
                      </VStack>
                      <Tabs variant="enclosed" colorScheme="green">
                        <TabList>
                          <Tab>
                            <HStack spacing={2}>
                              <Icon as={FaUser} />
                              <Text>Personal</Text>
                            </HStack>
                          </Tab>
                          <Tab>
                            <HStack spacing={2}>
                              <Icon as={FaFutbol} />
                              <Text>Football</Text>
                            </HStack>
                          </Tab>
                          <Tab>
                            <HStack spacing={2}>
                              <Icon as={FaUsers} />
                              <Text>Team</Text>
                            </HStack>
                          </Tab>
                          <Tab>
                            <HStack spacing={2}>
                              <Icon as={FaCog} />
                              <Text>Settings</Text>
                            </HStack>
                          </Tab>
                        </TabList>
                        <TabPanels>
                          {/* Personal Information Tab */}
                          <TabPanel>
                            <VStack spacing={6} align="stretch">
                              <FormControl>
                                <FormLabel fontWeight="semibold" color={textColor}>
                                  <HStack spacing={2}>
                                    <Icon as={FaUser} color="green.500" />
                                    <Text>Full Name</Text>
                                  </HStack>
                                </FormLabel>
                                <Input
                                  value={profile.displayName}
                                  onChange={(e) => setProfile(prev => prev ? {...prev, displayName: e.target.value} : null)}
                                  isDisabled={!editing}
                                  borderRadius="lg"
                                  borderColor={borderColor}
                                  _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px green.500" }}
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontWeight="semibold" color={textColor}>
                                  <HStack spacing={2}>
                                    <Icon as={FaEnvelope} color="green.500" />
                                    <Text>Email</Text>
                                  </HStack>
                                </FormLabel>
                                <Input
                                  value={profile.email}
                                  isDisabled
                                  bg={useColorModeValue('gray.100', 'gray.700')}
                                  borderRadius="lg"
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontWeight="semibold" color={textColor}>
                                  <HStack spacing={2}>
                                    <Icon as={FaPhone} color="green.500" />
                                    <Text>Phone Number</Text>
                                  </HStack>
                                </FormLabel>
                                <Input
                                  value={profile.phoneNumber}
                                  onChange={(e) => setProfile(prev => prev ? {...prev, phoneNumber: e.target.value} : null)}
                                  isDisabled={!editing}
                                  placeholder="+1 (555) 123-4567"
                                  borderRadius="lg"
                                  borderColor={borderColor}
                                  _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px green.500" }}
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontWeight="semibold" color={textColor}>
                                  <HStack spacing={2}>
                                    <Icon as={FaCalendarAlt} color="green.500" />
                                    <Text>Date of Birth</Text>
                                  </HStack>
                                </FormLabel>
                                <Input
                                  type="date"
                                  value={profile.dateOfBirth}
                                  onChange={(e) => setProfile(prev => prev ? {...prev, dateOfBirth: e.target.value} : null)}
                                  isDisabled={!editing}
                                  borderRadius="lg"
                                  borderColor={borderColor}
                                  _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px green.500" }}
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontWeight="semibold" color={textColor}>
                                  <HStack spacing={2}>
                                    <Icon as={FaMapMarkerAlt} color="green.500" />
                                    <Text>Location</Text>
                                  </HStack>
                                </FormLabel>
                                <Input
                                  value={profile.location}
                                  onChange={(e) => setProfile(prev => prev ? {...prev, location: e.target.value} : null)}
                                  isDisabled={!editing}
                                  placeholder="City, Country"
                                  borderRadius="lg"
                                  borderColor={borderColor}
                                  _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px green.500" }}
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontWeight="semibold" color={textColor}>
                                  <HStack spacing={2}>
                                    <Icon as={FaFutbol} color="green.500" />
                                    <Text>Bio</Text>
                                  </HStack>
                                </FormLabel>
                                <Textarea
                                  value={profile.bio}
                                  onChange={(e) => setProfile(prev => prev ? {...prev, bio: e.target.value} : null)}
                                  isDisabled={!editing}
                                  placeholder="Tell us about yourself..."
                                  rows={4}
                                  borderRadius="lg"
                                  borderColor={borderColor}
                                  _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px green.500" }}
                                />
                              </FormControl>
                            </VStack>
                          </TabPanel>

                          {/* Football Information Tab */}
                          <TabPanel>
                            <VStack spacing={6} align="stretch">
                              <FormControl>
                                <FormLabel fontWeight="semibold" color={textColor}>
                                  <HStack spacing={2}>
                                    <Icon as={FaFutbol} color="green.500" />
                                    <Text>Position</Text>
                                  </HStack>
                                </FormLabel>
                                <Select
                                  value={profile.position}
                                  onChange={(e) => setProfile(prev => prev ? {...prev, position: e.target.value} : null)}
                                  isDisabled={!editing}
                                  placeholder="Select position"
                                  borderRadius="lg"
                                  borderColor={borderColor}
                                  _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px green.500" }}
                                >
                                  <option value="Goalkeeper">Goalkeeper</option>
                                  <option value="Defender">Defender</option>
                                  <option value="Midfielder">Midfielder</option>
                                  <option value="Forward">Forward</option>
                                  <option value="Manager">Manager</option>
                                </Select>
                              </FormControl>

                              <FormControl>
                                <FormLabel fontWeight="semibold" color={textColor}>
                                  <HStack spacing={2}>
                                    <Icon as={FaFutbol} color="green.500" />
                                    <Text>Experience Level</Text>
                                  </HStack>
                                </FormLabel>
                                <Select
                                  value={profile.experienceLevel}
                                  onChange={(e) => setProfile(prev => prev ? {...prev, experienceLevel: e.target.value} : null)}
                                  isDisabled={!editing}
                                  placeholder="Select experience level"
                                  borderRadius="lg"
                                  borderColor={borderColor}
                                  _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px green.500" }}
                                >
                                  <option value="Beginner">Beginner (0-2 years)</option>
                                  <option value="Intermediate">Intermediate (3-5 years)</option>
                                  <option value="Advanced">Advanced (6-10 years)</option>
                                  <option value="Expert">Expert (10+ years)</option>
                                </Select>
                              </FormControl>

                              <FormControl>
                                <FormLabel fontWeight="semibold" color={textColor}>
                                  <HStack spacing={2}>
                                    <Icon as={FaTrophy} color="green.500" />
                                    <Text>Favorite Team</Text>
                                  </HStack>
                                </FormLabel>
                                <Input
                                  value={profile.favoriteTeam}
                                  onChange={(e) => setProfile(prev => prev ? {...prev, favoriteTeam: e.target.value} : null)}
                                  isDisabled={!editing}
                                  placeholder="e.g., Manchester United"
                                  borderRadius="lg"
                                  borderColor={borderColor}
                                  _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px green.500" }}
                                />
                              </FormControl>

                              <FormControl>
                                <FormLabel fontWeight="semibold" color={textColor}>
                                  <HStack spacing={2}>
                                    <Icon as={FaTrophy} color="green.500" />
                                    <Text>Years Playing/Managing</Text>
                                  </HStack>
                                </FormLabel>
                                <Input
                                  type="number"
                                  value={profile.yearsPlaying}
                                  onChange={(e) => setProfile(prev => prev ? {...prev, yearsPlaying: parseInt(e.target.value) || 0} : null)}
                                  isDisabled={!editing}
                                  min="0"
                                  max="50"
                                  borderRadius="lg"
                                  borderColor={borderColor}
                                  _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px green.500" }}
                                />
                              </FormControl>
                            </VStack>
                          </TabPanel>

                          {/* Team Information Tab */}
                          <TabPanel>
                            {teamData ? (
                              <VStack spacing={6} align="stretch">
                                <Card bg="blue.50" borderColor="blue.200">
                                  <CardBody>
                                    <HStack spacing={4}>
                                      <Avatar src={teamData.team.logoUrl} name={teamData.team.name} size="lg" />
                                      <Box>
                                        <Heading size="md" color="blue.800">
                                          {teamData.team.name}
                                        </Heading>
                                        <Text color="blue.600" fontSize="sm">
                                          {teamData.manager?.uid === user.uid ? "Manager" : "Player"}
                                        </Text>
                                      </Box>
                                    </HStack>
                                  </CardBody>
                                </Card>

                                <Divider />

                                <Box>
                                  <Heading size="sm" color={textColor} mb={4}>
                                    Team Members
                                  </Heading>
                                  <VStack spacing={3} align="stretch">
                                    {teamData.members.map((member: any, index: number) => (
                                      <HStack key={member.uid || index} p={3} bg="gray.50" borderRadius="lg" spacing={3}>
                                        <Avatar size="sm" name={member.displayName} />
                                        <Box flex={1}>
                                          <Text fontWeight="medium" color={textColor}>
                                            {member.displayName}
                                          </Text>
                                        </Box>
                                        <Badge 
                                          colorScheme={member.uid === teamData.team.managerId ? "green" : "blue"}
                                          variant="subtle"
                                          borderRadius="full"
                                          px={3}
                                          py={1}
                                        >
                                          {member.uid === teamData.team.managerId ? "Manager" : "Player"}
                                        </Badge>
                                      </HStack>
                                    ))}
                                  </VStack>
                                </Box>
                              </VStack>
                            ) : (
                              <VStack spacing={6} align="center" py={8}>
                                <Icon as={FaUsers} color="gray.400" boxSize={16} />
                                <Box textAlign="center">
                                  <Heading size="md" color={textColor} mb={2}>
                                    Not part of a team yet
                                  </Heading>
                                  <Text color={mutedTextColor} mb={6}>
                                    Join or create a team to start playing with others
                                  </Text>
                                  <Button 
                                    colorScheme="green" 
                                    onClick={() => navigate("/manage-team")}
                                    leftIcon={<FaUsers />}
                                    size="lg"
                                    borderRadius="lg"
                                  >
                                    Join or Create Team
                                  </Button>
                                </Box>
                              </VStack>
                            )}
                          </TabPanel>

                          {/* Settings Tab */}
                          <TabPanel>
                            <VStack spacing={8} align="stretch">
                              <Box>
                                <Heading size="sm" color={textColor} mb={4}>
                                  <HStack spacing={2}>
                                    <Icon as={FaBell} color="green.500" />
                                    <Text>Notifications</Text>
                                  </HStack>
                                </Heading>
                                <VStack spacing={4} align="stretch">
                                  <HStack justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="medium" color={textColor}>Email Notifications</Text>
                                      <Text fontSize="sm" color={mutedTextColor}>Receive updates via email</Text>
                                    </VStack>
                                    <Switch
                                      isChecked={profile.notifications?.email || false}
                                      onChange={(e) => setProfile(prev => prev ? {
                                        ...prev,
                                        notifications: {
                                          ...(prev.notifications || {}),
                                          email: e.target.checked
                                        }
                                      } : null)}
                                      isDisabled={!editing}
                                      colorScheme="green"
                                    />
                                  </HStack>
                                  <HStack justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="medium" color={textColor}>Push Notifications</Text>
                                      <Text fontSize="sm" color={mutedTextColor}>Get instant notifications</Text>
                                    </VStack>
                                    <Switch
                                      isChecked={profile.notifications?.push || false}
                                      onChange={(e) => setProfile(prev => prev ? {
                                        ...prev,
                                        notifications: {
                                          ...(prev.notifications || {}),
                                          push: e.target.checked
                                        }
                                      } : null)}
                                      isDisabled={!editing}
                                      colorScheme="green"
                                    />
                                  </HStack>
                                  <HStack justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="medium" color={textColor}>Team Updates</Text>
                                      <Text fontSize="sm" color={mutedTextColor}>Stay informed about your team</Text>
                                    </VStack>
                                    <Switch
                                      isChecked={profile.notifications?.teamUpdates || false}
                                      onChange={(e) => setProfile(prev => prev ? {
                                        ...prev,
                                        notifications: {
                                          ...(prev.notifications || {}),
                                          teamUpdates: e.target.checked
                                        }
                                      } : null)}
                                      isDisabled={!editing}
                                      colorScheme="green"
                                    />
                                  </HStack>
                                </VStack>
                              </Box>

                              <Divider />

                              <Box>
                                <Heading size="sm" color={textColor} mb={4}>
                                  <HStack spacing={2}>
                                    <Icon as={FaEye} color="green.500" />
                                    <Text>Privacy</Text>
                                  </HStack>
                                </Heading>
                                <VStack spacing={4} align="stretch">
                                  <HStack justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="medium" color={textColor}>Public Profile</Text>
                                      <Text fontSize="sm" color={mutedTextColor}>Allow others to view your profile</Text>
                                    </VStack>
                                    <Switch
                                      isChecked={profile.privacy?.profilePublic || false}
                                      onChange={(e) => setProfile(prev => prev ? {
                                        ...prev,
                                        privacy: {
                                          ...(prev.privacy || {}),
                                          profilePublic: e.target.checked
                                        }
                                      } : null)}
                                      isDisabled={!editing}
                                      colorScheme="green"
                                    />
                                  </HStack>
                                  <HStack justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="medium" color={textColor}>Show Email</Text>
                                      <Text fontSize="sm" color={mutedTextColor}>Display email to other users</Text>
                                    </VStack>
                                    <Switch
                                      isChecked={profile.privacy?.showEmail || false}
                                      onChange={(e) => setProfile(prev => prev ? {
                                        ...prev,
                                        privacy: {
                                          ...(prev.privacy || {}),
                                          showEmail: e.target.checked
                                        }
                                      } : null)}
                                      isDisabled={!editing}
                                      colorScheme="green"
                                    />
                                  </HStack>
                                  <HStack justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="medium" color={textColor}>Show Phone</Text>
                                      <Text fontSize="sm" color={mutedTextColor}>Display phone to other users</Text>
                                    </VStack>
                                    <Switch
                                      isChecked={profile.privacy?.showPhone || false}
                                      onChange={(e) => setProfile(prev => prev ? {
                                        ...prev,
                                        privacy: {
                                          ...(prev.privacy || {}),
                                          showPhone: e.target.checked
                                        }
                                      } : null)}
                                      isDisabled={!editing}
                                      colorScheme="green"
                                    />
                                  </HStack>
                                </VStack>
                              </Box>

                              <Divider />

                              <Button 
                                colorScheme="red" 
                                onClick={handleLogout} 
                                leftIcon={<FaShieldAlt />}
                                size="lg"
                                borderRadius="lg"
                                variant="outline"
                              >
                                Logout
                              </Button>
                            </VStack>
                          </TabPanel>
                        </TabPanels>
                      </Tabs>
                    </CardBody>
                  </Card>
                </ModalBody>
              </ModalContent>
            </Modal>

            {isOwner && (
              <Button colorScheme="green" w="100%" mb={4} onClick={() => setPostModalOpen(true)}>
                Add Post
              </Button>
            )}
            <Modal isOpen={isPostModalOpen} onClose={() => setPostModalOpen(false)} isCentered>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Add New Post</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <VStack spacing={4}>
                    <Input type="file" accept="image/*" onChange={handlePostImageChange} />
                    {postPreview && <ChakraImage src={postPreview} maxH="200px" borderRadius="lg" />}
                    <Input placeholder="Caption" value={postCaption} onChange={e => setPostCaption(e.target.value)} />
                    <Button colorScheme="green" w="100%" onClick={handleAddPost} isLoading={postLoading} isDisabled={!postImage}>
                      Post
                    </Button>
                  </VStack>
                </ModalBody>
              </ModalContent>
            </Modal>
            <Box mt={6}>
              <Heading size="md" mb={3}>Posts</Heading>
              {postLoading ? (
                <Text>Loading...</Text>
              ) : posts.length === 0 ? (
                <Text color="gray.500">No posts yet.</Text>
              ) : (
                <SimpleGrid columns={1} spacing={8} justifyItems="center">
                  {posts.map((post: Post) => (
                    <Box key={post.id} borderWidth={1} borderRadius="2xl" overflow="hidden" bg={cardBg} boxShadow="2xl" maxW="650px" w="100%" mx="auto" my={4}>
                      <ChakraImage src={post.imageUrl} w="100%" maxH="420px" minH="300px" objectFit="cover" />
                      <Box p={8}>
                        <Text mb={6} fontSize="2xl" fontWeight="bold">{post.caption}</Text>
                        <Text fontSize="lg" color="gray.400" mb={3}>{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ''}</Text>
                        {isOwner && (
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
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default Profile;