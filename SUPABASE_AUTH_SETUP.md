# Supabase Authentication Setup for Storia App

This document outlines the exact configuration needed in your Supabase project to fix the "redirect to localhost" issue after Google authentication.

## 1. URL Configuration in Supabase

1. Log in to your Supabase Dashboard
2. Go to your project
3. Navigate to **Authentication** → **URL Configuration**
4. Configure these settings:

### Site URL
This is critical - must be set to your production URL:
```
https://joinstoria.vercel.app
```
(replace with your actual production URL)

### Redirect URLs
Add these URLs (adjust based on your actual domain):
```
https://joinstoria.vercel.app/**
http://localhost:3000/** (only for local development)
```

## 2. Google OAuth Provider Configuration

1. In Supabase, go to **Authentication** → **Providers**
2. Find the **Google** provider and make sure it's enabled
3. Ensure you have the correct **Client ID** and **Client Secret** from your Google Cloud Console
4. Verify that the **Authorized Client Domains** match your domains, both production and development

## 3. Google Cloud Console Configuration

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add these **Authorized JavaScript Origins**:
   ```
   https://joinstoria.vercel.app
   http://localhost:3000
   ```
4. Add these **Authorized Redirect URIs**:
   ```
   https://slvxbqfzfsdufulepitc.supabase.co/auth/v1/callback
   https://joinstoria.vercel.app
   https://joinstoria.vercel.app/
   http://localhost:3000
   http://localhost:3000/
   ```

## 4. Code Configuration

1. In your `src/lib/supabase.js` file, **DO NOT** specify a hardcoded redirect URL
2. Let Supabase handle the redirect based on its Site URL configuration:
   ```javascript
   // DON'T do this:
   options: {
     redirectTo: "https://some-hardcoded-url.com",
   }
   
   // DO this instead:
   options: {
     // Don't specify redirectTo
     queryParams: {
       prompt: 'consent'
     }
   }
   ```

## 5. Check Your Environment Variables

In your Vercel deployment or local .env file, make sure:
1. `REACT_APP_SUPABASE_URL` is set to `https://slvxbqfzfsdufulepitc.supabase.co`
2. `REACT_APP_SUPABASE_PUBLIC_KEY` is set correctly

## 6. Testing the Configuration

1. Clear browser cookies and local storage
2. Try signing in with Google again
3. You should be redirected back to your production URL, not localhost

## Troubleshooting

If you're still being redirected to localhost:

1. Check your Supabase Site URL again - this is the most common issue
2. Verify that your Supabase project's Auth settings are using the latest version
3. Check if you have any hardcoded redirects in your code
4. Try in an incognito/private browsing window
5. Check the browser console for any errors or redirect information 