require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

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

// Endpoint: POST /api/generate-music
// Generates ambiance prompt using OpenAI and music using ElevenLabs
app.post('/api/generate-music', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      console.error('No text provided for music generation');
      return res.status(400).json({ error: 'Text content is required to generate music.' });
    }

    console.log('Received text for music generation:', text);

    // OpenAI API call to generate ambiance prompt
    const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
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
      const elevenLabsResponse = await axios.post('https://api.elevenlabs.io/v1/sound-generation', {
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
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Log all registered routes
  console.log('Registered endpoints:');
  app._router.stack.forEach(function(r) {
    if (r.route && r.route.path) {
      Object.keys(r.route.methods).forEach(method => {
        console.log(`${method.toUpperCase()} ${r.route.path}`);
      });
    }
  });
});
