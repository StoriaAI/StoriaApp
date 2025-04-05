# Forced Redirect Fix for Google Authentication

This document explains the approach we've taken to fix persistent localhost redirect issues with Google authentication.

## The Problem

Even after correctly configuring Supabase's Site URL and Google Cloud Console redirect URIs, the app was still redirecting to localhost after successful Google authentication in production.

## Our Solution

We've implemented a three-part solution:

### 1. Explicit redirect URL in signInWithGoogle function

In `src/lib/supabase.js`, we now explicitly specify the redirect URL based on the environment:

```javascript
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const productionUrl = 'https://storia-app.vercel.app'; // Your production URL

const redirectUrl = isLocalhost ? window.location.origin : productionUrl;

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: redirectUrl, // Explicitly set the redirect URL
    queryParams: {
      prompt: 'consent',
      _t: Date.now()
    }
  }
});
```

### 2. Redirect Checker Utility

We've created a new utility at `src/util/redirectChecker.js` that:

- Logs detailed information about the current URL and environment
- Detects if there's a redirect issue (being on localhost in production)
- Provides helper functions to debug authentication issues

### 3. Forced Redirection in Login/SignUp Components

In both the Login and SignUp components, we've added code that:

1. Detects if we're on localhost in a production environment
2. Forces a redirect to the production URL if needed

```javascript
// Check for redirect issues (like being on localhost in production)
const { hasIssue } = detectRedirectIssue();
if (hasIssue) {
  // If we're in production but on localhost, redirect to production URL
  const productionUrl = 'https://storia-app.vercel.app';
  window.location.href = productionUrl;
  return;
}
```

## Requirements for This Fix

For this solution to work, you must:

1. **Replace the production URL** in all files with your actual production URL:
   - `src/lib/supabase.js`
   - `src/pages/Auth/Login.js`
   - `src/pages/Auth/SignUp.js`

2. **Still maintain the proper configurations** in:
   - Google Cloud Console (with the correct redirect URIs)
   - Supabase Authentication settings (with the correct Site URL)

3. **Deploy the changes** to your production environment

## How It Works

1. During Google authentication, we explicitly tell Supabase where to redirect after authentication
2. If a user somehow ends up on localhost in production, we detect this and force a redirect
3. Debug information is logged to help diagnose any remaining issues

## Testing the Solution

1. Clear browser cookies and local storage
2. Open your production site
3. Try signing in with Google
4. You should be redirected to your production URL, not localhost

## Troubleshooting

If you're still experiencing issues:

1. Check the browser console for debug logs from our redirect checker
2. Verify you've replaced all instances of the placeholder production URL
3. Try using an incognito/private window to avoid cached credentials 