import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GlobalStateProvider } from './context/GlobalState.tsx';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme.ts';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalStateProvider>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </GlobalStateProvider>
  </React.StrictMode>,
)