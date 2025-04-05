/**
 * Utility to log information about redirects and authentication
 */

/**
 * Get the current auth status and redirect-related information
 * Call this in your Login or SignUp component to debug
 */
export const logRedirectInfo = () => {
  const redirectInfo = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    hostname: window.location.hostname,
    origin: window.location.origin,
    hash: window.location.hash,
    search: window.location.search,
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    environment: process.env.NODE_ENV,
    reactAppSupabaseUrl: process.env.REACT_APP_SUPABASE_URL,
    reactAppVercelUrl: process.env.REACT_APP_VERCEL_URL,
    vercelUrl: process.env.VERCEL_URL,
    productionEnv: process.env.NODE_ENV === 'production',
    localStorage: {
      supabaseSession: Boolean(localStorage.getItem('supabase.auth.token')),
      hasAuthData: Object.keys(localStorage).some(key => key.startsWith('supabase')),
    },
  };

  console.group('🔍 Auth Redirect Debug Info');
  console.log('Current URL:', redirectInfo.url);
  console.log('Is localhost:', redirectInfo.isLocalhost);
  console.log('Environment:', redirectInfo.environment);
  console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
  console.log('Has active session in localStorage:', redirectInfo.localStorage.supabaseSession);
  console.log('Full debug info:', redirectInfo);
  console.groupEnd();

  return redirectInfo;
};

/**
 * Detect and log if there was a redirect issue
 * If URL contains localhost in production, this is a redirect error
 */
export const detectRedirectIssue = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const currentUrl = window.location.href;
  const hostnameIsLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // In production, being on localhost indicates a redirect issue
  if (isProduction && hostnameIsLocalhost) {
    console.error('🚨 REDIRECT ISSUE DETECTED: We are in production but redirected to localhost!');
    return {
      hasIssue: true,
      issue: 'Production app redirected to localhost',
      url: currentUrl
    };
  }
  
  // No issue detected
  return { hasIssue: false };
}; 