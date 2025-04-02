import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://slvxbqfzfsdufulepitc.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLIC_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdnhicWZ6ZnNkdWZ1bGVwaXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1NjAyNzAsImV4cCI6MjA1OTEzNjI3MH0.EdaCtu1JMUu60JkHRzuPb3b8X4O4JRfUCEdaXSYjpFs';

export const supabase = createClient(supabaseUrl, supabaseKey);

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

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
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