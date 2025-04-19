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
    
    // Build query parameters
    if (id) {
      params.append('ids', id);
    } else {
      if (search) params.append('search', search);
      if (page) params.append('page', page);
    }

    // Log the request details
    console.log(`Fetching books from: ${baseUrl}?${params.toString()}`);

    // Make request to Gutenberg API
    const response = await axios.get(`${baseUrl}?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Storia/1.0'
      },
      timeout: 10000 // 10 second timeout
    });

    // Transform API results to our simplified format
    const transformedResults = response.data.results
      .filter(book => book.title && book.id) // Filter out invalid books
      .map(book => {
        // Find the best available text format
        let textUrl = null;
        const textFormats = [
          'text/plain; charset=utf-8',
          'text/plain; charset=us-ascii',
          'text/plain',
          'text/plain; charset=iso-8859-1'
        ];
        
        for (const fmt of textFormats) {
          if (book.formats[fmt]) {
            textUrl = book.formats[fmt];
            break;
          }
        }
        
        // If no text URL found, use our read API
        if (!textUrl) {
          textUrl = `/api/read/${book.id}`;
        }
        
        // Find the best available image format
        let imageUrl = null;
        const imageFormats = [
          'image/jpeg',
          'image/jpg',
          'image/png'
        ];
        
        for (const fmt of imageFormats) {
          if (book.formats[fmt] && !book.formats[fmt].includes('small') && !book.formats[fmt].includes('logo')) {
            imageUrl = book.formats[fmt];
            break;
          }
        }
        
        // Set default placeholder if no image available
        if (!imageUrl) {
          imageUrl = '/placeholder-book.jpg';
        }
        
        // Author formatting
        const authorName = book.authors.length > 0 
          ? book.authors[0].name 
          : 'Unknown Author';
        
        // Return simplified book object
        return {
          id: book.id,
          title: book.title,
          authors: book.authors,
          formats: {
            'image/jpeg': imageUrl,
            'text/plain': textUrl
          },
          download_count: book.download_count || 0,
          languages: book.languages || ['en']
        };
      });

    // Return the results with standard format
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
      details: error.message
    });
  }
}; 