# Fixing "Error 400: redirect_uri_mismatch" in Google Authentication

This document provides step-by-step instructions to fix the "redirect_uri_mismatch" error that occurs during Google authentication.

## What Causes This Error?

The `redirect_uri_mismatch` error occurs when the redirect URL provided during authentication doesn't match any of the authorized redirect URIs configured in your Google Cloud Console. This is a security measure to prevent malicious redirects.

## Steps to Fix the Error

### 1. Determine the Exact Redirect URL Being Used

Check the browser console to see what redirect URL is being used:

1. Open your browser's developer tools (F12 or Right-click → Inspect)
2. Go to the Console tab
3. Look for logs like "Using hardcoded production redirect URL: https://your-app.vercel.app"

### 2. Update Google Cloud Console Configuration

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" → "Credentials"
4. Find and edit your OAuth 2.0 Client ID

### 3. Add All Necessary Redirect URIs

Add **ALL** of these redirect URIs (adjust the domain to match your actual production URL):

```
https://storia-app.vercel.app
https://storia-app.vercel.app/
https://storia-app.vercel.app/login
https://storia-app.vercel.app/signup
https://slvxbqfzfsdufulepitc.supabase.co/auth/v1/callback
```

**IMPORTANT NOTES:**
- Include both versions with and without trailing slashes
- Include the exact Supabase callback URL (get this from your Supabase dashboard)
- Make sure the URLs match exactly (case sensitive, including http vs https)

### 4. Update Your Hardcoded Redirect URL

Ensure the hardcoded redirect URL in your code exactly matches one of the URIs you added to Google Cloud Console:

```javascript
// In src/lib/supabase.js
const hardcodedProductionUrl = "https://storia-app.vercel.app"; // Must match Google console
```

### 5. Update Supabase Configuration

1. Go to your Supabase dashboard
2. Navigate to Authentication → URL Configuration
3. Set Site URL to your production URL (e.g., `https://storia-app.vercel.app`)
4. Add Redirect URLs that include both your production URL and localhost:
   ```
   https://storia-app.vercel.app/**
   http://localhost:3000/**
   ```

### 6. Clear Browser Data and Try Again

1. Clear browser cookies and local storage for your domain
2. Try signing in with Google again

## Additional Troubleshooting

If you still encounter issues:

1. **Check for HTTP vs HTTPS mismatches**: Make sure you're using HTTPS for production URLs.
2. **Verify port numbers**: If using a non-standard port in development, include it in your authorized redirect URIs.
3. **Check for subdomain issues**: `www.yourdomain.com` and `yourdomain.com` are treated as different domains.
4. **Restart your development server**: Changes to environment variables require a server restart.
5. **Test in an incognito/private browsing window**: This eliminates cached credentials issues.

## Common Mistakes

- Not including both versions (with/without trailing slash)
- Using different protocols (http vs https)
- Not including the exact Supabase callback URL
- Typos in the URL (Google's validation is exact-match)
- Having redirects to localhost in production environment 