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
    flowType: 'implicit'
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
  // Determine the correct redirect URL based on environment
  let redirectUrl = window.location.origin;
  
  // In production, if we have a Vercel URL, use it instead of window.location.origin
  // This ensures we don't redirect to localhost in production
  if (isProduction && vercelUrl) {
    redirectUrl = vercelUrl.startsWith('http') 
      ? vercelUrl 
      : `https://${vercelUrl}`;
    console.log('Using Vercel URL for redirect:', redirectUrl);
  } else {
    console.log('Using origin for redirect:', redirectUrl);
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: false, // Ensure browser redirect happens
    }
  });
  return { data, error };
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