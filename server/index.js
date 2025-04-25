require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Helper: Get book details from Gutendex by ID
async function getBookById(bookId) {
  try {
    const response = await axios.get(`https://gutendex.com/books/${bookId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching book ${bookId}:`, error.message);
    return null;
  }
}

// Endpoint: GET /api/books
// Fetches a list of books (or a specific book if ?id= is provided) from Gutendex
app.get('/api/books', async (req, res) => {
  try {
    const { search = '', page = 1, id } = req.query;
    const baseUrl = 'https://gutendex.com/books';
    const params = new URLSearchParams();
    if (id) {
      params.append('ids', id);
    } else {
      if (search) params.append('search', search);
      if (page) params.append('page', page);
    }
    const response = await axios.get(`${baseUrl}?${params.toString()}`);
    // Transform results: try to pick a prioritized text format URL
    const transformedResults = response.data.results.map(book => {
      const formatPriorities = [
        'text/plain; charset=utf-8',
        'text/plain; charset=us-ascii',
        'text/plain; charset=iso-8859-1',
        'text/plain',
        'text/plain; charset=windows-1252',
        'text/html',
        'text/html; charset=utf-8'
      ];
      let textUrl = null;
      let formatType = null;
      for (const fmt of formatPriorities) {
        if (book.formats[fmt]) {
          textUrl = book.formats[fmt];
          formatType = fmt;
          break;
        }
      }
      // Fallback: if no text URL found, use the proxy endpoint below
      if (!textUrl || typeof textUrl !== 'string' || textUrl.trim() === '') {
        textUrl = `/api/read/${book.id}`;
        formatType = 'text/plain';
      }
      return {
        id: book.id,
        title: book.title,
        authors: book.authors,
        formats: {
          'image/jpeg': book.formats['image/jpeg'] ||
                        book.formats['image/jpg'] ||
                        book.formats['image/png'] ||
                        null,
          'text/plain': textUrl,
          format_type: formatType
        },
        download_count: book.download_count,
        languages: book.languages
      };
    });
    res.json({
      count: response.data.count,
      next: response.data.next,
      previous: response.data.previous,
      results: transformedResults
    });
  } catch (error) {
    console.error('Error fetching books:', error.message);
    res.status(500).json({
      error: 'Failed to fetch books',
      details: error.message
    });
  }
});

// Endpoint: GET /api/read/:id?page=
// Returns paginated text content for a book.
// It fetches the raw text (using HTTP Range requests if possible),
// cleans Gutenberg headers/footers, splits the content into pages,
// and returns the requested page along with pagination info.
app.get('/api/read/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    const pageRequested = parseInt(req.query.page) || 0;
    const CHARS_PER_PAGE = 2500;
    const PARAGRAPHS_PER_PAGE = 8;

    // Get book details to determine the text URL
    const book = await getBookById(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Prioritized formats
    const formatPriorities = [
      'text/plain',
      'text/plain; charset=utf-8',
      'text/plain; charset=us-ascii',
      'text/plain; charset=iso-8859-1',
      'text/plain; charset=windows-1252',
      'text/html',
      'text/html; charset=utf-8'
    ];
    let textUrl = null;
    let formatType = null;
    for (const fmt of formatPriorities) {
      if (book.formats[fmt]) {
        textUrl = book.formats[fmt];
        formatType = fmt;
        break;
      }
    }
    if (!textUrl) {
      return res.status(400).json({
        error: 'No suitable text format available for this book. Please try another book.'
      });
    }

    // Attempt to get content length via HEAD request
    let contentLength = 0;
    try {
      const headResp = await axios.head(textUrl, { headers: { 'Accept': 'text/plain' } });
      contentLength = parseInt(headResp.headers['content-length'] || '0');
    } catch (err) {
      // Fallback: fetch a sample to estimate length
      try {
        const sampleResp = await axios.get(textUrl, {
          headers: { 'Accept': 'text/plain', 'Range': 'bytes=0-10000' },
          responseType: 'text'
        });
        contentLength = sampleResp.data.length;
      } catch (err2) {
        contentLength = 0;
      }
    }
    // If unknown, default to 100 pages
    const totalPagesEstimated = contentLength > 0 ? Math.ceil(contentLength / CHARS_PER_PAGE) : 100;

    // To reduce multiple range requests, fetch 10 pages at a time.
    const startPage = Math.floor(pageRequested / 10) * 10;
    const endPage = Math.min(startPage + 9, totalPagesEstimated - 1);
    const startByte = startPage * CHARS_PER_PAGE;
    const bytesToFetch = Math.floor((endPage - startPage + 1) * CHARS_PER_PAGE * 1.5);

    console.log(`Fetching bytes ${startByte} to ${startByte + bytesToFetch} from ${textUrl}`);
    const rangeResp = await axios.get(textUrl, {
      headers: {
        'Accept': 'text/plain',
        'Range': `bytes=${startByte}-${startByte + bytesToFetch}`
      },
      responseType: 'text'
    });
    let rawText = rangeResp.data;

    // Remove Gutenberg header markers if present
    const headerMarkers = [
      '*** START OF THE PROJECT GUTENBERG EBOOK',
      '*** START OF THIS PROJECT GUTENBERG EBOOK',
      '***START OF THE PROJECT GUTENBERG EBOOK',
      '*** START OF THE PROJECT GUTENBERG',
      '*** START OF THIS PROJECT GUTENBERG',
      '*** START OF THE PROJECT',
      '*END*THE SMALL PRINT'
    ];
    for (const marker of headerMarkers) {
      const idx = rawText.indexOf(marker);
      if (idx !== -1) {
        const nextLine = rawText.indexOf('\n', idx);
        if (nextLine !== -1) {
          rawText = rawText.substring(nextLine + 1);
          break;
        }
      }
    }
    // Remove Gutenberg footer markers if present
    const footerMarkers = [
      '*** END OF THE PROJECT GUTENBERG EBOOK',
      '*** END OF THIS PROJECT GUTENBERG EBOOK',
      '***END OF THE PROJECT GUTENBERG EBOOK',
      '*** END OF THE PROJECT GUTENBERG',
      '*** END OF THIS PROJECT GUTENBERG',
      'End of the Project Gutenberg',
      'End of Project Gutenberg'
    ];
    for (const marker of footerMarkers) {
      const idx = rawText.indexOf(marker);
      if (idx !== -1) {
        rawText = rawText.substring(0, idx);
        break;
      }
    }

    // Split text into paragraphs (split on one or more blank lines)
    const paragraphs = rawText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);

    // Group paragraphs into pages (each page will have a fixed number of paragraphs)
    const pages = [];
    let currentPageText = "";
    let paraCount = 0;
    for (const para of paragraphs) {
      if (paraCount >= PARAGRAPHS_PER_PAGE && currentPageText.length > 0) {
        pages.push(currentPageText);
        currentPageText = para;
        paraCount = 1;
      } else {
        currentPageText += (currentPageText ? "\n\n" : "") + para;
        paraCount++;
      }
    }
    if (currentPageText.trim()) {
      pages.push(currentPageText.trim());
    }

    // Determine the requested page within this fetched range.
    const relativePageIndex = pageRequested - startPage;
    const pageContent = pages[relativePageIndex] || "Page content not available.";

    res.json({
      page: pageRequested,
      totalPages: totalPagesEstimated,
      hasNext: pageRequested < totalPagesEstimated - 1,
      hasPrev: pageRequested > 0,
      content: pageContent
    });
  } catch (error) {
    console.error('Error reading book:', error.message);
    res.status(500).json({ error: 'Failed to load book content', details: error.message });
  }
});

// Function to retry with exponential backoff
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

// Endpoint: POST /api/generate-music
// Generates ambiance prompt using OpenAI and music using ElevenLabs
app.post('/api/generate-music', async (req, res) => {
  try {
    const { text, pageId, bookId } = req.body;
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

    // Function to generate ambiance prompt with OpenAI
    const generateAmbiance = async () => {
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
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
        // Check if API key is present
        if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY.trim() === '') {
          throw new Error('ELEVENLABS_API_KEY is missing or empty');
        }

        // Log the API key length (not the key itself) for debugging
        console.log(`Using ElevenLabs API key (length: ${process.env.ELEVENLABS_API_KEY?.length || 0})`);
        
        // Make API request with proper headers
        const response = await axios.post('https://api.elevenlabs.io/v1/sound-generation', {
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
      details: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}/api/books`);
  
  // Log all registered routes
  console.log('Registered endpoints:');
  app._router.stack.forEach(function(r) {
    if (r.route && r.route.path) {
      Object.keys(r.route.methods).forEach(method => {
        console.log(`${method.toUpperCase()} ${r.route.path}`);
      });
    }
  });
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please make sure no other service is running on this port.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
