# Google Authentication Configuration

This document provides detailed instructions for configuring Google Authentication in both development and production environments for Storia.

## Google Cloud Console Setup

1. **Create a Project in Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"

2. **Configure OAuth Consent Screen**
   - Click "OAuth consent screen" tab
   - Choose "External" (or "Internal" if you're a Google Workspace user)
   - Fill in the required app information
   - Add the scopes: `email`, `profile`
   - Add your test users if in testing mode

3. **Create OAuth Client ID**
   - Click "Credentials" tab > "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Give your client a name (e.g., "Storia Authentication")

4. **Add Authorized JavaScript Origins**
   - For development: `http://localhost:3000`
   - For production: `https://your-vercel-app.vercel.app`

5. **Add Authorized Redirect URIs**
   - For development:
     - `http://localhost:3000`
     - `http://localhost:3000/`
     - `http://localhost:3000/auth/callback`
     - The Supabase redirect URL (e.g., `https://your-project.supabase.co/auth/v1/callback`)
   
   - For production:
     - `https://your-vercel-app.vercel.app`
     - `https://your-vercel-app.vercel.app/`
     - `https://your-vercel-app.vercel.app/auth/callback`
     - The Supabase redirect URL (e.g., `https://your-project.supabase.co/auth/v1/callback`)

6. **Save and Get Credentials**
   - Click "Create"
   - Note your Client ID and Client Secret

## Supabase Configuration

1. **Enable Google Auth in Supabase**
   - Go to your Supabase project dashboard
   - Navigate to "Authentication" > "Providers"
   - Enable Google provider
   - Enter your Google Client ID and Client Secret

2. **Configure Redirect URLs in Supabase**
   - Go to "Authentication" > "URL Configuration"
   - Set Site URL:
     - For development: `http://localhost:3000`
     - For production: `https://joinstoria.vercel.app/**`
   
   - Add Redirect URLs:
     - For development: `http://localhost:3000/**`
     - For production: `https://joinstoria.vercel.app/**`

## Environment Variables Setup

1. **Local Development**
   In your `.env` file, set:
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_PUBLIC_KEY=your-anon-key
   ```

2. **Production Environment (Vercel)**
   In Vercel environment variables, set:
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_PUBLIC_KEY=your-anon-key
   REACT_APP_VERCEL_URL=https://your-vercel-app.vercel.app
   VERCEL_URL=your-vercel-app.vercel.app
   ```

## Common Issues and Troubleshooting

1. **Localhost Redirect After Production Login**
   - Ensure `REACT_APP_VERCEL_URL` is set correctly in your production environment
   - Make sure the `redirectTo` URL in the Google auth call is using the correct domain
   - Check that both Supabase and Google Console have the correct redirect URLs

2. **"Error: redirect_uri_mismatch"**
   - This means the redirect URI provided during the authentication request doesn't match any in your Google Console
   - Double-check all redirect URIs are correctly configured in Google Console
   - Make sure the exact URL (including trailing slashes or absence thereof) matches

3. **"Origin Not Allowed"**
   - Verify that the domain trying to make the request is listed in "Authorized JavaScript origins"
   - Note that `http://localhost:3000` and `http://localhost:3000/` are considered different origins by Google

4. **Testing Changes**
   - Clear browser cookies and local storage before testing
   - Use incognito/private browsing window for testing
   - Check browser console for CORS or other errors

## Code Configuration

Ensure your auth code is using the correct redirect URL based on environment:

```javascript
const signInWithGoogle = async () => {
  // Determine correct redirect URL based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  const vercelUrl = process.env.REACT_APP_VERCEL_URL;
  
  // Use Vercel URL in production, localhost in development
  let redirectUrl = window.location.origin;
  if (isProduction && vercelUrl) {
    redirectUrl = vercelUrl;
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    }
  });
  
  return { data, error };
}; 