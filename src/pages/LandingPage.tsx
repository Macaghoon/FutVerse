import React, { useState } from "react";
import {
  Box,
  Heading,
  Button,
  Flex,
  Text,
  FormControl,
  FormLabel,
  Input,
  Alert,
  AlertIcon,
  HStack
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import landingWallpaper from "../assets/LandingPageWallpaper.jpg";

const auth = getAuth(app);
const MotionBox = motion(Box);

const LandingPage: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess(true);
      setTimeout(() => navigate("/home"), 1000);
    } catch (err: any) {
      setError("Invalid email or password.");
    }
  };

  const handleKickOff = () => {
    navigate("/home");
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      direction="column"
      px={4}
      position="relative"
      bgImage={`url(${landingWallpaper})`}
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
    >
      {/* Dark overlay */}
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        bg="black"
        opacity={0.3}
        zIndex={1}
      />
      <AnimatePresence>
        {!showLogin && (
          <MotionBox
            zIndex={2}
            textAlign="center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
    >
      <Heading
        as="h1"
        size="4xl"
        mb={4}
        letterSpacing="wider"
        color="white"
        fontWeight="extrabold"
      >
        FutVerse
      </Heading>
      <Flex gap={4} mb={8} wrap="wrap" justify="center">
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Box
            bg="rgba(255, 255, 255, 0.15)"
            p={4}
            borderRadius="full"
            boxShadow="sm"
            textAlign="center"
            minW="160px"
            backdropFilter="blur(4px)"
            border="1px solid"
            borderColor="whiteAlpha.500"
            _hover={{ 
              transform: "translateY(-2px)", 
              transition: "0.2s",
              bg: "rgba(255, 255, 255, 0.2)",
            }}
          >
            <Text fontSize="sm" fontWeight="medium" color="white" letterSpacing="wide">
              Effortless Match-making
            </Text>
          </Box>
        </MotionBox>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Box
            bg="rgba(255, 255, 255, 0.15)"
            p={4}
            borderRadius="full"
            boxShadow="sm"
            textAlign="center"
            minW="160px"
            backdropFilter="blur(4px)"
            border="1px solid"
            borderColor="whiteAlpha.500"
            _hover={{ 
              transform: "translateY(-2px)", 
              transition: "0.2s",
              bg: "rgba(255, 255, 255, 0.2)",
            }}
          >
            <Text fontSize="sm" fontWeight="medium" color="white" letterSpacing="wide">
              Powerful Team Management
            </Text>
          </Box>
        </MotionBox>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Box
            bg="rgba(255, 255, 255, 0.15)"
            p={4}
            borderRadius="full"
            boxShadow="sm"
            textAlign="center"
            minW="160px"
            backdropFilter="blur(4px)"
            border="1px solid"
            borderColor="whiteAlpha.500"
            _hover={{ 
              transform: "translateY(-2px)", 
              transition: "0.2s",
              bg: "rgba(255, 255, 255, 0.2)",
            }}
          >
            <Text fontSize="sm" fontWeight="medium" color="white" letterSpacing="wide">
              All in One Platform
            </Text>
          </Box>
        </MotionBox>
      </Flex>
      <Button
        size="lg"
        colorScheme="green"
        fontWeight="bold"
        px={10}
        onClick={handleKickOff}
        _hover={{ transform: "scale(1.05)" }}
      >
        Kick Off
      </Button>
    </MotionBox>
        )}

        {showLogin && (
          <MotionBox
            zIndex={10}
            bg="white"
            borderRadius="2xl"
            p={10}
            minW="340px"
            boxShadow="2xl"
            textAlign="center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Heading as="h1" size="xl" mb={2} color="green.900" fontWeight="extrabold">
              FutVerse
            </Heading>
            <Text fontSize="md" color="gray.700" mb={6}>
              Welcome back! Log in to kick off your journey.
            </Text>
            {error && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                {error}
              </Alert>
            )}
            {success && (
              <Alert status="success" mb={4}>
                <AlertIcon />
                Login successful!
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <FormControl mb={4} isRequired>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </FormControl>
              <FormControl mb={6} isRequired>
                <FormLabel>Password</FormLabel>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </FormControl>
              <Button colorScheme="green" type="submit" width="full" fontWeight="bold">
                Login
              </Button>
            </form>
            <HStack mt={4} spacing={2} justify="center">
              <Text color="gray.500" fontSize="sm">
                First time here?
              </Text>
              <Button
                colorScheme="blue"
                variant="outline"
                size="sm"
                fontWeight="bold"
                onClick={() => navigate("/register")}
              >
                Register
              </Button>
            </HStack>
          </MotionBox>
        )}
      </AnimatePresence>
    </Flex>
  );
};

export default LandingPage;