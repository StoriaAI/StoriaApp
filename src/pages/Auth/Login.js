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
import { signIn, signInWithGoogle } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import GoogleIcon from '@mui/icons-material/Google';
import { debugOAuthRedirects, fixOAuthRedirectIssues } from '../../util/debugOAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
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
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const { data, error: signInError } = await signIn(email, password);
      
      if (signInError) throw signInError;
      
      if (data) {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      
      // Clean up the URL in case it has any auth params from a failed login
      if (location.hash || location.search) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      
      // Log debug info before initiating sign-in
      debugOAuthRedirects();
      
      const { error: googleSignInError } = await signInWithGoogle();
      
      if (googleSignInError) throw googleSignInError;
      
      // The redirect will happen automatically by Supabase
      // We'll set a fallback for when we return
      setTimeout(() => {
        setGoogleLoading(false);
      }, 5000);
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err.message || 'Failed to sign in with Google.');
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
          Welcome Back
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
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          sx={{ mb: 3 }}
        >
          {googleLoading ? 'Connecting to Google...' : 'Sign in with Google'}
        </Button>
        
        <Divider sx={{ width: '100%', mb: 3 }}>
          <Typography variant="body2" color="textSecondary">
            Or sign in with email
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
                Signing in...
              </>
            ) : 'Sign In'}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/signup" variant="body2">
                Sign Up
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

export default Login; 