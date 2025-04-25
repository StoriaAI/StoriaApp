# Setting Up ElevenLabs API for Music Generation

This document explains how to properly set up the ElevenLabs API for music generation in the Storia application.

## Issues with Music Generation

If you're experiencing errors like `401 Unauthorized` when generating music, it's likely due to missing or invalid ElevenLabs API credentials. The error message typically looks like:

```
ElevenLabs API error: 401 Unauthorized
```

## Getting Your ElevenLabs API Key

1. **Create an Account**: Visit [ElevenLabs](https://elevenlabs.io/) and create an account if you don't have one
2. **Access API Key**: Log into your ElevenLabs account, go to your profile settings
3. **Copy API Key**: Find your API key in the profile or developer settings section

## Setting Up Your .env File

Our application uses a **single .env file in the root directory** for all environment variables.

1. Create or edit the `.env` file in the root directory of the project
2. Add the following ElevenLabs-related variables:

```
# ElevenLabs API Configuration
ELEVENLABS_API_KEY=your_actual_api_key_here
ELEVENLABS_API_ENDPOINT=https://api.elevenlabs.io/v1/sound-generation
```

3. Replace `your_actual_api_key_here` with your real API key from ElevenLabs
4. Save the file

## Important Notes

- Make sure there are no spaces before or after your API key
- The API key is sensitive information - never commit it to version control
- Ensure `.env` is listed in your `.gitignore` file
- Do not create additional `.env` files in other directories

## Confirming Your Setup

After setting up your .env file:

1. Restart your development server
2. Try reading a book with music generation
3. Check the console logs for any errors

## Troubleshooting

If you still encounter issues:

1. **Verify API Key**: Double check that your API key is correctly copied
2. **Check Subscription**: Ensure your ElevenLabs account has an active subscription with access to the Sound Generation API
3. **API Rate Limits**: Be aware of rate limits on your ElevenLabs account tier
4. **Server Logs**: Check the server/console logs for detailed error messages

## Support

If you continue experiencing issues after following these steps, contact support with:
- The exact error message from the console
- Your ElevenLabs account tier
- When the issue started occurring 