require('dotenv').config();
const axios = require('axios');

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

    console.log('Received text for music generation:', text);

    // OpenAI API call to generate ambiance prompt
    const openaiResponse = await axios.post(process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: `You are an expert at analyzing text and extracting emotional mood and setting details.
          Analyze the provided text and extract:
          1. The dominant emotional mood (e.g., joyful, tense, melancholic, peaceful)
          2. The setting or environment described (e.g., forest, urban, ocean, space)
          3. Any notable ambient sounds that would be present in this scene
          4. A concise prompt (max 100 words) for generating background ambiance that combines
          subtle music and soundscape elements matching the mood and setting, make sure do not include vocals, it has to be a ambiance background music generation prompt`
        },
        { role: 'user', content: text }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!openaiResponse.data.choices || !openaiResponse.data.choices[0]) {
      console.error('Invalid response from OpenAI:', openaiResponse.data);
      throw new Error('Failed to generate ambiance prompt');
    }

    const ambiancePrompt = openaiResponse.data.choices[0].message.content;
    console.log('Generated ambiance prompt:', ambiancePrompt);

    // Extract just the concise prompt part (part 4) for ElevenLabs
    let elevenLabsPrompt = ambiancePrompt;
    const promptRegex = /4\.\s*(?:A\s*)?(?:concise\s*)?prompt[^:]*:(.*?)(?:\d+\.|$)/si;
    const promptMatch = ambiancePrompt.match(promptRegex);
    
    if (promptMatch && promptMatch[1]) {
      elevenLabsPrompt = promptMatch[1].trim();
    }
    
    // Ensure it doesn't exceed ElevenLabs character limit (450 characters max)
    if (elevenLabsPrompt.length > 450) {
      elevenLabsPrompt = elevenLabsPrompt.slice(0, 447) + '...';
    }
    
    console.log('ElevenLabs prompt:', elevenLabsPrompt);
    console.log('ElevenLabs prompt length:', elevenLabsPrompt.length);

    // Log ElevenLabs API request details (excluding API key)
    console.log('Making ElevenLabs API request with prompt:', elevenLabsPrompt);
    
    // ElevenLabs API call to generate music
    try {
      const elevenlabsEndpoint = process.env.ELEVENLABS_API_ENDPOINT || 'https://api.elevenlabs.io/v1/sound-generation';
      const elevenLabsResponse = await axios.post(elevenlabsEndpoint, {
        text: elevenLabsPrompt
      }, {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        validateStatus: function (status) {
          return status < 500; // Resolve only if the status code is less than 500
        }
      });

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
          statusText: elevenlabsError.response.statusText,
          data: elevenlabsError.response.data
        } : 'No response data'
      });
      throw new Error(`Failed to generate music: ${elevenlabsError.message}`);
    }
  } catch (error) {
    console.error('Error in music generation process:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate music', 
      details: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    });
  }
}; 