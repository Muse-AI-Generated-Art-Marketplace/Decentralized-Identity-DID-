import React from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import {
  Box,
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { WalletProvider } from "./contexts/WalletContext";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import CreateDID from "./pages/CreateDID";
import ResolveDID from "./pages/ResolveDID";
import Credentials from "./pages/Credentials";
import Account from "./pages/Account";
import Contracts from "./pages/Contracts";
import Scanner from "./pages/Scanner";
import ConnectWallet from "./pages/ConnectWallet";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#5ad1e6",
    },
    secondary: {
      main: "#ffb84d",
    },
    background: {
      default: "#09131a",
      paper: "#10202b",
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))",
          border: "1px solid rgba(255,255,255,0.08)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
  },
});

const AppShell = () => (
  <Box
    sx={{
      minHeight: "100vh",
      background:
        "radial-gradient(circle at top, rgba(90, 209, 230, 0.14), transparent 35%), #09131a",
    }}
  >
    <Navbar />
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create-did" element={<CreateDID />} />
        <Route path="/resolve-did" element={<ResolveDID />} />
        <Route path="/credentials" element={<Credentials />} />
        <Route path="/account" element={<Account />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/connect" element={<ConnectWallet />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Container>
    <ToastContainer
      autoClose={3500}
      newestOnTop
      position="bottom-right"
      theme="dark"
    />
  </Box>
);

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <WalletProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </WalletProvider>
  </ThemeProvider>
);

export default App;
