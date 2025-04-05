# Google Authentication Troubleshooting

This document provides troubleshooting tips for Google authentication issues in the Storia application.

## Common Issues and Solutions

### 1. URL Hash Redirect Issue

**Problem:** After signing in with Google, the application redirects to a URL with a long hash fragment instead of properly processing it:
```
http://localhost:3000/#access_token=eyJhbGciOiJIUzI1NiIsImtpZCI6ImFJen...
```

**Solution:**
1. Ensure that the Supabase client is properly configured with `detectSessionInUrl` set to `true`:
   ```javascript
   createClient(supabaseUrl, supabaseKey, {
     auth: {
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: true,
       flowType: 'implicit'
     }
   });
   ```

2. Manually handle the hash redirect using the `HandleOAuthRedirect` component or similar logic:
   ```javascript
   if (window.location.hash) {
     const { data, error } = supabase.auth.getSessionFromUrl();
     // Process the result
   }
   ```

3. Clear the URL hash after processing it:
   ```javascript
   window.history.replaceState(null, '', window.location.pathname);
   ```

### 2. Google OAuth Redirect URI Configuration

**Problem:** Google authentication fails with an error like "redirect_uri_mismatch" or "invalid redirect URI".

**Solution:**
1. In your Google Cloud Console project:
   - Go to "Credentials" → "OAuth 2.0 Client IDs"
   - Ensure all possible redirect URIs are added:
     - `http://localhost:3000`
     - `http://localhost:3000/`
     - `https://your-vercel-domain.vercel.app`
     - `https://your-vercel-domain.vercel.app/`
     - The exact Supabase callback URL (e.g., `https://slvxbqfzfsdufulepitc.supabase.co/auth/v1/callback`)

2. In your Supabase project:
   - Go to Authentication → URL Configuration
   - Ensure all redirect URLs are properly set:
     - Site URL: `http://localhost:3000` (for local) or `https://your-vercel-domain.vercel.app` (for production)
     - Redirect URLs: Add both `http://localhost:3000/**` and `https://your-vercel-domain.vercel.app/**`

### 3. Session Not Getting Detected

**Problem:** After successful redirect, the application doesn't recognize that the user is authenticated.

**Solution:**
1. Add debugging tools to inspect the authentication flow:
   ```javascript
   // In debugAuth.js
   export const debugAuth = async () => {
     const { data } = await supabase.auth.getSession();
     console.log('Session data:', data);
     return data;
   };
   ```

2. Check browser console for errors related to CORS or other API issues.

3. Verify that cookies are being properly set and not blocked by browser settings.

4. Try using `getSessionFromUrl` directly after the redirect:
   ```javascript
   const { data, error } = await supabase.auth.getSessionFromUrl();
   if (data?.session) {
     // User is authenticated, handle accordingly
   }
   ```

### 4. Onboarding Not Triggering

**Problem:** After successful Google authentication, the onboarding popup doesn't appear for new users.

**Solution:**
1. Make sure the `checkOnboardingStatus` function in AuthContext.js is working correctly and is called after authentication:
   ```javascript
   if (event === 'SIGNED_IN' && session?.user) {
     setUser(session.user);
     await checkOnboardingStatus(session.user.id);
   }
   ```

2. Verify that the database trigger is creating a user profile record on signup:
   ```sql
   CREATE TRIGGER on_auth_user_created
       AFTER INSERT ON auth.users
       FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

3. Manually check the database to verify if the profile exists but `has_completed_onboarding` is set to true.

### 5. Development vs. Production Issues

**Problem:** Authentication works in development but not in production (or vice versa).

**Solution:**
1. Ensure environment variables are correctly set in both environments.

2. Use separate Google OAuth client IDs for development and production.

3. Add console logs for debugging in both environments.

4. Check network requests in the browser's developer tools to identify any failing API calls.

## Testing Authentication Flow

Run this sequence to test the Google authentication flow:

1. Clear browser cookies and local storage for your domain
2. Attempt to sign in with Google
3. Monitor the console logs for debugging information
4. Check if the URL hash is properly processed
5. Verify that the user is authenticated and session is established
6. For new users, confirm that the onboarding process triggers correctly

## Vercel-Specific Configuration

For Vercel deployments, ensure:

1. All environment variables are properly set in the Vercel project settings
2. Redirect URIs in Google OAuth and Supabase are updated to include the Vercel domain
3. The Vercel deployment has the correct build settings 