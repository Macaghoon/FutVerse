import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  Avatar,
  Flex,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  VStack,
  HStack,
  useToast,
  Skeleton,
  Container,
  Stat,
  StatLabel,
  StatNumber,
  Button,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { getAllTeams } from "../utils/firestoreTeams";
import NavBar from "../components/NavBar";
import { 
  FaTrophy, 
  FaUserTie, 
  FaSearch, 
  FaUsers, 
  FaEye} from "react-icons/fa";
import { Icon } from "@chakra-ui/react";

interface TeamData {
  id: string;
  name: string;
  logoUrl: string;
  coverPhotoUrl?: string;
  points: number;
  managerId: string;
  managerName: string;
  members: string[];
  rank?: number;
}

const TeamCard = ({ team }: { team: TeamData }) => {
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "gray.800");
  const mutedTextColor = useColorModeValue("gray.600", "gray.300");

  return (
    <Card
      bg={cardBg}
      borderRadius="2xl"
      boxShadow="lg"
      overflow="hidden"
      transition="all 0.3s ease"
      _hover={{ 
        transform: "translateY(-5px)", 
        boxShadow: "xl",
      }}
      cursor="pointer"
      onClick={() => navigate(`/team/${team.id}`)}
      h="100%"
    >
      <VStack spacing={0} h="100%">
        <Box
          p={6}
          w="full"
          h="120px"
          bgImage={`url(${team.coverPhotoUrl || team.logoUrl})`}
          bgSize="cover"
          bgPosition="center"
          position="relative"
          display="flex"
          alignItems="center"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bg: 'blackAlpha.500',
            zIndex: 1,
          }}
        >
          <HStack spacing={4} w="full" zIndex={2}>
            <Avatar size="lg" src={team.logoUrl} name={team.name} />
            <Box>
              <Heading size="md" noOfLines={1} color="white" textShadow="1px 1px 3px rgba(0,0,0,0.6)">{team.name}</Heading>
              <Text fontSize="sm" color="gray.200" display="flex" alignItems="center">
                <Icon as={FaUserTie} mr={2} />
                {team.managerName}
              </Text>
            </Box>
          </HStack>
        </Box>
        
        <CardBody display="flex" flexDirection="column" justifyContent="space-between" w="full" p={4} mt={2}>
          <SimpleGrid columns={2} spacing={4} textAlign="center" mb={4}>
            <Stat>
              <StatNumber display="flex" alignItems="center" justifyContent="center" gap={2}>
                <Icon as={FaTrophy} color="yellow.500" />
                {team.points || 0}
              </StatNumber>
              <StatLabel color={mutedTextColor}>Points</StatLabel>
            </Stat>
            <Stat>
              <StatNumber display="flex" alignItems="center" justifyContent="center" gap={2}>
                <Icon as={FaUsers} color="cyan.500" />
                {team.members?.length || 0}
              </StatNumber>
              <StatLabel color={mutedTextColor}>Members</StatLabel>
            </Stat>
          </SimpleGrid>

          <Button
            w="full"
            variant="outline"
            colorScheme="green"
            leftIcon={<FaEye />}
          >
            View Profile
          </Button>
        </CardBody>
      </VStack>
    </Card>
  );
};

const TeamCardSkeleton = () => {
  const cardBg = useColorModeValue("white", "gray.800");
  
  return (
    <Card bg={cardBg} borderRadius="2xl" overflow="hidden">
      <Skeleton h="120px" />
      <CardBody p={6}>
        <VStack spacing={4} align="stretch">
          <Flex align="center" gap={4}>
            <Skeleton borderRadius="full" boxSize="60px" />
            <Box flex={1}>
              <Skeleton height="20px" mb={2} />
              <Skeleton height="16px" width="70%" />
            </Box>
          </Flex>
          <SimpleGrid columns={2} spacing={4}>
            <Skeleton height="40px" />
            <Skeleton height="40px" />
          </SimpleGrid>
          <Skeleton height="32px" width="50%" mx="auto" />
        </VStack>
      </CardBody>
    </Card>
  );
};

const TeamsList: React.FC = () => {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const toast = useToast();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const allTeams = await getAllTeams();
        
        // Sort teams by points (highest first) and add rank
        const sortedTeams = allTeams
          .sort((a: any, b: any) => (b.points || 0) - (a.points || 0))
          .map((team: any, index) => ({
            ...team,
            rank: index + 1
          })) as TeamData[];
        
        setTeams(sortedTeams);
        setFilteredTeams(sortedTeams);
      } catch (error) {
        console.error("Failed to fetch teams:", error);
        toast({
          title: "Error loading teams",
          description: "Please try again later",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, [toast]);

  useEffect(() => {
    const results = teams.filter(
      (team) =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.managerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTeams(results);
  }, [searchTerm, teams]);

  const renderTeams = () => {
    if (loading) {
      return (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
          {[...Array(6)].map((_, index) => (
            <TeamCardSkeleton key={index} />
          ))}
        </SimpleGrid>
      );
    }

    if (filteredTeams.length === 0) {
      return (
        <VStack spacing={6} py={12}>
          <Icon as={FaSearch} boxSize={16} color="gray.400" />
          <Text fontSize="lg" color={useColorModeValue("gray.600", "gray.400")}>
            {searchTerm ? "No teams found matching your search." : "No teams available."}
          </Text>
          {searchTerm && (
            <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.500")}>
              Try adjusting your search terms.
            </Text>
          )}
        </VStack>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
        {filteredTeams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </SimpleGrid>
    );
  };

  return (
    <Box minH="100vh" bg={useColorModeValue(
      "linear(to-br, gray.50, blue.50, green.50)",
      "linear(to-br, gray.900, blue.900, green.900)"
    )}>
      <NavBar />
      <Container maxW="7xl" py={8}>
        <VStack spacing={8}>
          <Box textAlign="center">
            <Heading
              as="h1"
              size="3xl"
              fontWeight="black"
              bgGradient="linear(to-r, green.400, blue.500)"
              bgClip="text"
            >
              Find Your Next Challenge
            </Heading>
            <Text mt={4} fontSize="xl" color={useColorModeValue("gray.600", "gray.300")}>
              Browse and connect with teams from all over
            </Text>
          </Box>
          <InputGroup size="lg" maxW="2xl">
            <InputLeftElement pointerEvents="none">
              <Icon as={FaSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              type="text"
              placeholder="Search by team name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="full"
              boxShadow="lg"
              bg={useColorModeValue("white", "gray.700")}
              _focus={{
                borderColor: "green.400",
                boxShadow: "outline",
              }}
            />
          </InputGroup>
        </VStack>

        <Box mt={12}>
          {renderTeams()}
        </Box>
      </Container>
    </Box>
  );
};

export default TeamsList;
