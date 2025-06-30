import React, { useEffect, useState } from "react";
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
  const [, setUser] = useState(null);
  const [, setLoading] = useState(true);

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
      setUser(currentUser as any);
      setLoading(false);
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
              onClick={() => navigate("/teams")}
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
              Everything you need to take your football experience to the next level
            </Text>
          </Box>
          
          <Grid 
            templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }} 
            gap={8}
            w="full"
          >
            {features.map((feature, index) => (
              <GridItem key={feature.title}>
                <Box
                  bg={cardBg}
                  p={8}
                  borderRadius="3xl"
                  boxShadow="xl"
                  textAlign="center"
                  position="relative"
                  overflow="hidden"
                  animation={`fadeInUp 0.8s ease-out ${0.8 + index * 0.2}s both`}
                  _hover={{
                    transform: "translateY(-8px)",
                    boxShadow: "2xl",
                  }}
                  transition="all 0.3s"
                >
                  {/* Gradient background circle */}
                  <Box
                    position="absolute"
                    top="-50px"
                    right="-50px"
                    w="100px"
                    h="100px"
                    borderRadius="full"
                    bgGradient={feature.gradient}
                    opacity="0.1"
                    animation="pulse 3s ease-in-out infinite"
                  />
                  
                  <VStack spacing={6}>
                    <Box
                      w="80px"
                      h="80px"
                      borderRadius="full"
                      bgGradient={feature.gradient}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="lg"
                    >
                      <Icon 
                        as={feature.icon} 
                        color="white" 
                        boxSize={8}
                      />
                    </Box>
                    
                    <VStack spacing={3}>
                      <Heading 
                        as="h4" 
                        size="lg" 
                        color={textColor}
                        fontWeight="bold"
                      >
                        {feature.title}
                      </Heading>
                      <Text 
                        color={mutedTextColor} 
                        fontSize="md"
                        lineHeight="tall"
                      >
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

      {/* CTA Section */}
      <Container maxW="7xl" py={16}>
        <Box
          bgGradient="linear(to-r, green.500, blue.500)"
          borderRadius="3xl"
          p={12}
          textAlign="center"
          color="white"
          animation="fadeInUp 0.8s ease-out 1.4s both"
        >
          <VStack spacing={6}>
            <Heading size="2xl" fontWeight="black">
              Ready to Transform Your Football Experience?
            </Heading>
            <Text fontSize="lg" maxW="2xl" opacity="0.9">
              Join local players and teams who are already using FutVerse to organize games, 
              manage teams, and build lasting connections in the football community.
            </Text>
            <Button
              size="lg"
              colorScheme="whiteAlpha"
              fontWeight="bold"
              px={10}
              py={6}
              fontSize="lg"
              onClick={() => navigate("/teams")}
              _hover={{
                bg: "whiteAlpha.300",
                transform: "translateY(-2px)",
              }}
              transition="all 0.2s"
            >
              Get Started Today
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;