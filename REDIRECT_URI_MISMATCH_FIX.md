# Fixing Google OAuth Redirect URI Mismatch Errors

This document provides step-by-step instructions to fix the common `redirect_uri_mismatch` error that occurs with Google OAuth authentication in the Storia application.

## Understanding the Problem

The `redirect_uri_mismatch` error occurs when:

1. The redirect URI that your application sends to Google during the OAuth process
2. Does not match any of the authorized redirect URIs you've configured in the Google Cloud Console

This is a security feature by Google to prevent OAuth phishing attacks.

## Solution Steps

### 1. Check the Production URL in the codebase

The application has a hardcoded production URL in `src/lib/supabase.js`:

```javascript
export const PRODUCTION_URL = 'https://joinstoria.vercel.app';
```

This URL **must match exactly** where your application is deployed.

### 2. Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your project → APIs & Services → Credentials
3. Find and edit your OAuth 2.0 Client ID
4. Under "Authorized redirect URIs", add the following URIs:

   **For Production:**
   ```
   https://joinstoria.vercel.app
   https://joinstoria.vercel.app/auth/callback
   https://joinstoria.vercel.app/auth/v2/callback
   ```

   **For Local Development:**
   ```
   http://localhost:3000
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/v2/callback
   ```

5. Save your changes

### 3. Verify Environment Variables

Make sure your `.env` file (locally) and Vercel environment variables (in production) have the correct Supabase settings:

```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_PUBLIC_KEY=your-supabase-anon-key
```

### 4. Configure Supabase Authentication Settings

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to your project → Authentication → URL Configuration
3. Set the Site URL to: `https://joinstoria.vercel.app` (for production)
4. Under "Redirect URLs", add:
   ```
   https://joinstoria.vercel.app
   https://joinstoria.vercel.app/auth/callback
   https://joinstoria.vercel.app/auth/v2/callback
   http://localhost:3000
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/v2/callback
   ```
5. Save your changes

### 5. Clear Browser Data (If Needed)

If you're still experiencing issues after making these changes:

1. Clear your browser cookies and localStorage
2. Try signing in with Google in an incognito/private window
3. Check browser console for any specific error messages

## Troubleshooting

If you're still experiencing issues:

1. **Check Network Requests**: When initiating Google sign-in, check the Network tab in your browser's Developer Tools. Look for the redirect URL being sent to Google.

2. **Verify Google Project Configuration**: Make sure your Google Cloud Project has the Google+ API enabled.

3. **Check for URL Typos**: Ensure there are no typos or trailing slashes in your URIs - they must match exactly.

4. **Verify Supabase Client Configuration**: Check that the `signInWithGoogle` function in `src/lib/supabase.js` is using the correct redirect URL.

If you continue to experience issues, please check the [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth) or open an issue in the Storia repository. 