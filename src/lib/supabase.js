import { createClient } from '@supabase/supabase-js';

// Use only environment variables without hardcoded fallbacks for security
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLIC_KEY;

// Hardcoded production URL - this MUST match your actual production URL
// This is used in multiple places to force correct redirects
export const PRODUCTION_URL = 'https://joinstoria.vercel.app'; // Updated to match Storia's production URL

// Check if we're running in production
const isProduction = process.env.NODE_ENV === 'production';

// Check if we're running on localhost
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// For debugging auth issues
const DEBUG_AUTH = true; // Set to false in production after issues are resolved

// Enhanced debug logging function that only logs in non-production or when DEBUG_AUTH is true
const debugLog = (...args) => {
  if (DEBUG_AUTH || !isProduction) {
    console.log('🔐 [Auth Debug]:', ...args);
  }
};

// Force redirect if we're on localhost in production
if (isProduction && isLocalhost && typeof window !== 'undefined') {
  console.error('🚨 CRITICAL: Running on localhost in production! Redirecting to:', PRODUCTION_URL);
  window.location.replace(PRODUCTION_URL + window.location.pathname + window.location.search + window.location.hash);
}

// Validate environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// IMPORTANT: Get the correct site URL for redirects
// Will use the production URL in production, otherwise use the current origin
const getSiteUrl = () => {
  if (typeof window === 'undefined') return 'https://joinstoria.vercel.app'; // SSR case
  
  // Always use production URL in production environment, regardless of hostname
  if (isProduction) return 'https://joinstoria.vercel.app';
  
  // In development, use the actual origin
  return window.location.origin;
};

debugLog('Environment:', isProduction ? 'Production' : 'Development');
debugLog('Site URL:', getSiteUrl());

// Create a Supabase client with autoRefreshToken and persistSession enabled
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    debug: DEBUG_AUTH || !isProduction, // Enhanced debugging
    storage: localStorage, // Use default local storage directly
    // CRITICAL: Always use absolute URLs with https:// protocol
    site_url: getSiteUrl(),
    // Don't set global redirect_to as we'll set it specifically in each auth function
    cookieOptions: {
      sameSite: 'lax',
      secure: isProduction,
      // No explicit domain - let browser handle it based on current site
      // This is critical for authentication to work properly
    }
  }
});

// Set up a global redirect check on authentication state changes
if (typeof window !== 'undefined') {
  // Capture auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    debugLog('Auth state changed:', event, 'Session:', session ? 'exists' : 'none');
    
    // If we're in production and somehow on localhost, force redirect back to production
    if (isProduction && isLocalhost) {
      console.error('Detected localhost in production after auth event, redirecting to:', PRODUCTION_URL);
      window.location.replace(PRODUCTION_URL + window.location.pathname + window.location.search + window.location.hash);
    }
    
    // After sign in, check URL and clean it if needed
    if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
      // Get the current path without the auth hash
      const cleanPath = window.location.pathname;
      debugLog('Cleaning URL after sign-in, removing hash fragment');
      window.history.replaceState(null, document.title, cleanPath);
    }
  });
}

// Authentication helper functions
export const signUp = async (email, password) => {
  try {
    debugLog('Signing up with email:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        redirectTo: getSiteUrl()
      }
    });
    
    if (error) {
      debugLog('Sign-up error:', error.message);
    } else {
      debugLog('Sign-up successful, user:', data.user?.id);
    }
    
    return { data, error };
  } catch (err) {
    console.error('Exception during sign-up:', err);
    return { data: null, error: err };
  }
};

export const signIn = async (email, password) => {
  try {
    debugLog('Signing in with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      debugLog('Sign-in error:', error.message);
    } else {
      debugLog('Sign-in successful, user:', data.user?.id);
    }
    
    return { data, error };
  } catch (err) {
    console.error('Exception during sign-in:', err);
    return { data: null, error: err };
  }
};

export const signInWithGoogle = async () => {
  try {
    console.group('Google Auth Redirect Debug Information');
    debugLog('Environment:', isProduction ? 'Production' : 'Development');
    debugLog('Is Localhost:', isLocalhost);
    debugLog('Current origin:', window.location.origin);
    
    // CRITICAL: Always use the FULL production URL in production
    // This must match the exact URL registered in Google Cloud Console
    // Using ABSOLUTE URL with https:// is critical
    const redirectUrl = isProduction 
      ? 'https://joinstoria.vercel.app/auth/callback' // Absolute URL with protocol
      : getSiteUrl() + '/auth/callback';
    
    debugLog('Final redirect URL:', redirectUrl);
    debugLog('Supabase Site URL (from client):', supabase.auth.getAutoRefreshToken()?.siteUrl);
    
    // Generate a unique state parameter to help debug OAuth flow
    const stateParam = `storia_${Date.now()}`;
    
    // Force the redirectTo URL to override Supabase's site URL setting
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl, // Use explicit absolute URL with protocol
        queryParams: {
          prompt: 'consent',
          state: stateParam, // Add unique state for tracking
          _t: Date.now() // Add cache-busting timestamp
        },
        skipBrowserRedirect: false
      }
    });
    
    if (error) {
      console.error('Error initiating Google sign-in:', error);
    } else {
      debugLog('OAuth sign-in initiated successfully');
      debugLog('Provider URL:', data?.url || 'No URL returned');
      // Store the state parameter in localStorage for verification on return
      if (typeof window !== 'undefined' && data?.url) {
        localStorage.setItem('storia_oauth_state', stateParam);
      }
    }
    
    console.groupEnd();
    return { data, error };
  } catch (err) {
    console.error('Exception during Google sign-in:', err);
    return { data: null, error: err };
  }
};

export const signOut = async () => {
  try {
    debugLog('Signing out user');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      debugLog('Sign-out error:', error.message);
    } else {
      debugLog('Sign-out successful');
    }
    
    return { error };
  } catch (err) {
    console.error('Exception during sign-out:', err);
    return { error: err };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      debugLog('Error getting current user:', error.message);
    } else {
      debugLog('Current user retrieved:', user?.id || 'No user');
    }
    
    return user;
  } catch (err) {
    console.error('Exception getting current user:', err);
    return null;
  }
};

// Get the current session
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      debugLog('Error getting session:', error.message);
    } else {
      debugLog('Session retrieved:', data?.session ? 'Valid' : 'No session');
    }
    
    return { data, error };
  } catch (err) {
    console.error('Exception getting session:', err);
    return { data: null, error: err };
  }
};

// Handle a URL with auth parameters
export const handleAuthRedirect = () => {
  if (window.location.hash && window.location.hash.includes('access_token')) {
    debugLog('Auth hash detected in URL, handling redirect');
    
    try {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const state = hashParams.get('state');
      const storedState = localStorage.getItem('storia_oauth_state');
      
      if (state && storedState && state === storedState) {
        debugLog('OAuth state verified successfully');
      } else if (state) {
        debugLog('OAuth state mismatch or missing stored state');
      }
      
      const { data, error } = supabase.auth.getSessionFromUrl();
      
      if (error) {
        console.error('Error handling auth redirect:', error);
      } else {
        debugLog('Successfully processed auth redirect');
      }
      
      // Clean up stored state
      localStorage.removeItem('storia_oauth_state');
      
      return { data, error };
    } catch (err) {
      console.error('Exception handling auth redirect:', err);
      return { data: null, error: err };
    }
  }
  
  return { data: null, error: null };
};

// User profile helper functions
export const updateUserProfile = async (userId, profileData) => {
  try {
    debugLog('Updating profile for user:', userId);
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ 
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString() 
      });
    
    if (error) {
      debugLog('Error updating user profile:', error.message);
    } else {
      debugLog('Profile updated successfully');
    }
    
    return { data, error };
  } catch (err) {
    console.error('Exception updating user profile:', err);
    return { data: null, error: err };
  }
};

export const getUserProfile = async (userId) => {
  try {
    debugLog('Getting profile for user:', userId);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      debugLog('Error getting user profile:', error.message);
    } else {
      debugLog('Profile retrieved successfully:', data ? 'exists' : 'does not exist');
    }
    
    return { data, error };
  } catch (err) {
    console.error('Exception getting user profile:', err);
    return { data: null, error: err };
  }
};

// Check if user has completed onboarding
export const hasCompletedOnboarding = async (userId) => {
  try {
    debugLog('Checking onboarding status for user:', userId);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('has_completed_onboarding')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      debugLog('Error checking onboarding status:', error.message);
      return false;
    }
    
    debugLog('Onboarding status:', data?.has_completed_onboarding ? 'completed' : 'not completed');
    return data?.has_completed_onboarding || false;
  } catch (err) {
    console.error('Exception checking onboarding status:', err);
    return false;
  }
}; 