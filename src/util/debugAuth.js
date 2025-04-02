import { supabase } from '../lib/supabase';

// A small utility to help debug Supabase authentication issues
export const debugAuth = async () => {
  try {
    // Get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.group('Auth Debug Info');
    
    console.log('URL:', window.location.href);
    console.log('Has hash:', !!window.location.hash);
    console.log('Has search params:', !!window.location.search);
    
    if (sessionError) {
      console.error('Session Error:', sessionError);
    } else {
      console.log('Has active session:', !!sessionData?.session);
      if (sessionData?.session) {
        console.log('User ID:', sessionData.session.user.id);
        console.log('Auth Provider:', sessionData.session.user.app_metadata.provider);
        console.log('Email:', sessionData.session.user.email);
      }
    }
    
    // Check if there's a hash to parse
    if (window.location.hash) {
      try {
        console.log('Attempting to parse hash...');
        const { data, error } = await supabase.auth.getSessionFromUrl();
        if (error) {
          console.error('Hash parse error:', error);
        } else {
          console.log('Successfully parsed hash:', !!data);
        }
      } catch (err) {
        console.error('Exception parsing hash:', err);
      }
    }
    
    console.groupEnd();
    return sessionData;
  } catch (err) {
    console.error('Debug auth error:', err);
    return null;
  }
};

// A utility to manually handle hash-based redirects
export const handleHashRedirect = async () => {
  if (!window.location.hash) return null;
  
  try {
    const { data, error } = await supabase.auth.getSessionFromUrl();
    
    if (error) {
      console.error('Error processing hash redirect:', error);
      return { error };
    }
    
    // Clean up the URL
    window.history.replaceState(null, '', window.location.pathname);
    
    return { data };
  } catch (err) {
    console.error('Exception in hash redirect handling:', err);
    return { error: err };
  }
};

export default debugAuth; 