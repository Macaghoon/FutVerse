import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  colors: {
    brand: {
      50: "#e3fcec",
      100: "#c6f7e2",
      200: "#8eedc7",
      300: "#65d6ad",
      400: "#3ebd93",
      500: "#27ab83",
      600: "#199473",
      700: "#147d64",
      800: "#0c6b58",
      900: "#014d40",
    },
    green: {
      50: "#e6f9f0",
      100: "#b8f2d8",
      200: "#8aeac0",
      300: "#5ce3a8",
      400: "#2edb90",
      500: "#00d378",
      600: "#00a95e",
      700: "#007f44",
      800: "#00552a",
      900: "#002b10",
    },
  },
  fonts: {
    heading: "'Montserrat', sans-serif",
    body: "'Inter', sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: "gray.50",
        color: "gray.800",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "bold",
        borderRadius: "xl",
      },
      variants: {
        solid: {
          bg: "green.500",
          color: "white",
          _hover: { bg: "green.600" },
        },
        outline: {
          borderColor: "green.500",
          color: "green.600",
          _hover: { bg: "green.50" },
        },
      },
    },
    Heading: {
      baseStyle: {
        color: "green.700",
        fontWeight: "extrabold",
      },
    },
  },
});

export default theme;