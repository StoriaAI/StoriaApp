import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BookReader from './pages/BookReader';
import BookDetail from './pages/BookDetail';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import About from './pages/About';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import ProfilePage from './pages/ProfilePage';
import Search from './pages/Search';
import Trending from './pages/Trending';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { CircularProgress, Box } from '@mui/material';
import { supabase } from './lib/supabase';
import { debugAuth, handleHashRedirect } from './util/debugAuth';
import { debugOAuthRedirects, fixOAuthRedirectIssues } from './util/debugOAuth';
import AuthCallback from './components/auth/AuthCallback';
import AuthStatus from './pages/Auth/AuthStatus';
import AdminLogin from './pages/Auth/AdminLogin';
import Dashboard from './pages/Admin/Dashboard';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';

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
      default: '#0a0a0a',
      paper: '#111111',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a0a0a0',
    }
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.3rem',
    },
    body1: {
      fontSize: '1rem',
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
          backgroundColor: '#111111',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '8px 0',
          '&:last-child': {
            paddingBottom: 8,
          }
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  const { setUser } = useAuth();
  
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
  
    // Only handle redirects if we're not already on an auth callback route
    // This prevents double-handling of auth callbacks
    if (location.pathname !== '/auth/callback' && location.pathname !== '/auth/v2/callback') {
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
                
                if (data.session && data.session.user) {
                  // Update user state in auth context
                  setUser(data.session.user);
                }
              }
            });
          });
        });
      }
    }
  }, [location, setUser]);

  // This component doesn't render anything
  return null;
};

// Protected route component - redirect users to profile if they need to complete it
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, needsProfile } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  // If user needs to complete their profile, redirect to profile page
  if (needsProfile) return <Navigate to="/profile-setup" />;
  
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
  return <Home />;
};

// App content component that has access to auth context
const AppContent = () => {
  const { loading, needsProfile } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path="/search" element={<Search />} />
        <Route path="/trending" element={<Trending />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/read/:id" element={<ProtectedRoute><BookReader /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile-setup" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/v2/callback" element={<AuthCallback />} />
        <Route path="/auth/status" element={<AuthStatus />} />
        
        {/* Admin Routes */}
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <ProtectedAdminRoute>
            <Dashboard />
          </ProtectedAdminRoute>
        } />
      </Routes>
      <Footer />
    </>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AdminAuthProvider>
            <HandleOAuthRedirect />
            <AppContent />
          </AdminAuthProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App; 