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
  List,
  ListItem,
  ListIcon,
  FormErrorMessage,
} from "@chakra-ui/react";
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app } from "../firebaseConfig";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUserPlus, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { Icon } from "@chakra-ui/react";
import NavBar from "../components/NavBar";

const auth = getAuth(app);
const db = getFirestore(app);

const UserRegister: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [passwordValidity, setPasswordValidity] = useState({
    minChar: false,
    number: false,
    specialChar: false,
    uppercase: false,
  });
  const navigate = useNavigate();
  const toast = useToast();

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsEmailValid(validateEmail(newEmail));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordValidity({
      minChar: newPassword.length >= 8,
      number: /\d/.test(newPassword),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      uppercase: /[A-Z]/.test(newPassword),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const isPasswordValid = Object.values(passwordValidity).every(Boolean);
    if (!isPasswordValid) {
      setError("Please ensure your password meets all the requirements.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      try {
        await sendEmailVerification(userCredential.user);
        toast({
          title: "Verification email sent!",
          description: "Please check your inbox to verify your account.",
          status: "info",
          duration: 9000,
          isClosable: true,
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Don't block registration if email fails, but inform the user
      }

      const userRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userRef, {
        uid: userCredential.user.uid,
        displayName: name,
        displayName_lowercase: name.toLowerCase(),
        email: email,
        teamId: null,
        role: "player",
        photoURL: "", // Default photo or generate one
        goals: 0,
      });

      toast({
        title: "Account Created",
        description: "You have been successfully registered.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      navigate("/home");
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err) {
        if (err.code === 'auth/email-already-in-use') {
          setError("This email is already in use. Please try another one.");
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      console.error(err);
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
              <Icon as={FaUserPlus} boxSize={12} color="green.500" />
              <Heading as="h1" size="xl" textAlign="center">
                Create Your Account
              </Heading>
              <Text color={useColorModeValue("gray.600", "gray.300")} textAlign="center">
                Join the community and start your football journey.
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
                    <FormLabel>Full Name</FormLabel>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      borderRadius="lg"
                    />
                  </FormControl>
                  <FormControl isRequired isInvalid={!isEmailValid && email !== ""}>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="you@domain.com"
                      borderRadius="lg"
                    />
                    <FormErrorMessage>Please enter a valid email address.</FormErrorMessage>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder="•••••••• (min. 8 characters)"
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
                  <List spacing={1} my={2}>
                    <PasswordRequirement
                      isValid={passwordValidity.minChar}
                      text="At least 8 characters"
                    />
                    <PasswordRequirement
                      isValid={passwordValidity.uppercase}
                      text="An uppercase letter"
                    />
                    <PasswordRequirement
                      isValid={passwordValidity.number}
                      text="A number"
                    />
                    <PasswordRequirement
                      isValid={passwordValidity.specialChar}
                      text="A special character"
                    />
                  </List>
                  <FormControl isRequired>
                    <FormLabel>Confirm Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        borderRadius="lg"
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          icon={showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    Create Account
                  </Button>
                </VStack>
              </form>

              <HStack justify="center" spacing={1}>
                <Text color={useColorModeValue("gray.600", "gray.300")}>
                  Already have an account?
                </Text>
                <Link as={RouterLink} to="/login" color="green.500" fontWeight="bold">
                  Log in
                </Link>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </Flex>
    </Box>
  );
};

const PasswordRequirement = ({ isValid, text }: { isValid: boolean; text: string }) => {
  const color = isValid ? "green.500" : "red.500";
  const icon = isValid ? FaCheckCircle : FaTimesCircle;

  return (
    <ListItem color={color} fontSize="sm" w="full">
      <ListIcon as={icon} color={color} />
      {text}
    </ListItem>
  );
};

export default UserRegister;