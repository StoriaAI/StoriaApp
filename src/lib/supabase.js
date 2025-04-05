import { createClient } from '@supabase/supabase-js';

// Use only environment variables without hardcoded fallbacks for security
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLIC_KEY;
const vercelUrl = process.env.REACT_APP_VERCEL_URL || process.env.VERCEL_URL;
const isProduction = process.env.NODE_ENV === 'production';

// Validate environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a Supabase client with autoRefreshToken and persistSession enabled
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    debug: true, // Enable debug mode to see auth-related logs
    localStorage: {
      // In some cases, using built-in localStorage helps with OAuth issues
      getItem: (key) => {
        console.log('Getting storage item:', key);
        return window.localStorage.getItem(key);
      },
      setItem: (key, value) => {
        console.log('Setting storage item:', key);
        window.localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        console.log('Removing storage item:', key);
        window.localStorage.removeItem(key);
      },
    }
  }
});

// Authentication helper functions
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signInWithGoogle = async () => {
  // Explicitly set the redirect URL based on environment
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const productionUrl = 'https://storia-app.vercel.app'; // Replace with your actual production URL
  
  // Determine appropriate redirect URL
  const redirectUrl = isLocalhost 
    ? window.location.origin 
    : productionUrl;
  
  try {
    console.group('Google Auth Redirect Information');
    console.log('Environment:', isProduction ? 'Production' : 'Development');
    console.log('Window Origin:', window.location.origin);
    console.log('Hostname:', window.location.hostname);
    console.log('Is Localhost:', isLocalhost);
    console.log('Redirect URL:', redirectUrl);
    
    // Force the redirectTo URL to override Supabase's site URL setting
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl, // Explicitly set the redirect URL
        queryParams: {
          prompt: 'consent',
          _t: Date.now()
        },
        skipBrowserRedirect: false
      }
    });
    
    if (error) {
      console.error('Error initiating Google sign-in:', error);
    }
    
    console.groupEnd();
    return { data, error };
  } catch (err) {
    console.error('Exception during Google sign-in:', err);
    return { data: null, error: err };
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Get the current session
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
};

// Handle a URL with auth parameters
export const handleAuthRedirect = () => {
  if (window.location.hash) {
    const { data, error } = supabase.auth.getSessionFromUrl();
    if (error) {
      console.error('Error handling auth redirect:', error);
    }
    return { data, error };
  }
  return { data: null, error: null };
};

// User profile helper functions
export const updateUserProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ 
      user_id: userId,
      ...profileData,
      updated_at: new Date().toISOString() 
    });
  return { data, error };
};

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
};

// Check if user has completed onboarding
export const hasCompletedOnboarding = async (userId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('has_completed_onboarding')
    .eq('user_id', userId)
    .single();
  
  if (error) return false;
  return data?.has_completed_onboarding || false;
}; 