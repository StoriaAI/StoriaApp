import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  useTheme
} from '@mui/material';
import { 
  LibraryBooks, 
  Info, 
  ContactMail, 
  Menu as MenuIcon,
  Home as HomeIcon,
  Close as CloseIcon
} from '@mui/icons-material';

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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
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
            <Box sx={{ display: 'flex' }}>
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
            </Box>
          )}
        </Toolbar>
      </Container>
    </StyledAppBar>
  );
}

export default Navbar; 