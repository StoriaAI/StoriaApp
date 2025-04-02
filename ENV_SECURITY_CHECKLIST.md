# Environment Variables Security Checklist

This document provides a checklist for ensuring environment variables and API keys are handled securely in the Storia application.

## Security Checklist

### Source Code Security

- [ ] **No hardcoded API keys in source code**
  - All API keys should be accessed only through environment variables
  - No default/fallback API keys should exist in the codebase

- [ ] **Gitignored .env file**
  - Ensure `.env` is in the `.gitignore` file
  - Regularly audit the repository to ensure no `.env` files have been accidentally committed

- [ ] **Use .env.example template**
  - Provide a clear example file showing required variables without real values
  - Include comments explaining each variable's purpose

### Application Security

- [ ] **Validate environment variables on startup**
  - Check that all required variables are present when the application starts
  - Log appropriate error messages without exposing variable contents

- [ ] **Use appropriate scopes and permissions**
  - Supabase: Use anon key for frontend, service role key only for backend
  - Follow principle of least privilege for all API keys

- [ ] **Client-side security**
  - Only expose variables prefixed with `REACT_APP_` to the frontend
  - Never expose sensitive backend keys to the client

### Deployment Security

- [ ] **Separate development and production keys**
  - Use different API keys for each environment
  - Never use production keys in development

- [ ] **Secure deployment platform configuration**
  - Use Vercel's environment variable encryption
  - Ensure variables are not exposed in build logs

- [ ] **Regular key rotation**
  - Implement a process for regularly rotating API keys
  - Update deployment platforms with new keys without downtime

## Periodic Security Review

### Regular Code Scans

- [ ] **Monthly code scan for hardcoded secrets**
  - Use tools or manual review to detect accidentally committed secrets
  - Search for patterns like API key format

- [ ] **Dependency review**
  - Review packages that might access environment variables
  - Ensure dependencies follow best practices for security

### Incident Response

- [ ] **Create plan for leaked credentials**
  - Document steps to take if API keys are accidentally exposed
  - Include contact information for relevant API providers

## Pre-Deployment Verification

Run through this verification before each major deployment:

1. Check that no API keys or secrets are hardcoded in the codebase
2. Verify that the `.env` file is not being tracked by git
3. Ensure all sensitive operations occur server-side, not client-side
4. Verify that error logs don't expose sensitive information
5. Confirm production environment variables are properly set in Vercel 