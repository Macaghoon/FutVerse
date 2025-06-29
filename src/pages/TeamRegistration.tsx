import React, { useState } from "react";
import { Box, Button, FormControl, FormLabel, Input, Heading, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { FaUsers, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";
import NavBar from "../components/NavBar";

const TeamRegistration: React.FC = () => {
  const [teamName, setTeamName] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send data to backend
    alert(`Team Registered: ${teamName}`);
  };

  return (
    <Box>
      <NavBar />
      <Flex direction="column" align="center" justify="center" minH="60vh" pt={24} zIndex={1} position="relative">
        <Heading as="h2" size="4xl" color="green.700" fontWeight="extrabold" textAlign="center" mb={4} letterSpacing="tight" lineHeight={1.1}>
          Register Your Team
        </Heading>
        <Text color="gray.600" fontSize="xl" mb={8} textAlign="center" maxW="lg">
          Join the league and start your journey to victory.
        </Text>
        <Box maxW="md" mx="auto" mt={10} p={6} borderWidth={1} borderRadius="lg" bg={useColorModeValue("white", "gray.800")} boxShadow="lg">
          <form onSubmit={handleSubmit}>
            <FormControl mb={4}>
              <FormLabel>Team Name</FormLabel>
              <Input value={teamName} onChange={e => setTeamName(e.target.value)} required />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Location</FormLabel>
              <Input value={location} onChange={e => setLocation(e.target.value)} required />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Contact Email</FormLabel>
              <Input type="email" value={contact} onChange={e => setContact(e.target.value)} required />
            </FormControl>
            <Button colorScheme="green" type="submit" width="full">Register</Button>
          </form>
        </Box>
      </Flex>
    </Box>
  );
};

export default TeamRegistration;
