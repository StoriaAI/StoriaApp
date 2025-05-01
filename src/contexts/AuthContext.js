import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, getCurrentUser, getSession, handleAuthRedirect, PRODUCTION_URL, checkForLocalhostRedirectIssue } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState(null);

  // Immediately check and fix any redirect issues
  useEffect(() => {
    // If we've detected a bad OAuth state error, handle it
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error_code') === 'bad_oauth_state') {
      console.warn('Detected bad_oauth_state error in AuthContext, clearing URL and resetting auth state');
      // Clear the URL
      window.history.replaceState(null, document.title, window.location.origin + window.location.pathname);
      
      // Force redirect to production if needed
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction && isLocalhost) {
        console.warn('Redirecting from localhost to production domain after auth error');
        window.location.replace('https://joinstoria.vercel.app');
        return;
      }
    }
  }, []);

  // Function to check if a user needs to complete their profile
  const checkProfileStatus = async (userId) => {
    try {
      if (!userId) return false;
      
      console.log('Checking profile status for user ID:', userId);
      
      // Check for an existing profile with has_completed_onboarding=true
      const { data, error } = await supabase
        .from('user_profiles')
        .select('has_completed_onboarding, created_at')
        .eq('user_id', userId)
        .eq('has_completed_onboarding', true)
        .single();
      
      // If we find a profile with has_completed_onboarding = true, user has completed profile setup
      if (!error && data) {
        console.log('User has already completed profile setup:', userId);
        setNeedsProfile(false);
        return false;
      }
      
      // Check if any profile exists at all
      const { data: anyProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, has_completed_onboarding')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (profileError || !anyProfile || anyProfile.length === 0 || !anyProfile[0].has_completed_onboarding) {
        // No profile exists or has_completed_onboarding is false
        console.log('User needs to complete profile setup:', userId);
        setNeedsProfile(true);
        return true;
      }
      
      setNeedsProfile(false);
      return false;
    } catch (err) {
      console.error('Error checking profile status:', err);
      // Default to not needing profile on error
      setNeedsProfile(false);
      return false;
    }
  };

  // Define the OAuth redirect handler function
  const handleOAuthRedirects = async () => {
    // Check for URL hash from OAuth redirects
    if (window.location.hash) {
      console.log('Found hash in URL, processing OAuth redirect');
      try {
        // This will attempt to set the session if the hash contains valid auth data
        const { data, error } = await supabase.auth.getSessionFromUrl();
        
        if (error) {
          console.error('Error processing OAuth redirect:', error);
        } else if (data?.session) {
          console.log('Successfully processed OAuth session');
          setUser(data.session.user);
          
          // Check if the user needs to complete their profile
          await checkProfileStatus(data.session.user.id);
          
          // Remove the hash from the URL without reloading
          window.history.replaceState(null, '', window.location.pathname);
          
          // Redirect to the home page after successful sign-in
          window.location.href = getRedirectUrl();
        }
      } catch (err) {
        console.error('Exception processing OAuth redirect:', err);
      }
    }
  };

  // Handle any OAuth redirects that might be in the URL
  useEffect(() => {
    handleOAuthRedirects();
  }, []);

  useEffect(() => {
    // Check for localhost redirect issue in production
    const hasRedirectIssue = checkForLocalhostRedirectIssue();
    if (hasRedirectIssue) {
      // If we detected and handled a redirect issue, stop execution
      return;
    }

    // Check current session and subscribe to auth changes
    const checkSession = async () => {
      try {
        // Handle any OAuth redirects in the URL
        await handleOAuthRedirects();
        
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Found existing session');
          setUser(session.user);
          
          // Check profile status for current user
          await checkProfileStatus(session.user.id);
        } else {
          console.log('No active session found');
          setUser(null);
        }
        
        // Subscribe to auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state change:', event, session?.user?.id);
            
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('User signed in:', session.user.id);
              setUser(session.user);
              
              // Check profile status for new sign-in
              await checkProfileStatus(session.user.id);
              
              // Redirect to the home page after successful sign-in
              // Use a small delay to ensure state updates happen first
              setTimeout(() => {
                window.location.href = getRedirectUrl();
              }, 300);
            } else if (event === 'SIGNED_OUT') {
              console.log('User signed out');
              setUser(null);
              setNeedsProfile(false);
            } else if (event === 'TOKEN_REFRESHED') {
              console.log('Token refreshed for user');
              if (session?.user) {
                setUser(session.user);
              }
            } else if (event === 'USER_UPDATED') {
              console.log('User updated');
              if (session?.user) {
                setUser(session.user);
              }
            }
          }
        );

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Function to sign in with Google
  const signInWithGoogle = async () => {
    setLoading(true);
    
    try {
      console.log('Starting Google sign-in process');
      console.log('Environment:', process.env.NODE_ENV);
      
      // Get the appropriate redirect URL based on environment
      const redirectBase = getRedirectUrl();
      // Make sure the callback URL is correct - must match what's registered in Google Cloud
      // In production, this should be the full https URL
      const redirectTo = process.env.NODE_ENV === 'production' 
        ? 'https://joinstoria.vercel.app/auth/callback'
        : `${redirectBase}/auth/callback`;
      
      console.log('Using redirect URL:', redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo, // Use our explicit redirect URL
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      console.log('Google auth initiated successfully, redirecting to:', data.url);
      return data;
    } catch (error) {
      console.error('Error signing in with Google:', error.message);
      setError(error.message);
      setLoading(false);
      return { error };
    }
  };

  const value = {
    user,
    loading,
    needsProfile,
    setNeedsProfile,
    isAuthenticated: !!user,
    checkProfileStatus,
    signInWithGoogle,
    setUser,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 