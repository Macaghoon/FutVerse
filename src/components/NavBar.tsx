// src/components/NavBar.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Flex,
  Heading,
  HStack,
  Spacer,
  Input,
  IconButton,
  Avatar,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Box,
  useColorModeValue,
  Divider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Text,
  Spinner,
  InputGroup,
  InputLeftElement,
  VStack,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../firebaseConfig";
import { FaUser, FaSignOutAlt, FaBell, FaEnvelope } from "react-icons/fa";
import { Icon } from "@chakra-ui/react";
import { useDebounce } from "../hooks/useDebounce";
import { globalSearch } from "../utils/firestoreSearch";
import { useGlobalState } from "../context/GlobalState";

const auth = getAuth(app);
const db = getFirestore(app);

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    teams: any[];
    users: any[];
  }>({ teams: [], users: [] });
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const { unreadMessages, pendingActions, markChatsAsRead, markNotificationsAsRead } = useGlobalState();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.length > 1) {
        setIsSearchLoading(true);
        const results = await globalSearch(debouncedSearchQuery);
        setSearchResults(results);
        setIsSearchLoading(false);
        setIsSearchOpen(true);
      } else {
        setSearchResults({ teams: [], users: [] });
        setIsSearchOpen(false);
      }
    };
    performSearch();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleChatClick = () => {
    markChatsAsRead();
    navigate("/chat");
  };

  const handleNotificationsClick = () => {
    markNotificationsAsRead();
    navigate("/notifications");
  };

  const navBgColor = useColorModeValue("white", "gray.800");
  const navTextColor = useColorModeValue("gray.700", "white");
  const searchBgColor = useColorModeValue("white", "gray.700");

  return (
    <Flex
      as="nav"
      align="center"
      px={8}
      py={4}
      bg={navBgColor}
      position="relative"
      zIndex={10}
      boxShadow="sm"
    >
      <Avatar size="sm" name="FutVerse" bg="green.400" color="white" mr={3} />
      <Heading
        as="h1"
        size="md"
        color="green.600"
        fontWeight="extrabold"
        letterSpacing="wider"
        cursor="pointer"
        onClick={() => navigate("/home")}
      >
        FutVerse
      </Heading>
      <HStack spacing={8} ml={10} display={{ base: "none", md: "flex" }}>
        <Button
          variant="ghost"
          color={navTextColor}
          fontWeight="medium"
          _hover={{ color: "green.500", bg: "gray.100" }}
          onClick={() => navigate("/home")}
        >
          Home
        </Button>
        <Button
          variant="ghost"
          color={navTextColor}
          fontWeight="medium"
          _hover={{ color: "green.500", bg: "gray.100" }}
          onClick={() => navigate("/teams")}
        >
          Teams
        </Button>
        <Button
          variant="ghost"
          color={navTextColor}
          fontWeight="medium"
          _hover={{ color: "green.500", bg: "gray.100" }}
          onClick={() => navigate("/manage-team")}
        >
          My Team
        </Button>
      </HStack>
      <Spacer />

      <HStack spacing={1}>
        <IconButton
          aria-label="Notifications"
          icon={<FaBell />}
          variant="ghost"
          onClick={handleNotificationsClick}
          position="relative"
          _after={pendingActions > 0 ? {
            content: '""',
            w: '8px',
            h: '8px',
            bg: 'red.500',
            border: '1.5px solid white',
            rounded: 'full',
            position: 'absolute',
            top: 1,
            right: 1,
            zIndex: 'tooltip',
          } : {}}
        />
        <IconButton
          aria-label="Messages"
          icon={<FaEnvelope />}
          variant="ghost"
          onClick={handleChatClick}
          position="relative"
          _after={unreadMessages > 0 ? {
            content: '""',
            w: '8px',
            h: '8px',
            bg: 'red.500',
            border: '1.5px solid white',
            rounded: 'full',
            position: 'absolute',
            top: 1,
            right: 1,
            zIndex: 'tooltip',
          } : {}}
        />
      </HStack>

      <Box position="relative" ref={searchRef} mx={4}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search teams and players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.teams.length > 0 || searchResults.users.length > 0) {
                setIsSearchOpen(true);
              }
            }}
            bg={useColorModeValue("gray.50", "gray.700")}
            width={{ base: "150px", md: "250px" }}
          />
        </InputGroup>
        <Popover
          isOpen={isSearchOpen}
          placement="bottom-start"
          isLazy
          autoFocus={false}
        >
          <PopoverTrigger>
            <Box position="absolute" w="100%" />
          </PopoverTrigger>
          <PopoverContent bg={searchBgColor} w="100%">
            <PopoverBody>
              {isSearchLoading ? (
                <Flex justify="center" p={4}>
                  <Spinner />
                </Flex>
              ) : (
                <VStack align="stretch">
                  {searchResults.teams.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" color="gray.500" fontSize="sm" p={2}>
                        TEAMS
                      </Text>
                      {searchResults.teams.map((team) => (
                        <Button
                          key={team.id}
                          variant="ghost"
                          w="100%"
                          justifyContent="flex-start"
                          onClick={() => {
                            navigate(`/team/${team.id}`);
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          <Avatar size="sm" src={team.logoUrl} name={team.name} mr={2} />
                          {team.name}
                        </Button>
                      ))}
                    </Box>
                  )}
                  {searchResults.users.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" color="gray.500" fontSize="sm" p={2}>
                        PLAYERS
                      </Text>
                      {searchResults.users.map((player) => (
                        <Button
                          key={player.id}
                          variant="ghost"
                          w="100%"
                          justifyContent="flex-start"
                          onClick={() => {
                            navigate(`/profile/${player.id}`);
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          <Avatar size="sm" src={player.photoURL} name={player.displayName} mr={2} />
                          {player.displayName}
                        </Button>
                      ))}
                    </Box>
                  )}
                  {searchResults.teams.length === 0 && searchResults.users.length === 0 && (
                    <Text p={2}>No results found.</Text>
                  )}
                </VStack>
              )}
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Box>

      {user ? (
        <Menu>
          <MenuButton
            as={Button}
            rounded={"full"}
            variant={"link"}
            cursor={"pointer"}
            minW={0}
            ml={4}
          >
            <Avatar
              size={"sm"}
              src={userData?.photoURL || user.photoURL}
              name={userData?.displayName || user.displayName || user.email}
            />
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => navigate("/profile")}>
              <Icon as={FaUser} mr={2} />
              Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} color="red.500">
              <Icon as={FaSignOutAlt} mr={2} />
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      ) : (
        <Button
          ml={4}
          colorScheme="green"
          px={6}
          fontWeight="bold"
          onClick={() => navigate("/login")}
        >
          Login / Register
        </Button>
      )}
    </Flex>
  );
};

export default NavBar;