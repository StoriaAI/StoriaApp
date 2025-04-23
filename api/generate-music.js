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

// Check if the ElevenLabs API key is missing or empty
if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY === 'your_elevenlabs_api_key') {
  console.error('ELEVENLABS_API_KEY is missing or using a placeholder value. Please provide a valid API key.');
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise} - The result of the function
 */
const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry for certain types of errors
      if (error.response) {
        // For 401/403 errors, retrying won't help without fixing the API key
        if (error.response.status === 401 || error.response.status === 403) {
          console.error(`Authorization error (${error.response.status}). Please check your API key.`);
          throw error;
        }
        
        // For 429 (rate limit), definitely retry
        if (error.response.status === 429) {
          console.log('Rate limit hit. Retrying after delay...');
        }
      }

      // Calculate delay with exponential backoff (1s, 2s, 4s, etc.)
      const delay = initialDelay * Math.pow(2, retries);
      console.log(`Retrying after ${delay}ms (attempt ${retries + 1}/${maxRetries})...`);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }

  // If we've exhausted retries, throw the last error
  throw lastError;
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, pageId, bookId, timestamp } = req.body;
    if (!text) {
      console.error('No text provided for music generation');
      return res.status(400).json({ error: 'Text content is required to generate music.' });
    }

    console.log(`Received request for music generation - Book: ${bookId || 'Unknown'}, Page: ${pageId || 'Unknown'}`);
    console.log('Text sample:', text.substring(0, 100) + '...');

    // Set a timeout to handle long-running operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Operation timed out'));
      }, 60000); // 60 seconds timeout (Vercel has a 60 sec limit)
    });

    // Create a more specific prompt that includes the page and book context
    const promptContext = pageId !== undefined ? 
      `This is page ${pageId} of a book. ` : 
      'This is a section of a book. ';

    // OpenAI API call to generate ambiance prompt
    const generateAmbiance = async () => {
      try {
        const response = await axios.post(process.env.OPENAI_API_ENDPOINT, {
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
            { role: 'user', content: promptContext + text.substring(0, 800) } // Limit text to reduce tokens
          ],
          max_tokens: 150 // Limit response size
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.data.choices || !response.data.choices[0]) {
          throw new Error('Invalid response from OpenAI: No choices returned');
        }

        return response.data.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI API error:', error.message);
        if (error.response) {
          console.error('OpenAI API error details:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
        }
        throw error;
      }
    };

    // Call OpenAI with retry logic
    const ambiancePrompt = await Promise.race([
      retryWithBackoff(generateAmbiance, 2, 1000), 
      timeoutPromise
    ]);
    
    console.log('Generated ambiance prompt:', ambiancePrompt);
    
    // Ensure it doesn't exceed ElevenLabs character limit (200 characters max to speed up generation)
    let elevenLabsPrompt = ambiancePrompt.trim();
    if (elevenLabsPrompt.length > 200) {
      elevenLabsPrompt = elevenLabsPrompt.slice(0, 197) + '...';
    }
    
    console.log('ElevenLabs prompt:', elevenLabsPrompt);
    
    // ElevenLabs API call to generate music
    // Add page and book identifiers to request for better variation
    const musicPrompt = `${elevenLabsPrompt} (Book:${bookId || 'Unknown'}, Page:${pageId || 'Unknown'})`;
    
    // Function to make the ElevenLabs API call
    const generateMusic = async () => {
      try {
        // Log the API key length (not the key itself) for debugging
        console.log(`Using ElevenLabs API key (length: ${process.env.ELEVENLABS_API_KEY?.length || 0})`);
        
        // Verify we have a non-empty API key
        if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY.trim() === '') {
          throw new Error('ELEVENLABS_API_KEY is missing or empty');
        }

        // Make API request with correct header format
        const response = await axios.post(process.env.ELEVENLABS_API_ENDPOINT, {
          text: musicPrompt
        }, {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY.trim(), // Ensure no whitespace
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 40000, // 40 second timeout for axios
        });

        // Check response status
        if (response.status !== 200) {
          throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
        }

        // Check if we got data back
        if (!response.data || response.data.length === 0) {
          throw new Error('No data received from ElevenLabs API');
        }

        return response.data;
      } catch (error) {
        console.error('ElevenLabs API error:', error.message);
        
        // Provide more detailed error information
        if (error.response) {
          let errorData = 'Unable to parse error data';
          try {
            if (error.response.data instanceof Buffer) {
              errorData = Buffer.from(error.response.data).toString('utf8');
            } else {
              errorData = JSON.stringify(error.response.data);
            }
          } catch (e) {
            console.error('Error parsing ElevenLabs error data:', e);
          }
          
          console.error('ElevenLabs API error details:', {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: errorData
          });
          
          // Add more specific error for auth issues
          if (error.response.status === 401) {
            throw new Error('ElevenLabs API unauthorized: Invalid API key');
          }
        }
        
        throw error;
      }
    };

    // Call ElevenLabs with retry logic
    const musicData = await Promise.race([
      retryWithBackoff(generateMusic, 2, 1000),
      timeoutPromise
    ]);

    // Convert the audio buffer to base64
    const audioBase64 = Buffer.from(musicData).toString('base64');
    const musicUrl = `data:audio/mpeg;base64,${audioBase64}`;
    
    console.log(`Successfully generated music data URL for Book: ${bookId || 'Unknown'}, Page: ${pageId || 'Unknown'}`);

    res.json({ musicUrl });
  } catch (error) {
    console.error('Error in music generation process:', error.message);
    
    // Create a more user-friendly error message based on the error type
    let userMessage = 'Failed to generate music';
    let statusCode = 500;
    
    if (error.message.includes('API key')) {
      userMessage = 'Authentication error with music service. Please check API configuration.';
      statusCode = 401;
    } else if (error.message.includes('timeout') || error.message.includes('ECONNABORTED')) {
      userMessage = 'Music generation timed out. Please try again later.';
      statusCode = 504;
    } else if (error.message.includes('rate limit')) {
      userMessage = 'Music service rate limit exceeded. Please try again in a few minutes.';
      statusCode = 429;
    }
    
    res.status(statusCode).json({ 
      error: userMessage, 
      details: error.message
    });
  }
}; 