import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import { supabase, PRODUCTION_URL } from '../../lib/supabase';

/**
 * AuthStatus - A comprehensive page to show authentication status
 * and help users troubleshoot authentication issues
 */
const AuthStatus = () => {
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState('Checking authentication status...');
  const [error, setError] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const [authDetails, setAuthDetails] = useState({
    isAuthenticated: false,
    hasSession: false,
    hasValidToken: false,
    domain: window.location.hostname,
    environment: process.env.NODE_ENV,
    hasUrlHash: window.location.hash.length > 0,
    hashContainsToken: window.location.hash.includes('access_token'),
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isProductionDomain: window.location.hostname === PRODUCTION_URL.replace('https://', '')
  });
  const location = useLocation();
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check session
        const { data: sessionData } = await supabase.auth.getSession();
        const hasValidSession = !!sessionData?.session;
        
        // Update auth details
        setAuthDetails(prev => ({
          ...prev,
          isAuthenticated: !!user,
          hasSession: hasValidSession,
          hasValidToken: hasValidSession && new Date(sessionData.session.expires_at * 1000) > new Date(),
          urlParams: new URLSearchParams(window.location.search).toString(),
          urlHash: window.location.hash,
        }));
        
        // Handle localhost in production
        if (process.env.NODE_ENV === 'production' && authDetails.isLocalhost) {
          setStatus('Detected localhost in production environment');
          setError('You are accessing a production build on localhost. This can cause authentication issues.');
          
          // Start countdown to redirect to production
          let count = 10;
          setRedirectCountdown(count);
          
          const interval = setInterval(() => {
            count--;
            setRedirectCountdown(count);
            
            if (count <= 0) {
              clearInterval(interval);
              window.location.href = PRODUCTION_URL;
            }
          }, 1000);
          
          return () => clearInterval(interval);
        }
        
        // If authenticated, show success
        if (isAuthenticated) {
          setStatus('Authentication successful!');
          
          // Redirect to home after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          // Check if we have a hash with tokens but failed to authenticate
          if (window.location.hash && window.location.hash.includes('access_token')) {
            setStatus('Authentication tokens detected but failed to authenticate');
            setError('Failed to process authentication tokens. Please try signing in again.');
          } else {
            setStatus('Not authenticated');
          }
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setStatus('Authentication check failed');
        setError(err.message);
      }
    };
    
    checkAuth();
  }, [isAuthenticated, user, navigate]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Authentication Status
        </Typography>
        
        <Box sx={{ mt: 2, mb: 4, textAlign: 'center' }}>
          {isAuthenticated ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Successfully authenticated! Redirecting to dashboard...
            </Alert>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              {status}
            </Alert>
          )}
          
          {redirectCountdown !== null && (
            <Typography>
              Redirecting to production URL in {redirectCountdown} seconds...
            </Typography>
          )}
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Authentication Details
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              {authDetails.isAuthenticated ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
            </ListItemIcon>
            <ListItemText 
              primary="Authentication Status" 
              secondary={authDetails.isAuthenticated ? 'Authenticated' : 'Not Authenticated'} 
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              {authDetails.hasSession ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
            </ListItemIcon>
            <ListItemText 
              primary="Session Status" 
              secondary={authDetails.hasSession ? 'Valid Session' : 'No Session'} 
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              {authDetails.environment === 'production' ? 
                (authDetails.isProductionDomain ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />) : 
                <PendingIcon color="warning" />
              }
            </ListItemIcon>
            <ListItemText 
              primary="Environment" 
              secondary={`${authDetails.environment} (${authDetails.domain})`} 
            />
          </ListItem>
          
          {authDetails.hasUrlHash && (
            <ListItem>
              <ListItemIcon>
                {authDetails.hashContainsToken ? <CheckCircleIcon color="success" /> : <PendingIcon color="warning" />}
              </ListItemIcon>
              <ListItemText 
                primary="URL Hash" 
                secondary={authDetails.hashContainsToken ? 'Contains authentication token' : 'No authentication token'} 
              />
            </ListItem>
          )}
        </List>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/login')}
          >
            Return to Login
          </Button>
          
          <Button 
            variant="outlined"
            onClick={() => {
              // Clear browser data related to auth
              localStorage.removeItem('supabase.auth.token');
              sessionStorage.clear();
              // Reload the page
              window.location.reload();
            }}
          >
            Clear Auth Data & Reload
          </Button>
        </Box>
      </Paper>
      
      {/* Show detailed debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <Paper elevation={2} sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Debug Information
          </Typography>
          
          <Box component="pre" sx={{ 
            bgcolor: 'background.default', 
            p: 2, 
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: '300px',
            fontSize: '0.875rem'
          }}>
            {JSON.stringify(authDetails, null, 2)}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default AuthStatus; 