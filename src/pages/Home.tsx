import React, { useEffect } from "react";
import {
  Box,
  Heading,
  Button,
  Text,
  HStack,
  VStack,
  Grid,
  GridItem,
  Icon,
  useColorModeValue,
  Container,
  Badge,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { 
  FaUsers, 
  FaTrophy, 
  FaArrowRight,
  FaPlay,
  FaCog
} from "react-icons/fa";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../firebaseConfig";
import NavBar from "../components/NavBar";

const features = [
  {
    title: "Find & Join Matches",
    desc: "Effortlessly discover local games, organize pick-up matches, or find teams looking for players. Never miss a game again.",
    icon: FaPlay,
    color: "blue.500",
    gradient: "linear(to-r, blue.400, blue.600)"
  },
  {
    title: "Seamless Team Management",
    desc: "Streamline player rosters, schedule practices, track attendance, and communicate with your squad, all in one place.",
    icon: FaUsers,
    color: "green.500",
    gradient: "linear(to-r, green.400, green.600)"
  },
  {
    title: "Your All-in-One Football Hub",
    desc: "Experience a centralized platform for all your football needs – from organizing games to team administration and community engagement.",
    icon: FaTrophy,
    color: "purple.500",
    gradient: "linear(to-r, purple.400, purple.600)"
  },
];

const auth = getAuth(app);

const Home: React.FC = () => {
  const navigate = useNavigate();

  const bgGradient = useColorModeValue(
    "linear(to-br, gray.50, blue.50, green.50)",
    "linear(to-br, gray.900, blue.900, green.900)"
  );
  
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "white");
  const mutedTextColor = useColorModeValue("gray.600", "gray.300");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("ManageTeam user:", currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <NavBar />
      
      {/* Hero Section */}
      <Container maxW="7xl" pt={20} pb={16} mx="auto">
        <VStack spacing={8} textAlign="center">
          <Box
            animation="fadeInUp 0.8s ease-out"
            bgGradient="linear(to-r, green.400, blue.500)"
            bgClip="text"
            mb={4}
          >
            <Heading 
              as="h1" 
              size="4xl" 
              fontWeight="black" 
              letterSpacing="tight" 
              lineHeight={1.1}
            >
              Unite. Organize. Play.
            </Heading>
            <Heading 
              as="h2" 
              size="2xl" 
              fontWeight="bold" 
              color={textColor}
              mt={2}
            >
              Your Football Journey Starts Here
            </Heading>
          </Box>
          
          <Text 
            color={mutedTextColor} 
            fontSize="xl" 
            maxW="2xl" 
            lineHeight="tall"
            animation="fadeInUp 0.8s ease-out 0.2s both"
          >
            The all-in-one platform to easily find matches, manage your teams, and connect with the football community. 
            Join local players who trust FutVerse for their football needs.
          </Text>
          
          <HStack 
            spacing={6} 
            animation="fadeInUp 0.8s ease-out 0.4s both"
          >
            <Button 
              size="lg" 
              colorScheme="green" 
              fontWeight="bold" 
              px={10} 
              py={6}
              fontSize="lg"
              leftIcon={<FaPlay />}
              rightIcon={<FaArrowRight />}
              onClick={() => navigate("/find-match")}
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "xl",
              }}
              transition="all 0.2s"
            >
              Find a Game
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              colorScheme="green" 
              fontWeight="bold" 
              px={10}
              py={6}
              fontSize="lg"
              leftIcon={<FaCog />}
              onClick={() => navigate("/manage-team")}
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "xl",
                bg: "green.50",
              }}
              transition="all 0.2s"
            >
              Manage Your Team
            </Button>
          </HStack>
        </VStack>
      </Container>

      {/* Features Section */}
      <Container maxW="7xl" py={16} mx="auto">
        <VStack spacing={12}>
          <Box textAlign="center" animation="fadeInUp 0.8s ease-out">
            <Badge 
              colorScheme="green" 
              fontSize="md" 
              px={4} 
              py={2} 
              borderRadius="full"
              mb={4}
            >
              Why Choose FutVerse
            </Badge>
            <Heading 
              as="h3" 
              size="2xl" 
              color={textColor} 
              fontWeight="black"
              mb={4}
            >
              Powering Your Passion for Football
            </Heading>
            <Text 
              color={mutedTextColor} 
              fontSize="lg" 
              maxW="2xl"
            >
              Everything you need to organize, manage, and enjoy football, all in one powerful platform.
            </Text>
          </Box>

          <Grid 
            templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} 
            gap={8} 
            w="full"
            animation="fadeInUp 0.8s ease-out 0.6s both"
          >
            {features.map((feature, index) => (
              <GridItem key={index}>
                <Box
                  bg={cardBg}
                  p={8}
                  borderRadius="2xl"
                  boxShadow="xl"
                  h="full"
                  border="1px solid"
                  borderColor={useColorModeValue("gray.200", "gray.700")}
                  _hover={{
                    transform: "translateY(-4px)",
                    boxShadow: "2xl",
                  }}
                  transition="all 0.3s ease"
                >
                  <VStack spacing={6} align="start">
                    <Box
                      p={4}
                      borderRadius="xl"
                      bgGradient={feature.gradient}
                      color="white"
                    >
                      <Icon as={feature.icon} boxSize={8} />
                    </Box>
                    <VStack spacing={3} align="start">
                      <Heading size="lg" color={textColor} fontWeight="bold">
                        {feature.title}
                      </Heading>
                      <Text color={mutedTextColor} lineHeight="tall">
                        {feature.desc}
                      </Text>
                    </VStack>
                  </VStack>
                </Box>
              </GridItem>
            ))}
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
};

export default Home;