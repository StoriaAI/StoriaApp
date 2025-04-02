# Setting up Authentication with Supabase

This document explains how to set up the authentication system for Storia using Supabase.

## Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project in Supabase
3. Note down your Supabase URL and public anon key (found in Project Settings > API)

## Environment Variables

Add the following environment variables to your `.env` file in the root directory:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_PUBLIC_KEY=your_supabase_anon_key
```

## Database Setup

Execute the SQL script located in `supabase/migrations/20240402_user_profiles.sql` in your Supabase SQL editor to:

1. Create the `user_profiles` table for storing user information
2. Set up appropriate RLS (Row Level Security) policies
3. Create a storage bucket for profile photos
4. Set up triggers for automatic profile creation on signup

## Authentication Settings in Supabase

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Settings
3. Configure the following settings:

### Email Authentication

- Enable Email Auth in the "Email" section
- Enable "Confirm email" if you want email verification
- Customize email templates if needed

### Additional Providers (Optional)

You can enable additional authentication providers like Google, Facebook, etc. in their respective sections.

### URLs and Redirects

Set your site URLs:
- Site URL: `http://localhost:3000` (for development)
- Redirect URLs: `http://localhost:3000/**` (for development)

Update these URLs for production when deploying.

## Testing the Authentication

1. Start your application: `npm start`
2. Navigate to the login page
3. Try signing up with a new account
4. After signing up, the onboarding wizard should appear
5. Complete the onboarding process to test the full flow

## Troubleshooting

- If you encounter CORS issues, ensure your site URL is correctly set in Supabase Authentication settings
- Check browser console for error messages
- Verify environment variables are correctly set
- If user profiles are not being created automatically, check the SQL migration and ensure the trigger is properly set up

## Additional Resources

- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [React Router Documentation](https://reactrouter.com/docs/en/v6) 