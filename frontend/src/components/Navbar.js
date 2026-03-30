import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  AccountBalanceWallet,
  AccountCircle,
  ExitToApp,
  Link as LinkIcon
} from '@mui/icons-material';
import { useWallet } from '../contexts/WalletContext';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { wallet, isConnected, loading, connectWallet, disconnectWallet } = useWallet();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    handleClose();
    navigate('/');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <AppBar position="static" sx={{ mb: 2 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            Stellar DID Platform
          </Link>
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Navigation Links */}
          <Button color="inherit" component={Link} to="/dashboard">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} to="/create-did">
            Create DID
          </Button>
          <Button color="inherit" component={Link} to="/resolve-did">
            Resolve DID
          </Button>
          <Button color="inherit" component={Link} to="/credentials">
            Credentials
          </Button>
          <Button color="inherit" component={Link} to="/contracts">
            Contracts
          </Button>
          <Button color="inherit" component={Link} to="/scanner">
            Scanner
          </Button>

          {/* Wallet Connection Status */}
          {isConnected ? (
            <>
              <Chip
                icon={<AccountBalanceWallet />}
                label={`Connected: ${formatAddress(wallet?.publicKey)}`}
                color="success"
                variant="outlined"
                onClick={handleMenu}
                sx={{ cursor: 'pointer' }}
              />
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => { handleClose(); navigate('/account'); }}>
                  <AccountCircle sx={{ mr: 1 }} />
                  My Account
                </MenuItem>
                <MenuItem onClick={handleDisconnect}>
                  <ExitToApp sx={{ mr: 1 }} />
                  Disconnect Wallet
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              variant="outlined"
              startIcon={loading ? <CircularProgress size={20} /> : <LinkIcon />}
              onClick={connectWallet}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
