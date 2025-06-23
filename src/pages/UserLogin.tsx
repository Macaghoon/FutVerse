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
  useColorModeValue,
  Card,
  CardBody,
  VStack,
  Link,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebaseConfig";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaFutbol } from "react-icons/fa";
import { Icon } from "@chakra-ui/react";
import NavBar from "../components/NavBar";

const auth = getAuth(app);

const UserLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate("/home");
    } catch (err: any) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cardBg = useColorModeValue("white", "gray.800");

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      <NavBar />
      <Flex
        minH={{ base: "auto", md: "calc(100vh - 64px)" }}
        align="center"
        justify="center"
        bg={useColorModeValue(
          "linear(to-br, gray.50, blue.50, green.50)",
          "linear(to-br, gray.900, blue.900, green.900)"
        )}
        p={4}
      >
        <Card bg={cardBg} borderRadius="2xl" boxShadow="xl" p={8} maxW="lg" w="full">
          <CardBody>
            <VStack spacing={6}>
              <Icon as={FaFutbol} boxSize={12} color="green.500" />
              <Heading as="h1" size="xl" textAlign="center">
                Welcome Back
              </Heading>
              <Text color={useColorModeValue("gray.600", "gray.300")} textAlign="center">
                Enter your credentials to access your account.
              </Text>
              
              {error && (
                <Alert status="error" borderRadius="lg">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Email Address</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      borderRadius="lg"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        borderRadius="lg"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                          onClick={() => setShowPassword(!showPassword)}
                          variant="ghost"
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                  <Button
                    type="submit"
                    colorScheme="green"
                    w="full"
                    size="lg"
                    isLoading={loading}
                    borderRadius="lg"
                  >
                    Log In
                  </Button>
                </VStack>
              </form>

              <HStack justify="center" spacing={1}>
                <Text color={useColorModeValue("gray.600", "gray.300")}>
                  Don't have an account?
                </Text>
                <Link as={RouterLink} to="/register" color="green.500" fontWeight="bold">
                  Sign up
                </Link>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </Flex>
    </Box>
  );
};

export default UserLogin;