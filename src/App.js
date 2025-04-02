import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BookReader from './pages/BookReader';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import OnboardingWizard from './components/OnboardingWizard';

// Create a base theme with dark mode settings
let theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f4e4bc',
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#1a1625',
      paper: '#241f35',
    },
  },
  typography: {
    fontFamily: "'Playfair Display', serif",
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '1.1rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: { xs: 8, sm: 16 },
          paddingRight: { xs: 8, sm: 16 },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: { xs: 8, sm: 12 },
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

// Apply responsive font sizes to automatically adjust typography
theme = responsiveFontSizes(theme);

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};

// App content component that has access to auth context
const AppContent = () => {
  const { showOnboarding } = useAuth();

  return (
    <>
      <Navbar />
      {showOnboarding && <OnboardingWizard />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route 
          path="/book/:id" 
          element={
            <ProtectedRoute>
              <BookReader />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 