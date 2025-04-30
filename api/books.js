require('dotenv').config();
const axios = require('axios');
const cache = require('../utils/cache');

// Cache TTL values (in seconds)
const SEARCH_CACHE_TTL = process.env.SEARCH_CACHE_TTL || 3600; // 1 hour
const BOOK_CACHE_TTL = process.env.BOOK_CACHE_TTL || 86400; // 24 hours

// Helper: Get book details from Gutendex by ID
async function getBookById(bookId) {
  try {
    // Check cache first
    const cacheKey = `book:${bookId}`;
    const cachedBook = await cache.get(cacheKey);
    
    if (cachedBook) {
      console.log(`Cache hit for book ${bookId}`);
      return cachedBook;
    }
    
    console.log(`Cache miss for book ${bookId}, fetching from API`);
    const response = await axios.get(`https://gutendex.com/books/${bookId}`);
    
    // Cache the result with longer TTL since book data rarely changes
    await cache.set(cacheKey, response.data, BOOK_CACHE_TTL);
    
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

    // Generate cache key based on query parameters
    const queryString = params.toString();
    const cacheKey = `books:${queryString}`;
    
    // Check cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for query: ${queryString}`);
      return res.status(200).json(cachedData);
    }
    
    // Log the request details
    console.log(`Cache miss. Fetching books from: ${baseUrl}?${queryString}`);

    // Make request to Gutenberg API
    const response = await axios.get(`${baseUrl}?${queryString}`, {
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
        
        // Find EPUB format if available
        let epubUrl = null;
        if (book.formats['application/epub+zip']) {
          epubUrl = book.formats['application/epub+zip'];
        }
        
        // Find Kindle format if available
        let kindleUrl = null;
        if (book.formats['application/x-mobipocket-ebook']) {
          kindleUrl = book.formats['application/x-mobipocket-ebook'];
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
        
        // Return simplified book object with additional formats
        return {
          id: book.id,
          title: book.title,
          authors: book.authors,
          formats: {
            'image/jpeg': imageUrl,
            'text/plain': textUrl,
            'epub': epubUrl,
            'kindle': kindleUrl
          },
          download_count: book.download_count || 0,
          languages: book.languages || ['en']
        };
      });

    // Format the response data
    const responseData = {
      count: response.data.count,
      next: response.data.next,
      previous: response.data.previous,
      results: transformedResults
    };
    
    // Cache the transformed response
    // Use shorter TTL for search results, longer for specific book lookups
    const ttl = id ? BOOK_CACHE_TTL : SEARCH_CACHE_TTL;
    await cache.set(cacheKey, responseData, ttl);
    
    // Return the results
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching books:', error.message);
    
    // Send a proper error response
    res.status(500).json({
      error: 'Failed to fetch books',
      details: error.message
    });
  }
}; 