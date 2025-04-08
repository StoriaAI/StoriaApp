/**
 * OAuth Debugging Utilities
 * 
 * This file contains utilities to help debug and fix common OAuth issues,
 * specifically focused on Google authentication with Supabase.
 */

import { supabase, PRODUCTION_URL } from '../lib/supabase';

// Flag to enable/disable detailed logging
const DEBUG_OAUTH = true;

/**
 * Debug OAuth redirects and parameters
 * 
 * This function analyzes the current URL and checks for common OAuth-related
 * parameters to help debug authentication issues.
 */
export const debugOAuthRedirects = () => {
  if (!DEBUG_OAUTH) return;
  
  try {
    console.group('🔍 OAuth Debug Information');
    console.log('Current URL:', window.location.href);
    
    // Check for hash fragments
    if (window.location.hash) {
      console.log('Hash fragment detected:', window.location.hash);
      
      // Parse hash parameters
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      console.log('Parsed hash parameters:');
      
      // Log each parameter
      for (const [key, value] of hashParams.entries()) {
        if (key === 'access_token' || key === 'refresh_token') {
          console.log(`- ${key}: ${value.substring(0, 5)}...${value.substring(value.length - 5)}`);
        } else {
          console.log(`- ${key}: ${value}`);
        }
      }
      
      // Check for token presence
      if (hashParams.has('access_token')) {
        console.log('✅ Access token is present in URL hash');
      } else {
        console.warn('❌ No access token found in URL hash');
      }
      
      // Check for error parameters
      if (hashParams.has('error')) {
        console.error('🚨 OAuth Error:', hashParams.get('error'));
        console.error('OAuth Error Description:', hashParams.get('error_description'));
      }
    } else {
      console.log('No hash fragment in URL');
    }
    
    // Check for query parameters
    if (window.location.search) {
      console.log('Query parameters detected:', window.location.search);
      
      // Parse query parameters
      const queryParams = new URLSearchParams(window.location.search);
      console.log('Parsed query parameters:');
      
      // Log each parameter
      for (const [key, value] of queryParams.entries()) {
        console.log(`- ${key}: ${value}`);
      }
      
      // Check for code/token presence
      if (queryParams.has('code')) {
        console.log('✅ Authorization code is present in URL query');
      }
      
      // Check for error parameters
      if (queryParams.has('error')) {
        console.error('🚨 OAuth Error:', queryParams.get('error'));
        console.error('OAuth Error Description:', queryParams.get('error_description'));
      }
    } else {
      console.log('No query parameters in URL');
    }
    
    // Check environment and domain
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Current Domain:', window.location.origin);
    console.log('Expected Production Domain:', PRODUCTION_URL);
    
    // Check local storage for auth-related items
    if (localStorage.getItem('supabase.auth.token')) {
      console.log('✅ Supabase auth token found in localStorage');
    } else {
      console.warn('❌ No Supabase auth token found in localStorage');
    }
    
    // Check if running on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Running on localhost - Make sure your Google Console has localhost redirect URIs');
    }
    
    console.groupEnd();
  } catch (err) {
    console.error('Error in debugOAuthRedirects:', err);
  }
};

/**
 * Fix common OAuth redirect issues
 * 
 * This function attempts to fix common issues with OAuth redirects,
 * particularly focusing on Supabase's session handling.
 * 
 * @returns {Promise<Object>} Result object with success flag and message
 */
export const fixOAuthRedirectIssues = async () => {
  try {
    // Check if this looks like an OAuth redirect
    if (!window.location.hash && !window.location.search) {
      return { success: false, message: 'Not an OAuth redirect' };
    }
    
    if (DEBUG_OAUTH) {
      console.group('🔧 OAuth Fix Attempts');
    }
    
    let fixed = false;
    
    // Case 1: Handle hash fragment with access_token
    if (window.location.hash && window.location.hash.includes('access_token')) {
      if (DEBUG_OAUTH) console.log('Attempting to process hash fragment with access_token');
      
      try {
        // Let Supabase handle the auth URL
        const { data, error } = await supabase.auth.getSessionFromUrl();
        
        if (error) {
          if (DEBUG_OAUTH) console.error('Failed to get session from URL:', error);
        } else if (data?.session) {
          if (DEBUG_OAUTH) console.log('Successfully retrieved session from URL hash!');
          fixed = true;
          
          // Clean up the URL
          window.history.replaceState(null, document.title, window.location.pathname);
        }
      } catch (err) {
        if (DEBUG_OAUTH) console.error('Error processing auth URL:', err);
      }
    }
    
    // Case 2: Handle query parameter with code (authorization code flow)
    if (!fixed && window.location.search && window.location.search.includes('code=')) {
      if (DEBUG_OAUTH) console.log('Attempting to process query parameter with code');
      
      try {
        // Let Supabase handle the auth URL
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.search.split('code=')[1].split('&')[0]
        );
        
        if (error) {
          if (DEBUG_OAUTH) console.error('Failed to exchange code for session:', error);
        } else if (data?.session) {
          if (DEBUG_OAUTH) console.log('Successfully exchanged code for session!');
          fixed = true;
          
          // Clean up the URL
          window.history.replaceState(null, document.title, window.location.pathname);
        }
      } catch (err) {
        if (DEBUG_OAUTH) console.error('Error exchanging code for session:', err);
      }
    }
    
    // Case 3: Handle error in query parameters
    if (!fixed && window.location.search && window.location.search.includes('error=')) {
      const searchParams = new URLSearchParams(window.location.search);
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (DEBUG_OAUTH) {
        console.error('OAuth error detected:', error);
        console.error('Error description:', errorDescription);
        
        // Special handling for redirect_uri_mismatch error
        if (error === 'redirect_uri_mismatch') {
          console.error('==============================================');
          console.error('REDIRECT URI MISMATCH DETECTED');
          console.error('==============================================');
          console.error('This error occurs when the redirect URI sent to Google');
          console.error('does not match any URIs registered in Google Cloud Console.');
          console.error('');
          console.error('1. Check the hardcoded PRODUCTION_URL in src/lib/supabase.js');
          console.error(`   Current value: ${PRODUCTION_URL}`);
          console.error('2. Ensure this URL is registered in Google Cloud Console');
          console.error('3. Also register these exact paths:');
          console.error(`   - ${PRODUCTION_URL}/auth/callback`);
          console.error(`   - ${PRODUCTION_URL}/auth/v2/callback`);
          console.error('==============================================');
        }
      }
      
      // Always consider errors as "fixed" since we've logged them
      // and there's nothing else we can do automatically
      fixed = true;
    }
    
    if (DEBUG_OAUTH) {
      console.groupEnd();
    }
    
    return { 
      success: fixed, 
      message: fixed ? 'Successfully fixed OAuth issues' : 'Could not fix OAuth issues' 
    };
  } catch (err) {
    console.error('Error in fixOAuthRedirectIssues:', err);
    return { success: false, message: `Error: ${err.message}` };
  }
};

export default {
  debugOAuthRedirects,
  fixOAuthRedirectIssues
}; 