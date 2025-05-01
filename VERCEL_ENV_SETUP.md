# Vercel Environment Variables Setup for Admin Login

This guide will help you set up the necessary environment variables in your Vercel project to make the admin login feature work properly.

## Required Environment Variables for Admin Login

Make sure the following environment variables are set in your Vercel project settings:

1. **REACT_APP_SUPABASE_URL**
   - This should be your Supabase project URL
   - Example: `https://slvxbqfzfsdufulepitc.supabase.co`

2. **SUPABASE_SERVICE_ROLE_KEY**
   - This is the service role key from your Supabase project
   - **IMPORTANT**: Make sure to use `SUPABASE_SERVICE_ROLE_KEY` (not `SUPABASE_SERVICE_ROLE`) as the variable name
   - This key should have permissions to access the `admin_users` table

3. **JWT_SECRET**
   - This is a secret key used to sign JWT tokens for admin authentication
   - Generate a strong random string for this value
   - Example: `your-secret-jwt-key-for-auth-tokens`

## How to Set Up Environment Variables in Vercel

1. Go to your Vercel dashboard and select your Storia project
2. Click on the "Settings" tab
3. Navigate to "Environment Variables" in the left sidebar
4. Add each of the required variables with their corresponding values
5. Make sure to select all environments (Production, Preview, Development) for each variable
6. Click "Save" to apply the changes

## Verify Admin Users Table in Supabase

Ensure that your Supabase database has an `admin_users` table with the following schema:

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

And make sure there's at least one admin user in the table with a bcrypt-hashed password.

## Creating an Admin User in Supabase

If you need to create a new admin user, you can run the following SQL in the Supabase SQL Editor:

```sql
-- Replace 'admin_username' and 'admin_password' with your desired values
-- Note: This is a placeholder. You need to hash the password with bcrypt
INSERT INTO admin_users (username, password) 
VALUES ('admin_username', 'bcrypt_hashed_password');
```

Since the password needs to be hashed with bcrypt, you may need to use a tool to generate the hash.

## Troubleshooting

If you're still having issues after setting up the environment variables:

1. **Check Vercel logs**: Go to your Vercel project dashboard, select the latest deployment, and view the Function Logs for any error messages related to the admin login.

2. **Verify API endpoint**: Make sure the API endpoint `/api/admin/login` is being correctly routed to `/api/admin-login.js` in your `vercel.json` file.

3. **Check Supabase connection**: Ensure your Supabase credentials are correct and that the admin_users table exists with the correct schema.

4. **Deploy again**: After making any changes to environment variables, you may need to redeploy your application for the changes to take effect.

## Note on Local Development

For local development, make sure to create a `.env` file in the root directory of your project with the same environment variables. The file should contain:

```
REACT_APP_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
```

This will allow you to test the admin login functionality locally before deploying to Vercel. 