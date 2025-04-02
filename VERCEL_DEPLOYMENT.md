# Vercel Deployment Guide for Storia

This guide will help you deploy the Storia application to Vercel, ensuring proper environment configuration for Supabase authentication.

## Prerequisites

1. A Vercel account (you can sign up at [vercel.com](https://vercel.com))
2. A Supabase project that is properly configured with:
   - Email/password authentication enabled
   - Google authentication provider set up
   - All required database tables and security rules
3. Your Git repository pushed to GitHub, GitLab, or Bitbucket

## Deployment Steps

### 1. Create Environment Variables in Vercel

Before deploying, you need to set up the following environment variables in your Vercel project:

**Frontend Variables (accessible to client):**
- `REACT_APP_SUPABASE_URL`: Your Supabase project URL
- `REACT_APP_SUPABASE_PUBLIC_KEY`: Your Supabase project anon/public key

**Backend Variables (server-side only):**
- `OPENAI_API_KEY`: Your OpenAI API key
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key
- `ELEVENLABS_API_ENDPOINT`: ElevenLabs API endpoint
- `OPENAI_API_ENDPOINT`: OpenAI API endpoint
- `OPENAI_SYSTEM_PROMPT`: Custom system prompt for OpenAI
- `SUPABASE_SERVICE_ROLE`: Your Supabase service role key
- `JWT_SECRET`: Secret for JWT token verification

**General Configuration:**
- `PORT`: Server port
- `NODE_ENV`: Environment (development, production)
- `VERCEL_URL`: Your Vercel deployment URL
- `VERCEL_ENV`: Vercel environment

In Vercel:
1. Go to your project settings
2. Navigate to the "Environment Variables" tab
3. Add each variable and its value
4. Make sure to set the variables for all deployment environments (Production, Preview, and Development)
5. **Important**: Ensure that backend-only variables are NOT exposed to the browser

### 2. Environment Variable Security

Follow these security practices for handling environment variables:

1. **Single Source of Truth**: All environment variables should be defined in the Vercel dashboard to match the single `.env` file approach used in development
2. **No Hardcoded Fallbacks**: Never include API keys or secrets in your code, even as fallbacks
3. **Environment-Specific Values**: Use different API keys for production and development environments
4. **Encryption**: Vercel encrypts environment variables by default, but be cautious about logging them

Refer to the [ENV_SECURITY_CHECKLIST.md](ENV_SECURITY_CHECKLIST.md) for a complete security checklist.

### 2. Deploy to Vercel

There are two ways to deploy:

#### Option 1: One-click deployment (Recommended for first-time setup)

1. Click the "New Project" button in your Vercel dashboard
2. Import your Git repository
3. In the project configuration screen:
   - Select "Create React App" as the framework preset
   - Verify that build settings are correct (usually automatically configured)
   - Add your environment variables if not done already
4. Click "Deploy"

#### Option 2: Using Vercel CLI

If you prefer deploying from the command line:

1. Install Vercel CLI: `npm install -g vercel`
2. Navigate to your project directory
3. Run `vercel` and follow the prompts
4. For subsequent deployments, just run `vercel --prod`

### 3. Configure Supabase Auth Redirects

After deployment, you need to update your Supabase redirect URLs to include your Vercel domain:

1. In your Supabase dashboard, go to Authentication > URL Configuration
2. Add your Vercel domain to the Site URL and Redirect URLs:
   - Site URL: `https://your-vercel-domain.vercel.app`
   - Redirect URLs: `https://your-vercel-domain.vercel.app/**`
3. Save your changes

### 4. Verify Google Authentication

For Google authentication to work correctly:

1. Make sure your Vercel production URL is added to the authorized redirect URIs in your Google OAuth credentials
2. Test the Google login flow after deployment to ensure it redirects correctly

### 5. Post-Deployment Verification

After deploying, test the following:

1. Sign up with email/password
2. Sign in with email/password
3. Sign in with Google
4. Verify that onboarding appears for new users
5. Confirm that the books page is protected and only accessible after login
6. Verify that user profiles are being created correctly in Supabase

## Troubleshooting

### Authentication Issues

- **Redirect Errors**: Ensure that your Supabase redirect URLs are correctly configured
- **CORS Errors**: Check browser console and verify your site URL is set correctly in Supabase
- **Google Auth Not Working**: Verify that your Google OAuth configuration includes the correct redirect URIs

### Environment Variable Issues

- **Missing Variables**: Check that all required variables are set in Vercel dashboard
- **Client-Side Access**: Verify frontend code only uses `REACT_APP_` prefixed variables
- **Server Functions**: Ensure server functions have access to required API keys

### Build Failures

- **Environment Variables**: Ensure all required environment variables are set in Vercel
- **Build Errors**: Check build logs in Vercel for specific errors
- **Deployment Preview**: Use Vercel's preview deployments to test changes before promoting to production

## Automatic Deployments

Once your project is set up on Vercel, any changes pushed to your main branch will automatically trigger a new deployment. You can configure branch deployments in the Vercel project settings.

## Rollback

If necessary, you can easily roll back to a previous deployment through the Vercel dashboard:

1. Go to your project in the Vercel dashboard
2. Navigate to the "Deployments" tab
3. Find the deployment you want to roll back to
4. Click the three dots menu and select "Promote to Production" 