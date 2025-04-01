import axios from 'axios';

// Type declarations for Vite env
interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_ELEVENLABS_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// API Response types
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/sound-generation';

export const generateAmbiencePrompt = async (text: string): Promise<string> => {
  try {
    const response = await axios.post<OpenAIResponse>(
      OPENAI_API_URL,
      {
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
                 subtle music and soundscape elements matching the mood and setting`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating ambience prompt:', error);
    throw new Error('Failed to generate ambience prompt');
  }
};

export const generateAmbientMusic = async (prompt: string): Promise<string> => {
  try {
    const response = await axios.post(
      ELEVENLABS_API_URL,
      { prompt },
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_ELEVENLABS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'blob',
      }
    );

    const blob = new Blob([response.data as BlobPart], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error generating ambient music:', error);
    throw new Error('Failed to generate ambient music');
  }
};