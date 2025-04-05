/**
 * Debug OAuth Redirects
 * This utility helps diagnose problems with OAuth redirects, especially Google Auth.
 */

import { supabase } from '../lib/supabase';

/**
 * Logs detailed information about the environment and redirect URLs
 */
export const debugOAuthRedirects = () => {
  // Get environment variables related to redirect URLs
  const vercelUrl = process.env.REACT_APP_VERCEL_URL || process.env.VERCEL_URL;
  const isProduction = process.env.NODE_ENV === 'production';
  const windowOrigin = window.location.origin;
  
  // Log information for debugging
  console.group('OAuth Redirect Debug Info');
  console.log('Environment:', isProduction ? 'Production' : 'Development');
  console.log('Current URL:', window.location.href);
  console.log('Window Origin:', windowOrigin);
  console.log('VERCEL_URL:', process.env.VERCEL_URL);
  console.log('REACT_APP_VERCEL_URL:', process.env.REACT_APP_VERCEL_URL);
  
  // Determine what redirect URL would be used
  let determinedRedirectUrl = windowOrigin;
  if (isProduction && vercelUrl) {
    determinedRedirectUrl = vercelUrl.startsWith('http') 
      ? vercelUrl 
      : `https://${vercelUrl}`;
  }
  
  console.log('Determined Redirect URL:', determinedRedirectUrl);
  console.log('URL has hash?', !!window.location.hash);
  console.log('URL hash:', window.location.hash);
  console.log('URL has search params?', !!window.location.search);
  console.log('URL search params:', window.location.search);
  console.groupEnd();
  
  return {
    environment: isProduction ? 'production' : 'development',
    windowOrigin,
    vercelUrl,
    determinedRedirectUrl,
    hasHash: !!window.location.hash,
    hash: window.location.hash,
    hasSearchParams: !!window.location.search,
    searchParams: window.location.search
  };
};

/**
 * Fix common OAuth redirect issues
 */
export const fixOAuthRedirectIssues = async () => {
  // Check if we have a hash that might be from an OAuth redirect
  if (window.location.hash && window.location.hash.includes('access_token')) {
    try {
      console.log('Attempting to extract session from URL hash...');
      const { data, error } = await supabase.auth.getSessionFromUrl();
      
      if (error) {
        console.error('Error extracting session from URL:', error);
        return { success: false, error };
      }
      
      if (data?.session) {
        console.log('Successfully extracted session from URL hash');
        
        // Clear the hash without causing a page reload
        window.history.replaceState(null, document.title, window.location.pathname);
        
        return { success: true, session: data.session };
      }
      
      return { success: false, error: 'No session found in URL hash' };
    } catch (err) {
      console.error('Exception processing OAuth URL hash:', err);
      return { success: false, error: err };
    }
  }
  
  return { success: false, error: 'No OAuth hash detected in URL' };
};

export default {
  debugOAuthRedirects,
  fixOAuthRedirectIssues
}; 