import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Link, 
  Alert,
  useTheme,
  useMediaQuery,
  Divider,
  CircularProgress
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { signUp, signInWithGoogle, PRODUCTION_URL } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import GoogleIcon from '@mui/icons-material/Google';
import { debugOAuthRedirects, fixOAuthRedirectIssues } from '../../util/debugOAuth';
import { logRedirectInfo, detectRedirectIssue } from '../../util/redirectChecker';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [signInError, setSignInError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, signup, signInWithGoogle } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // Check for production environment but on localhost URL
    const isProduction = process.env.NODE_ENV === 'production';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // If we detect we're on localhost in production, force redirect
    if (isProduction && isLocalhost) {
      console.log('🚨 SignUp component detected localhost in production, redirecting to:', PRODUCTION_URL);
      window.location.replace(PRODUCTION_URL); // Use replace instead of href for cleaner history
      return; // Exit early, no need to continue
    }
    
    // Log redirect info to help with debugging
    logRedirectInfo();

    // Check for OAuth hash or errors in the URL
    if (location.hash || location.search) {
      // Run fix for OAuth redirect issues
      fixOAuthRedirectIssues().then(result => {
        if (result.success) {
          console.log('Successfully processed OAuth redirect');
        } else if (result.error && result.error !== 'No OAuth hash detected in URL') {
          console.error('Error fixing OAuth redirect:', result.error);
        }
      });
      
      // Check for error description in query params
      const params = new URLSearchParams(location.search);
      const errorDescription = params.get('error_description');
      if (errorDescription) {
        setError(decodeURIComponent(errorDescription));
      }
    }

    // Log debugging information for OAuth redirects
    const debug = debugOAuthRedirects();
    setDebugInfo(debug);

    // Redirect to home if already authenticated
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const { data, error: signUpError } = await signUp(email, password);
      
      if (signUpError) throw signUpError;
      
      if (data) {
        // Success - onboarding will be shown automatically
        navigate('/');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignUp = async (e) => {
    e.preventDefault();
    setGoogleLoading(true);
    setSignInError(null);
    try {
      console.log('Initiating Google signup');
      const { error } = await signInWithGoogle();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Google signup error:', error.message);
      setSignInError(error.message);
      setGoogleLoading(false);
    }
  };
  
  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 4, md: 8 }, mb: { xs: 8, md: 8 }, flex: '1 0 auto' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 3, md: 4 }, 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'background.paper'
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom sx={{ mb: 3 }}>
          Create Your Account
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          size="large"
          startIcon={googleLoading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
          sx={{ mb: 3 }}
        >
          {googleLoading ? 'Connecting to Google...' : 'Sign up with Google'}
        </Button>
        
        <Divider sx={{ width: '100%', mb: 3 }}>
          <Typography variant="body2" color="textSecondary">
            Or sign up with email
          </Typography>
        </Divider>
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Creating Account...
              </>
            ) : 'Sign Up'}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" variant="body2">
                Sign In
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Debug info in development mode */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <Paper sx={{ mt: 3, p: 2, opacity: 0.8 }}>
          <Typography variant="caption">OAuth Debug Info:</Typography>
          <Typography variant="caption" component="div">
            Environment: {debugInfo.environment} | 
            Redirect URL: {debugInfo.determinedRedirectUrl}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default SignUp; 