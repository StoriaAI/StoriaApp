import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, getCurrentUser, getSession, handleAuthRedirect, PRODUCTION_URL } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [error, setError] = useState(null);

  // Function to check if a user needs to complete onboarding
  const checkOnboardingStatus = async (userId) => {
    try {
      if (!userId) return false;
      
      // Check if the user needs to complete onboarding
      const { data, error } = await supabase
        .from('user_profiles')
        .select('has_completed_onboarding')
        .eq('user_id', userId)
        .single();
      
      // Show onboarding if profile doesn't exist or hasn't completed onboarding
      if (error || !data || !data.has_completed_onboarding) {
        console.log('User needs to complete onboarding:', userId);
        setShowOnboarding(true);
        return true;
      } else {
        setShowOnboarding(false);
        return false;
      }
    } catch (err) {
      console.error('Error checking onboarding status:', err);
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
          
          // Check if the user needs onboarding
          await checkOnboardingStatus(data.session.user.id);
          
          // Remove the hash from the URL without reloading
          window.history.replaceState(null, '', window.location.pathname);
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
          
          // Check onboarding status for current user
          await checkOnboardingStatus(session.user.id);
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
              
              // Check onboarding status for new sign-in
              await checkOnboardingStatus(session.user.id);
            } else if (event === 'SIGNED_OUT') {
              console.log('User signed out');
              setUser(null);
              setShowOnboarding(false);
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
      
      // CRITICAL: Always use absolute URLs with https:// for production
      // This must match exactly what's registered in Google Cloud Console
      const redirectTo = process.env.NODE_ENV === 'production'
        ? 'https://joinstoria.vercel.app/auth/callback' // Explicit absolute URL
        : `${window.location.origin}/auth/callback`;
      
      console.log('Using redirect URL:', redirectTo);
      
      // Generate a unique state parameter to help debug OAuth flow
      const stateParam = `storia_${Date.now()}`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo, // Use our explicit redirect URL
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            state: stateParam, // Add unique state for tracking
            _t: Date.now() // Add cache-busting timestamp
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Store the state parameter in localStorage for verification on return
      if (typeof window !== 'undefined' && data?.url) {
        localStorage.setItem('storia_oauth_state', stateParam);
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
    showOnboarding,
    setShowOnboarding,
    isAuthenticated: !!user,
    checkOnboardingStatus,
    signInWithGoogle,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 