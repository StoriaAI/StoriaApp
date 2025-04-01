import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  styled,
} from '@mui/material';
import { LibraryBooks, Info, ContactMail } from '@mui/icons-material';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'transparent',
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const Logo = styled(Typography)(({ theme }) => ({
  fontFamily: "'Playfair Display', serif",
  fontSize: '2rem',
  fontWeight: 700,
  color: theme.palette.primary.main,
  textDecoration: 'none',
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  marginLeft: theme.spacing(3),
  '&:hover': {
    backgroundColor: 'rgba(244, 228, 188, 0.1)',
  },
}));

function Navbar() {
  return (
    <StyledAppBar position="static">
      <Container>
        <Toolbar disableGutters>
          <RouterLink to="/" style={{ textDecoration: 'none' }}>
            <Logo variant="h1">Storia</Logo>
          </RouterLink>
          <Box sx={{ flexGrow: 1 }} />
          <NavButton
            component={RouterLink}
            to="/books"
            startIcon={<LibraryBooks />}
          >
            Books
          </NavButton>
          <NavButton
            component={RouterLink}
            to="/about"
            startIcon={<Info />}
          >
            About
          </NavButton>
          <NavButton
            component={RouterLink}
            to="/contact"
            startIcon={<ContactMail />}
          >
            Contact
          </NavButton>
        </Toolbar>
      </Container>
    </StyledAppBar>
  );
}

export default Navbar; 