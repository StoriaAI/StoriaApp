require('dotenv').config();
const axios = require('axios');

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

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Log the request details
    console.log(`Fetching books from: ${baseUrl}?${params.toString()}`);

    let retries = 0;
    const maxRetries = 3;
    let response;

    // Try fetching with retries
    while (retries < maxRetries) {
      try {
        response = await axios.get(`${baseUrl}?${params.toString()}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Storia/1.0 (https://joinstoria.vercel.app)'
          },
          timeout: 10000 // 10 second timeout
        });
        break; // If successful, exit the retry loop
      } catch (error) {
        retries++;
        console.error(`Attempt ${retries} failed: ${error.message}`);
        
        if (retries >= maxRetries) {
          throw error; // Give up after max retries
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(r => setTimeout(r, retries * 1000));
      }
    }

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
        textUrl = `/api/read?id=${book.id}`;
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

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    
    // Return the transformed data
    res.status(200).json({
      count: response.data.count,
      next: response.data.next,
      previous: response.data.previous,
      results: transformedResults
    });
  } catch (error) {
    console.error('Error fetching books:', error.message);
    
    // Send a proper error response
    res.status(500).json({
      error: 'Failed to fetch books',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 