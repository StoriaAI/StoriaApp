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
  LibraryBooks, 
  Info, 
  ContactMail, 
  Menu as MenuIcon,
  Home as HomeIcon,
  Close as CloseIcon,
  AccountCircle,
  Login,
  Logout,
  PersonAdd
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../lib/supabase';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'transparent',
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const Logo = styled(Typography)(({ theme }) => ({
  fontFamily: "'Playfair Display', serif",
  fontWeight: 700,
  color: theme.palette.primary.main,
  textDecoration: 'none',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.75rem',
  },
  [theme.breakpoints.up('sm')]: {
    fontSize: '2rem',
  },
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  marginLeft: theme.spacing(3),
  '&:hover': {
    backgroundColor: 'rgba(244, 228, 188, 0.1)',
  },
  [theme.breakpoints.down('md')]: {
    marginLeft: theme.spacing(1),
    padding: theme.spacing(1),
    minWidth: 'unset',
    '& .MuiButton-startIcon': {
      margin: 0,
    },
    '& .MuiButton-endIcon': {
      margin: 0,
    },
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
    },
    '& .MuiTypography-root': {
      display: 'none',
    },
  },
}));

function Navbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
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
    { name: 'Home', icon: <HomeIcon />, path: '/' },
    { name: 'Books', icon: <LibraryBooks />, path: '/books' },
    { name: 'About', icon: <Info />, path: '/about' },
    { name: 'Contact', icon: <ContactMail />, path: '/contact' }
  ];

  const DrawerList = () => (
    <Box
      sx={{ width: 250 }}
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
        <Logo variant="h6">Storia</Logo>
        <IconButton onClick={toggleDrawer(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            component={RouterLink} 
            to={item.path} 
            key={item.name}
            sx={{ 
              py: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(244, 228, 188, 0.1)',
              } 
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.primary.main, minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.name} 
              primaryTypographyProps={{ 
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                color: theme.palette.primary.main
              }}
            />
          </ListItem>
        ))}
        
        <Divider sx={{ my: 2 }} />
        
        {isAuthenticated ? (
          <ListItem 
            button 
            onClick={handleLogout}
            sx={{ 
              py: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(244, 228, 188, 0.1)',
              } 
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.primary.main, minWidth: 40 }}>
              <Logout />
            </ListItemIcon>
            <ListItemText 
              primary="Log Out" 
              primaryTypographyProps={{ 
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                color: theme.palette.primary.main
              }}
            />
          </ListItem>
        ) : (
          <>
            <ListItem 
              button 
              component={RouterLink} 
              to="/login"
              sx={{ 
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(244, 228, 188, 0.1)',
                } 
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.main, minWidth: 40 }}>
                <Login />
              </ListItemIcon>
              <ListItemText 
                primary="Login" 
                primaryTypographyProps={{ 
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 600,
                  color: theme.palette.primary.main
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
                  backgroundColor: 'rgba(244, 228, 188, 0.1)',
                } 
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.main, minWidth: 40 }}>
                <PersonAdd />
              </ListItemIcon>
              <ListItemText 
                primary="Sign Up" 
                primaryTypographyProps={{ 
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 600,
                  color: theme.palette.primary.main
                }}
              />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <StyledAppBar position="static">
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: isMobile ? 1 : 0 }}>
          <RouterLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Logo variant="h1">Storia</Logo>
          </RouterLink>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {isMobile ? (
            <>
              <IconButton 
                edge="end" 
                color="primary" 
                aria-label="menu"
                onClick={toggleDrawer(true)}
              >
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={toggleDrawer(false)}
              >
                <DrawerList />
              </Drawer>
            </>
          ) : (
            // Desktop navigation
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {navItems.map((item, index) => (
                index !== 0 && (
                  <NavButton
                    key={item.name}
                    component={RouterLink}
                    to={item.path}
                    startIcon={item.icon}
                  >
                    {item.name}
                  </NavButton>
                )
              ))}
              
              {isAuthenticated ? (
                <>
                  <Tooltip title="Account settings">
                    <IconButton 
                      onClick={handleProfileMenuOpen}
                      size="small"
                      sx={{ ml: 2 }}
                    >
                      <Avatar 
                        alt={user?.email} 
                        src={user?.user_metadata?.avatar_url || ''} 
                        sx={{ 
                          width: 40, 
                          height: 40,
                          bgcolor: theme.palette.primary.main,
                          color: theme.palette.background.default
                        }}
                      >
                        {user?.email?.charAt(0).toUpperCase() || <AccountCircle />}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={profileMenuAnchor}
                    open={Boolean(profileMenuAnchor)}
                    onClose={handleProfileMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}>
                      Profile
                    </MenuItem>
                    <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/settings'); }}>
                      Settings
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: 'flex' }}>
                  <NavButton
                    component={RouterLink}
                    to="/login"
                    startIcon={<Login />}
                  >
                    Login
                  </NavButton>
                  <NavButton
                    component={RouterLink}
                    to="/signup"
                    startIcon={<PersonAdd />}
                  >
                    Sign Up
                  </NavButton>
                </Box>
              )}
            </Box>
          )}
        </Toolbar>
      </Container>
    </StyledAppBar>
  );
}

export default Navbar; 