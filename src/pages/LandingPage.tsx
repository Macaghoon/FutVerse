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
  HStack,
  VStack
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import landingWallpaper from "../assets/LandingPageWallpaper.jpg";

const auth = getAuth(app);
const MotionBox = motion(Box);

const LandingPage: React.FC = () => {
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
    } catch (error: unknown) {
      setError("Invalid email or password.");
    }
  };

  const handleKickOff = () => {
    navigate("/home");
  };

  return (
    <Box
      minH="100vh"
      bgImage={`url(${landingWallpaper})`}
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
      position="relative"
    >
      {/* Overlay */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(0, 0, 0, 0.6)"
      />

      {/* Content */}
      <Box position="relative" zIndex={1}>
        <Flex
          direction="column"
          minH="100vh"
          align="center"
          justify="center"
          px={4}
        >
          <VStack spacing={8} textAlign="center" maxW="2xl">
            <AnimatePresence>
              <MotionBox
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Heading
                  as="h1"
                  size="4xl"
                  color="white"
                  fontWeight="black"
                  mb={4}
                  textShadow="2px 2px 4px rgba(0,0,0,0.8)"
                >
                  FutVerse
                </Heading>
                <Text
                  fontSize="xl"
                  color="white"
                  opacity={0.9}
                  textShadow="1px 1px 2px rgba(0,0,0,0.8)"
                >
                  The Ultimate Football Community Platform
                </Text>
              </MotionBox>
            </AnimatePresence>

            <AnimatePresence>
              <MotionBox
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <VStack spacing={6} w="full">
                  <Button
                    size="lg"
                    colorScheme="green"
                    onClick={handleKickOff}
                    px={12}
                    py={6}
                    fontSize="lg"
                    fontWeight="bold"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "xl",
                    }}
                    transition="all 0.2s"
                  >
                    Kick Off Your Journey
                  </Button>
                </VStack>
              </MotionBox>
            </AnimatePresence>
          </VStack>
        </Flex>
      </Box>
    </Box>
  );
};

export default LandingPage;