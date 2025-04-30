require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role key for admin access to storage
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define bucket name
const MUSIC_BUCKET = 'music-cache';

// Validate required environment variables
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'OPENAI_API_ENDPOINT',
  'ELEVENLABS_API_KEY', 
  'ELEVENLABS_API_ENDPOINT',
  'REACT_APP_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE'
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

/**
 * Check if music file exists in Supabase storage
 * @param {string} bookId - Book ID
 * @param {number} pageId - Page number
 * @returns {Promise<string|null>} - URL of the music file if it exists, null otherwise
 */
const checkMusicInStorage = async (bookId, pageId) => {
  try {
    if (!bookId || pageId === undefined) {
      console.error('Invalid parameters for checkMusicInStorage', { bookId, pageId });
      return null;
    }

    const filePath = `${bookId}/${pageId}.mp3`;
    
    // Check if file exists
    const { data, error } = await supabase
      .storage
      .from(MUSIC_BUCKET)
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (error) {
      console.error('Error checking music in storage:', error);
      return null;
    }
    
    console.log(`Found cached music for Book: ${bookId}, Page: ${pageId}`);
    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error checking music in storage:', error);
    return null;
  }
};

/**
 * Save music data to Supabase storage
 * @param {string} bookId - Book ID
 * @param {number} pageId - Page number
 * @param {Buffer} musicData - Music data as Buffer
 * @returns {Promise<string|null>} - URL of the saved music file, or null on error
 */
const saveMusicToStorage = async (bookId, pageId, musicData) => {
  try {
    if (!bookId || pageId === undefined || !musicData) {
      console.error('Invalid parameters for saveMusicToStorage', { bookId, pageId });
      return null;
    }

    const filePath = `${bookId}/${pageId}.mp3`;
    
    // Upload the file
    const { error: uploadError } = await supabase
      .storage
      .from(MUSIC_BUCKET)
      .upload(filePath, musicData, {
        contentType: 'audio/mpeg',
        upsert: true // Overwrite if exists
      });
    
    if (uploadError) {
      console.error('Error uploading music file:', uploadError);
      return null;
    }
    
    // Get the public URL
    const { data, error } = await supabase
      .storage
      .from(MUSIC_BUCKET)
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
    
    console.log(`Successfully saved music to storage for Book: ${bookId}, Page: ${pageId}`);
    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error saving music to storage:', error);
    return null;
  }
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
    
    // First, check if we already have this music cached in Supabase
    if (bookId && pageId !== undefined) {
      const cachedMusicUrl = await checkMusicInStorage(bookId, pageId);
      
      if (cachedMusicUrl) {
        console.log(`Using cached music from Supabase storage for Book: ${bookId}, Page: ${pageId}`);
        return res.json({ musicUrl: cachedMusicUrl, cached: true });
      }
      
      console.log(`No cached music found, generating new music for Book: ${bookId}, Page: ${pageId}`);
    }

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
        const systemPrompt = process.env.OPENAI_SYSTEM_PROMPT || 
          `You are an expert at analyzing text and extracting emotional mood and setting details.
          Create a concise prompt (max 50 words) for generating INSTRUMENTAL background ambiance music that matches the emotional mood and setting of the text. Focus on:
          - The dominant emotional mood (e.g., joyful, tense, melancholic)
          - The setting or environment if described 
          - Key ambient elements
          - SPECIFY CLEARLY: NO VOCALS, INSTRUMENTAL ONLY, BACKGROUND/AMBIENT SOUND ONLY`;

        const response = await axios.post(process.env.OPENAI_API_ENDPOINT, {
          model: 'gpt-4',
          messages: [
            { 
              role: 'system', 
              content: systemPrompt
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
    
    // Explicitly append a note about no vocals if not present
    if (!elevenLabsPrompt.toLowerCase().includes('no vocal') && 
        !elevenLabsPrompt.toLowerCase().includes('instrumental')) {
      elevenLabsPrompt += " (NO VOCALS, INSTRUMENTAL ONLY)";
    }
    
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

        // Make API request with correct header format and endpoint
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

    let musicUrl;
    
    // If we have both bookId and pageId, save to Supabase storage
    if (bookId && pageId !== undefined) {
      // Try to save to Supabase
      const storedUrl = await saveMusicToStorage(bookId, pageId, musicData);
      
      if (storedUrl) {
        musicUrl = storedUrl;
        console.log(`Using Supabase storage URL for Book: ${bookId}, Page: ${pageId}`);
      } else {
        // Fallback to data URL if storage fails
        console.log(`Falling back to data URL for Book: ${bookId}, Page: ${pageId}`);
        const audioBase64 = Buffer.from(musicData).toString('base64');
        musicUrl = `data:audio/mpeg;base64,${audioBase64}`;
      }
    } else {
      // Convert the audio buffer to base64 (fallback for when book/page IDs aren't provided)
      const audioBase64 = Buffer.from(musicData).toString('base64');
      musicUrl = `data:audio/mpeg;base64,${audioBase64}`;
    }
    
    console.log(`Successfully generated music for Book: ${bookId || 'Unknown'}, Page: ${pageId || 'Unknown'}`);

    res.json({ musicUrl, cached: false });
  } catch (error) {
    console.error('Error in music generation process:', error.message);
    
    // Create a more user-friendly error message based on the error type
    let userMessage = 'An error occurred generating music. Please try again.';
    
    if (error.message === 'Operation timed out') {
      userMessage = 'Music generation timed out. Please try again later.';
    } else if (error.message.includes('API key')) {
      userMessage = 'Authentication error with music service. Please check API configuration.';
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      userMessage = 'Music service rate limit reached. Please try again in a few minutes.';
    }
    
    res.status(500).json({ 
      error: userMessage,
      details: error.message 
    });
  }
}; 