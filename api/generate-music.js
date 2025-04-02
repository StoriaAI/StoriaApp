require('dotenv').config();
const axios = require('axios');

// Validate required environment variables
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'OPENAI_API_ENDPOINT',
  'ELEVENLABS_API_KEY', 
  'ELEVENLABS_API_ENDPOINT'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  // Continue with execution, but log the error
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    if (!text) {
      console.error('No text provided for music generation');
      return res.status(400).json({ error: 'Text content is required to generate music.' });
    }

    console.log('Received text for music generation:', text.substring(0, 100) + '...');

    // Set a timeout to handle long-running operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Operation timed out'));
      }, 60000); // 50 seconds timeout (Vercel has a 60 sec limit)
    });

    // OpenAI API call to generate ambiance prompt
    const openaiPromise = axios.post(process.env.OPENAI_API_ENDPOINT, {
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: process.env.OPENAI_SYSTEM_PROMPT || `You are an expert at analyzing text and extracting emotional mood and setting details.
          Create a concise prompt (max 50 words) for generating background ambiance music that matches the emotional mood and setting of the text. Focus on:
          - The dominant emotional mood (e.g., joyful, tense, melancholic)
          - The setting or environment if described 
          - Key ambient elements
          - NO vocals, instrumental only`
        },
        { role: 'user', content: text.substring(0, 800) } // Limit text to reduce tokens
      ],
      max_tokens: 150 // Limit response size
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Race the promises to handle timeouts
    const openaiResponse = await Promise.race([openaiPromise, timeoutPromise]);

    if (!openaiResponse.data.choices || !openaiResponse.data.choices[0]) {
      console.error('Invalid response from OpenAI:', openaiResponse.data);
      throw new Error('Failed to generate ambiance prompt');
    }

    const ambiancePrompt = openaiResponse.data.choices[0].message.content;
    console.log('Generated ambiance prompt:', ambiancePrompt);
    
    // Ensure it doesn't exceed ElevenLabs character limit (200 characters max to speed up generation)
    let elevenLabsPrompt = ambiancePrompt.trim();
    if (elevenLabsPrompt.length > 200) {
      elevenLabsPrompt = elevenLabsPrompt.slice(0, 197) + '...';
    }
    
    console.log('ElevenLabs prompt:', elevenLabsPrompt);
    
    // ElevenLabs API call to generate music
    try {
      const elevenlabsPromise = axios.post(process.env.ELEVENLABS_API_ENDPOINT, {
        text: elevenLabsPrompt
      }, {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 40000, // 40 second timeout for axios
        validateStatus: function (status) {
          return status < 500; // Resolve only if the status code is less than 500
        }
      });

      // Race with timeout
      const elevenLabsResponse = await Promise.race([elevenlabsPromise, timeoutPromise]);

      if (elevenLabsResponse.status !== 200) {
        // Convert arraybuffer to string if there's an error
        const errorData = Buffer.from(elevenLabsResponse.data).toString('utf8');
        console.error('ElevenLabs API Error Response:', {
          status: elevenLabsResponse.status,
          statusText: elevenLabsResponse.statusText,
          data: errorData
        });
        throw new Error(`ElevenLabs API error: ${elevenLabsResponse.status} ${elevenLabsResponse.statusText}`);
      }

      if (!elevenLabsResponse.data) {
        console.error('Invalid response from ElevenLabs - no data received');
        throw new Error('Failed to generate music - no data received from API');
      }

      // Convert the audio buffer to base64
      const audioBase64 = Buffer.from(elevenLabsResponse.data).toString('base64');
      const musicUrl = `data:audio/mpeg;base64,${audioBase64}`;
      
      console.log('Successfully generated music data URL');

      res.json({ musicUrl });
    } catch (elevenlabsError) {
      console.error('ElevenLabs API Error:', {
        message: elevenlabsError.message,
        response: elevenlabsError.response ? {
          status: elevenlabsError.response.status,
          statusText: elevenlabsError.response.statusText
        } : 'No response data'
      });
      
      // Return a fallback music URL
      res.status(200).json({ 
        musicUrl: 'https://dl.espressif.com/dl/audio/ff-16b-2c-44100hz.mp3',
        fallback: true,
        error: elevenlabsError.message
      });
    }
  } catch (error) {
    console.error('Error in music generation process:', error.message);
    
    // Return a fallback music URL instead of an error
    res.status(200).json({ 
      musicUrl: 'https://dl.espressif.com/dl/audio/ff-16b-2c-44100hz.mp3',
      fallback: true,
      error: error.message
    });
  }
}; 