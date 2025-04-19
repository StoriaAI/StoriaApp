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
import '../styles/Navbar.css';

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
  marginLeft: theme.spacing(2),
  '&:hover': {
    backgroundColor: 'rgba(244, 228, 188, 0.1)',
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
          <>
            <ListItem 
              button 
              component={RouterLink}
              to="/profile"
              sx={{ 
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(244, 228, 188, 0.1)',
                } 
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.main, minWidth: 40 }}>
                <AccountCircle />
              </ListItemIcon>
              <ListItemText 
                primary="Profile" 
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
              to="/profile-setup"
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
                primary="Edit Profile Info" 
                primaryTypographyProps={{ 
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 600,
                  color: theme.palette.primary.main
                }}
              />
            </ListItem>
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
    <>
      <StyledAppBar position="static">
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: isMobile ? 1 : 1.5 }}>
            {isMobile || isTablet ? (
              <>
                <IconButton
                  color="primary"
                  aria-label="open drawer"
                  edge="start"
                  onClick={toggleDrawer(true)}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
                <RouterLink to="/" style={{ textDecoration: 'none', flexGrow: 1 }}>
                  <Logo>Storia</Logo>
                </RouterLink>
              </>
            ) : (
              <>
                <RouterLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', marginRight: theme.spacing(4) }}>
                  <Logo>Storia</Logo>
                </RouterLink>
                <Box sx={{ display: 'flex', flexGrow: 1 }}>
                  {navItems.map((item) => (
                    <NavButton
                      key={item.name}
                      component={RouterLink}
                      to={item.path}
                      startIcon={item.icon}
                    >
                      {item.name}
                    </NavButton>
                  ))}
                </Box>
              </>
            )}
            
            {isAuthenticated ? (
              <Box>
                <Tooltip title="Account settings">
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    size="small"
                    sx={{ ml: 2 }}
                    aria-controls={Boolean(profileMenuAnchor) ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={Boolean(profileMenuAnchor) ? 'true' : undefined}
                  >
                    {user?.user_metadata?.avatar_url ? (
                      <Avatar 
                        src={user.user_metadata.avatar_url} 
                        alt={user.user_metadata?.full_name || 'User'} 
                        sx={{ width: 40, height: 40 }}
                      />
                    ) : (
                      <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', color: 'background.default' }}>
                        {user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                    )}
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={profileMenuAnchor}
                  id="account-menu"
                  open={Boolean(profileMenuAnchor)}
                  onClose={handleProfileMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      backgroundColor: theme.palette.background.paper,
                      boxShadow: theme.shadows[4],
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem 
                    onClick={handleProfileMenuClose} 
                    component={RouterLink} 
                    to="/profile"
                  >
                    <AccountCircle sx={{ mr: 2 }} />
                    Profile
                  </MenuItem>
                  <MenuItem 
                    onClick={handleProfileMenuClose} 
                    component={RouterLink} 
                    to="/profile-setup"
                  >
                    <PersonAdd sx={{ mr: 2 }} />
                    Edit Profile Info
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <Logout sx={{ mr: 2 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box>
                {!isMobile && (
                  <>
                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="outlined"
                      sx={{
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                        mr: 1,
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/signup"
                      variant="contained"
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.background.default,
                        '&:hover': {
                          bgcolor: theme.palette.primary.dark,
                        },
                      }}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
                {isMobile && (
                  <IconButton
                    color="primary"
                    aria-label="menu"
                    edge="end"
                    onClick={toggleDrawer(true)}
                  >
                    <MenuIcon />
                  </IconButton>
                )}
              </Box>
            )}
          </Toolbar>
        </Container>
      </StyledAppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <DrawerList />
      </Drawer>
    </>
  );
}

export default Navbar; 