# Setting Up ElevenLabs API for Music Generation

This document explains how to properly set up the ElevenLabs API for music generation in the Storia application.

## Issues with Music Generation

If you're experiencing one of these issues:
1. **Authentication errors** (`401 Unauthorized`) when generating music
2. **Vocal music instead of ambient sounds**
3. **Page reloading** when generating music

These can be fixed by following the steps below.

## Getting Your ElevenLabs API Key

1. **Create an Account**: Visit [ElevenLabs](https://elevenlabs.io/) and create an account if you don't have one
2. **Access API Key**: Log into your ElevenLabs account, go to your profile settings
3. **Copy API Key**: Find your API key in the profile or developer settings section
4. **Verify Sound Generation Access**: Ensure your account has access to the Sound Generation feature

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
4. Make sure to use exactly `https://api.elevenlabs.io/v1/sound-generation` as the endpoint
5. Save the file

## Fixing "Vocal Music" Issues

If the generated music contains vocals instead of instrumental ambient sounds:

1. Ensure the OpenAI system prompt is correctly set in your `.env` file:

```
OPENAI_SYSTEM_PROMPT="You are an expert at analyzing text and extracting emotional mood and setting details. Create a concise prompt (max 50 words) for generating INSTRUMENTAL background ambiance music that matches the emotional mood and setting of the text. Focus on: the dominant emotional mood (e.g., joyful, tense, melancholic), the setting or environment, and key ambient elements. IMPORTANT: Specify NO VOCALS, INSTRUMENTAL ONLY, background/ambient sound only."
```

2. This prompt explicitly instructs the system to generate non-vocal, instrumental ambient music

## Fixing Page Reload Issues

If the entire page reloads when you click the "Generate Music" button:

1. This issue has been fixed in the latest update
2. Make sure you're running the latest version of the application
3. The music generation now happens asynchronously without affecting the page display

## Important Notes

- Make sure there are no spaces before or after your API key
- The API key is sensitive information - never commit it to version control
- Ensure `.env` is listed in your `.gitignore` file
- Do not create additional `.env` files in other directories
- Only use the Sound Generation endpoint from ElevenLabs

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
5. **OpenAI Prompts**: Check the prompts generated for ElevenLabs in the console logs to ensure they specify "no vocals" and "instrumental only"

## Support

If you continue experiencing issues after following these steps, contact support with:
- The exact error message from the console
- Your ElevenLabs account tier
- When the issue started occurring
- The generated prompt that's being sent to ElevenLabs (found in console logs) 