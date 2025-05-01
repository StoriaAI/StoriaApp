import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  styled,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip
} from '@mui/material';
import { 
  Info, 
  ContactMail, 
  Menu as MenuIcon,
  Home as HomeIcon,
  Close as CloseIcon,
  AccountCircle,
  Login,
  Logout,
  PersonAdd,
  Whatshot
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../lib/supabase';
import '../styles/Navbar.css';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: theme.palette.background.default,
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
  height: 64,
}));

const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.text.primary,
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.25rem',
  },
  [theme.breakpoints.up('sm')]: {
    fontSize: '1.5rem',
  },
}));

const LogoDot = styled('span')(({ theme }) => ({
  display: 'inline-block',
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  marginRight: '6px',
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.primary,
  marginLeft: theme.spacing(2),
  textTransform: 'none',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
}));

const NavLink = styled(RouterLink)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textDecoration: 'none',
  fontSize: '0.9rem',
  marginRight: theme.spacing(3),
  transition: 'color 0.2s',
  '&:hover': {
    color: theme.palette.text.primary,
  },
}));

function Navbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, isAuthenticated, needsProfile } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      handleProfileMenuClose();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Trending', path: '/trending' },
    { name: 'About', path: '/about' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Contact', path: '/contact' }
  ];

  const DrawerList = () => (
    <Box
      sx={{ 
        width: 250,
        backgroundColor: theme.palette.background.default,
        height: '100%',
      }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Logo variant="h6">
          <LogoDot />
          Storia
        </Logo>
        <IconButton onClick={toggleDrawer(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <List sx={{ py: 4 }}>
          <ListItem button component={RouterLink} to="/" onClick={toggleDrawer(false)}>
            <ListItemIcon><HomeIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
          <ListItem button component={RouterLink} to="/trending" onClick={toggleDrawer(false)}>
            <ListItemIcon><Whatshot fontSize="small" /></ListItemIcon>
            <ListItemText primary="Trending" />
          </ListItem>
          <ListItem button component={RouterLink} to="/pricing" onClick={toggleDrawer(false)}>
            <ListItemIcon><Info fontSize="small" /></ListItemIcon>
            <ListItemText primary="Pricing" />
          </ListItem>
          <ListItem button component={RouterLink} to="/about" onClick={toggleDrawer(false)}>
            <ListItemIcon><Info fontSize="small" /></ListItemIcon>
            <ListItemText primary="About" />
          </ListItem>
          <ListItem button component={RouterLink} to="/contact" onClick={toggleDrawer(false)}>
            <ListItemIcon><ContactMail fontSize="small" /></ListItemIcon>
            <ListItemText primary="Contact" />
          </ListItem>
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        {isAuthenticated ? (
          <>
            <ListItem 
              button 
              component={RouterLink}
              to="/profile"
              sx={{ 
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                } 
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.text.primary, minWidth: 40 }}>
                <AccountCircle />
              </ListItemIcon>
              <ListItemText 
                primary="Profile" 
                primaryTypographyProps={{ 
                  fontWeight: 500,
                  color: theme.palette.text.primary
                }}
              />
            </ListItem>
            <ListItem 
              button 
              onClick={handleLogout}
              sx={{ 
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                } 
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.text.primary, minWidth: 40 }}>
                <Logout />
              </ListItemIcon>
              <ListItemText 
                primary="Logout" 
                primaryTypographyProps={{ 
                  fontWeight: 500,
                  color: theme.palette.text.primary
                }}
              />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem 
              button 
              component={RouterLink}
              to="/login"
              sx={{ 
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                } 
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.text.primary, minWidth: 40 }}>
                <Login />
              </ListItemIcon>
              <ListItemText 
                primary="Login" 
                primaryTypographyProps={{ 
                  fontWeight: 500,
                  color: theme.palette.text.primary
                }}
              />
            </ListItem>
            <ListItem 
              button 
              component={RouterLink}
              to="/signup"
              sx={{ 
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                } 
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.text.primary, minWidth: 40 }}>
                <PersonAdd />
              </ListItemIcon>
              <ListItemText 
                primary="Sign Up" 
                primaryTypographyProps={{ 
                  fontWeight: 500,
                  color: theme.palette.text.primary
                }}
              />
            </ListItem>
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <StyledAppBar position="sticky">
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 64 }}>
          {/* Mobile menu icon */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer(true)}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Logo */}
          <Logo 
            variant="h6" 
            component={RouterLink} 
            to="/"
            sx={{ flexGrow: isMobile ? 1 : 0 }}
          >
            <LogoDot />
            Storia
          </Logo>
          
          {/* Desktop navigation */}
          {!isMobile && (
            <Box sx={{ ml: 4, flexGrow: 1, display: 'flex' }}>
              {navItems.map((item) => (
                <NavLink key={item.name} to={item.path}>
                  {item.name}
                </NavLink>
              ))}
            </Box>
          )}
          
          {/* Authentication buttons */}
          <Box>
            {isAuthenticated ? (
              <>
                <Tooltip title="Account">
                  <IconButton 
                    onClick={handleProfileMenuOpen}
                    sx={{ ml: 1 }}
                  >
                    <Avatar 
                      alt={user?.email || 'User'} 
                      src="/static/avatar.jpg"
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.background.default
                      }}
                    >
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                
                <Menu
                  anchorEl={profileMenuAnchor}
                  open={Boolean(profileMenuAnchor)}
                  onClose={handleProfileMenuClose}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  sx={{
                    mt: 1.5,
                    '& .MuiPaper-root': {
                      backgroundColor: theme.palette.background.paper,
                      minWidth: 180,
                    }
                  }}
                >
                  <MenuItem 
                    component={RouterLink} 
                    to="/profile"
                    onClick={handleProfileMenuClose}
                  >
                    Profile
                  </MenuItem>
                  
                  <MenuItem 
                    component={RouterLink} 
                    to="/settings"
                    onClick={handleProfileMenuClose}
                  >
                    Settings
                  </MenuItem>
                  
                  <Divider />
                  
                  <MenuItem onClick={handleLogout}>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                {!isMobile && (
                  <Button 
                    component={RouterLink} 
                    to="/login"
                    variant="text"
                    color="inherit"
                    sx={{ textTransform: 'none' }}
                  >
                    Login
                  </Button>
                )}
                <Button 
                  component={RouterLink} 
                  to="/signup"
                  variant="contained"
                  color="primary"
                  sx={{ 
                    ml: 1.5,
                    textTransform: 'none',
                    borderRadius: '20px',
                    px: 3,
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
      
      {/* Mobile drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <DrawerList />
      </Drawer>
    </StyledAppBar>
  );
}

export default Navbar; 