import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { WalletProvider } from './contexts/WalletContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import CreateDID from './pages/CreateDID';
import ResolveDID from './pages/ResolveDID';
import Credentials from './pages/Credentials';
import Contracts from './pages/Contracts';
import Scanner from './pages/Scanner';
import Account from './pages/Account';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WalletProvider>
        <Router>
          <Navbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-did" element={<CreateDID />} />
              <Route path="/resolve-did" element={<ResolveDID />} />
              <Route path="/credentials" element={<Credentials />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/scanner" element={<Scanner />} />
              <Route path="/account" element={<Account />} />
            </Routes>
          </Container>
        </Router>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;
