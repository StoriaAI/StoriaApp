import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BookReader from './pages/BookReader';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import About from './pages/About';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import OnboardingWizard from './components/OnboardingWizard';
import { CircularProgress, Box } from '@mui/material';
import { supabase } from './lib/supabase';
import { debugAuth, handleHashRedirect } from './util/debugAuth';
import { debugOAuthRedirects, fixOAuthRedirectIssues } from './util/debugOAuth';
import AuthCallback from './components/auth/AuthCallback';
import AuthStatus from './pages/Auth/AuthStatus';

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

// Loading component
const LoadingScreen = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}
  >
    <CircularProgress size={60} />
  </Box>
);

// Component to handle OAuth redirects
const HandleOAuthRedirect = () => {
  const location = useLocation();
  
  useEffect(() => {
    // CRITICAL: Check if we're mistakenly on localhost in production
    const isProduction = process.env.NODE_ENV === 'production';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isProduction && isLocalhost) {
      console.error('🚨 CRITICAL ERROR: Detected localhost in production environment!');
      
      // Only redirect if this appears to be an OAuth callback (has hash with tokens)
      if (window.location.hash && (
          window.location.hash.includes('access_token') || 
          window.location.hash.includes('error=')
      )) {
        console.error('OAuth redirect to localhost detected in production - redirecting to production URL');
        
        const productionUrl = 'https://joinstoria.vercel.app';
        const redirectUrl = productionUrl + 
          window.location.pathname + 
          window.location.search + 
          window.location.hash;
        
        console.log('Redirecting to:', redirectUrl);
        window.location.replace(redirectUrl);
        return;
      }
    }
  
    // Check if there's a hash in the URL (common for OAuth redirects)
    if (location.hash || location.search) {
      console.log('Detected potential auth redirect in HandleOAuthRedirect component');
      
      // Run our new OAuth debug helper
      debugOAuthRedirects();
      
      // Try to fix common OAuth issues
      fixOAuthRedirectIssues().then(result => {
        if (result.success) {
          console.log('Successfully fixed OAuth redirect in HandleOAuthRedirect component!');
          return;
        }
        
        // If the new utility didn't fix it, try the original debug helper as fallback
        debugAuth().then(() => {
          console.log('Debug complete. Attempting to handle hash redirect...');
          
          // Explicitly handle the hash redirect
          handleHashRedirect().then(({ data, error }) => {
            if (error) {
              console.error('Failed to handle hash redirect:', error);
            } else if (data) {
              console.log('Successfully handled hash redirect in HandleOAuthRedirect component!');
              
              // Clear the URL
              window.history.replaceState(null, '', window.location.pathname);
            }
          });
        });
      });
    }
  }, [location]);
  
  return null;
};

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};

// Public route - redirects to home if already authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" />;
  
  return children;
};

// Landing page component
const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Home />;
  }
  
  return <Navigate to="/login" />;
};

// App content component that has access to auth context
const AppContent = () => {
  const { showOnboarding, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh' 
    }}>
      <HandleOAuthRedirect />
      <Navbar />
      {showOnboarding && <OnboardingWizard />}
      <Box sx={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            } 
          />
          {/* Auth Routes */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/v2/callback" element={<AuthCallback />} />
          <Route path="/auth/status" element={<AuthStatus />} />
          
          <Route 
            path="/books" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/book/:id" 
            element={
              <ProtectedRoute>
                <BookReader />
              </ProtectedRoute>
            } 
          />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
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