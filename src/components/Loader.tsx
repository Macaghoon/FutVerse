import React from "react";
import { Box } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import soccerBall from "../assets/soccer-ball-svgrepo-com.svg";

const roll = keyframes`
  0% { transform: translateX(0) rotate(0deg);}
  100% { transform: translateX(100px) rotate(360deg);}
`;

const Loader: React.FC = () => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    minH="100vh"
    bg="white"
    position="fixed"
    top={0}
    left={0}
    width="100vw"
    height="100vh"
    zIndex={9999}
  >
    <Box
      as="img"
      src={soccerBall}
      alt="Loading..."
      boxSize="80px"
      animation={`${roll} 1s linear infinite`}
      boxShadow="none"
      filter="none"
    />
  </Box>
);

export default Loader; 