import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, handleAuthRedirect } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../common/Loading';

// Helper function to get the appropriate redirect URL
const getRedirectUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Always use the production URL in production mode
  if (isProduction) {
    return 'https://joinstoria.vercel.app';
  }
  
  // In development, use the current origin
  return window.location.origin;
};

/**
 * AuthCallback component - Handles OAuth redirects and processes authentication tokens
 * 
 * This component is rendered at the /auth/callback route and handles:
 * 1. Processing of OAuth redirect parameters (access_token, refresh_token, etc.)
 * 2. Storing the session in Supabase's session management
 * 3. Redirecting to the appropriate page after authentication
 */
const AuthCallback = () => {
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, isAuthenticated } = useAuth();

  useEffect(() => {
    const processAuthRedirect = async () => {
      try {
        setStatus('Processing authentication redirect...');
        console.log('🔐 [Auth Callback] Processing OAuth redirect');
        console.log('Current URL:', window.location.href);
        
        // Check if we're mistakenly on localhost in production
        if (process.env.NODE_ENV === 'production' && 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          console.error('CRITICAL ERROR: OAuth redirected to localhost in production!');
          setError('Authentication error: Redirected to localhost in production.');
          
          // Attempt to redirect to the correct production URL
          const productionUrl = getRedirectUrl();
          setStatus(`Redirecting to ${productionUrl}...`);
          
          // Preserve the hash fragment with auth tokens
          const redirectUrl = productionUrl + 
            window.location.pathname + 
            window.location.search + 
            window.location.hash;
            
          console.log('Redirecting to:', redirectUrl);
          
          // Allow time for logging before redirect
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1000);
          return;
        }
        
        // Check for hash fragment in URL (#access_token=...)
        if (!location.hash || !location.hash.includes('access_token')) {
          console.error('No authentication tokens found in URL');
          setError('Authentication failed - No tokens found in URL');
          setStatus('Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Process the auth redirect and extract session
        console.log('Processing auth tokens from hash:', location.hash);
        try {
          // Use supabase directly to process the session from URL
          const { data, error: sessionError } = await supabase.auth.getSessionFromUrl();
          
          if (sessionError) {
            console.error('Error processing session from URL:', sessionError);
            throw sessionError;
          }
          
          console.log('Session data from URL:', data);
          
          if (data?.session) {
            console.log('Successfully processed session from URL');
            setStatus('Authentication successful!');
            
            // Set user in context
            setUser(data.session.user);
            
            // Redirect to home page
            const homeUrl = getRedirectUrl() + '/';
            setStatus(`Redirecting to ${homeUrl}...`);
            
            // Clean URL and redirect
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Use a short delay to ensure everything is processed
            setTimeout(() => {
              // Use window.location for a full page reload to ensure everything is fresh
              window.location.href = homeUrl;
            }, 1000);
            return;
          }
        } catch (sessionErr) {
          console.error('Error getting session from URL:', sessionErr);
          // Fall through to try backup method
        }
        
        // Backup method - use handleAuthRedirect and get session afterward
        const { data, error: redirectError } = handleAuthRedirect();
        
        if (redirectError) {
          console.error('Error processing authentication:', redirectError);
          setError(`Authentication error: ${redirectError.message || 'Unknown error'}`);
          setStatus('Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        setStatus('Authentication successful!');
        console.log('🔐 [Auth Callback] Authentication successful');
        
        // Get current session to ensure we have the user
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session?.user) {
          // Update auth context
          setUser(sessionData.session.user);
          
          // Determine where to redirect the user
          setStatus('Redirecting to home page...');
          
          // Redirect to home page
          const homeUrl = getRedirectUrl() + '/';
          
          // Use a short delay to ensure everything is processed
          setTimeout(() => {
            // Use window.location for a full page reload to ensure everything is fresh
            window.location.href = homeUrl;
          }, 1000);
        } else {
          // This shouldn't happen if we have a valid token, but just in case
          setError('Failed to retrieve user session');
          setStatus('Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        console.error('Exception in auth callback:', err);
        setError(`Unexpected error: ${err.message || 'Unknown error'}`);
        setStatus('Redirecting to login due to error...');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    processAuthRedirect();
  }, [navigate, location.hash, setUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-center text-indigo-600">
          Storia Authentication
        </h1>
        
        <div className="flex flex-col items-center space-y-4">
          <Loading size="large" />
          
          <p className="text-center text-gray-700">{status}</p>
          
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback; 