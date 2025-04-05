# Environment Variables Setup for Storia App

This document explains how to set up environment variables for the Storia application.

## Single .env File Policy

Storia follows a strict policy of using **only one `.env` file** located in the root directory of the project. This approach offers several advantages:

1. **Simplified configuration management** - All environment variables are in one place
2. **Reduced security risks** - No scattered API keys across the codebase
3. **Easier deployment** - Clear mapping to deployment platforms like Vercel

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# API Keys
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# API Endpoints
ELEVENLABS_API_ENDPOINT=https://api.elevenlabs.io/v1/sound-generation
OPENAI_API_ENDPOINT=https://api.openai.com/v1/chat/completions

# Project Gutenberg API
GUTENBERG_API_ENDPOINT=https://gutendex.com/

# Server Configuration
PORT=3001
NODE_ENV=development 

# OpenAI System Prompt
OPENAI_SYSTEM_PROMPT="You are an expert at analyzing text and extracting emotional mood and setting details..."

# Supabase Configuration - Important for authentication
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_PUBLIC_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret

# Vercel specific settings
VERCEL_URL=your-vercel-app.vercel.app
REACT_APP_VERCEL_URL=https://your-vercel-app.vercel.app
VERCEL_ENV=production
```

## Important Note for Google Authentication

For Google authentication to work correctly in production:

1. Make sure `REACT_APP_VERCEL_URL` is set to your full Vercel URL including `https://`
2. This ensures OAuth redirects point to your production URL and not localhost
3. In your Google Cloud Console OAuth settings, add both your local development URL and your Vercel production URL as authorized redirect URIs

## Environment Variables Usage

### Frontend (React)

React can only access environment variables prefixed with `REACT_APP_`:

```javascript
// Correct usage in frontend code
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLIC_KEY;
const vercelUrl = process.env.REACT_APP_VERCEL_URL; // For OAuth redirects
```

### Backend (Node.js)

The backend can access all environment variables:

```javascript
// Correct usage in backend code
const openaiApiKey = process.env.OPENAI_API_KEY;
const port = process.env.PORT || 3001;
```

## Local Development

For local development, simply copy the `.env.example` file to create your `.env` file:

```bash
cp .env.example .env
```

Then edit the `.env` file with your actual API keys and configuration values.

## Deployment

When deploying to Vercel or other platforms, configure the environment variables in the platform's dashboard using the exact same names as in your local `.env` file.

## Security Best Practices

1. **Never commit the `.env` file to version control**
   - Ensure `.env` is listed in your `.gitignore` file

2. **Keep sensitive keys secure**
   - Only share API keys through secure channels
   - Rotate keys periodically for enhanced security

3. **Use different values for development and production**
   - Create separate API keys for different environments when possible
   - Use environment-specific endpoints when needed

4. **Access control**
   - Use the public (anon) key for Supabase in frontend code
   - Only use the service role key in secured backend contexts 