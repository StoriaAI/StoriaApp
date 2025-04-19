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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract bookId from URL path (/api/read/{id})
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    let bookId = pathParts[pathParts.length - 1];
    
    // If no bookId in path, check query parameters
    if (!bookId || bookId === 'read') {
      bookId = req.query.id;
    }
    
    const pageRequested = parseInt(req.query.page) || 0;
    const CHARS_PER_PAGE = 2000; // Shorter pages for better reading
    const PARAGRAPHS_PER_PAGE = 5;  // Fewer paragraphs per page

    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    // Log the request
    console.log(`Reading book ID: ${bookId}, page: ${pageRequested}`);

    // Get book details to determine the text URL
    const book = await getBookById(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Find the best text format available
    let textUrl = null;
    const formatPriorities = [
      'text/plain; charset=utf-8',
      'text/plain',
      'text/plain; charset=us-ascii',
      'text/plain; charset=iso-8859-1'
    ];
    
    for (const fmt of formatPriorities) {
      if (book.formats[fmt]) {
        textUrl = book.formats[fmt];
        break;
      }
    }
    
    if (!textUrl) {
      return res.status(400).json({
        error: 'No suitable text format available for this book. Please try another book.'
      });
    }

    // Fetch the book content
    try {
      console.log(`Fetching book content from: ${textUrl}`);
      const response = await axios.get(textUrl, {
        responseType: 'text',
        timeout: 15000
      });
      
      let rawText = response.data;
      
      // Remove Gutenberg header and footer
      const headerRegex = /\*\*\*\s+START.+?GUTENBERG.+?\n/i;
      const footerRegex = /\*\*\*\s+END.+?GUTENBERG.+/i;
      
      rawText = rawText.replace(headerRegex, '');
      const footerMatch = rawText.match(footerRegex);
      if (footerMatch) {
        rawText = rawText.substring(0, footerMatch.index);
      }
      
      // Split text into paragraphs
      const paragraphs = rawText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p);

      // Group paragraphs into pages
      const pages = [];
      for (let i = 0; i < paragraphs.length; i += PARAGRAPHS_PER_PAGE) {
        pages.push(paragraphs.slice(i, i + PARAGRAPHS_PER_PAGE).join('\n\n'));
      }

      // Ensure we have at least one page
      if (pages.length === 0) {
        pages.push("The book content could not be properly formatted.");
      }

      // Get the requested page
      const pageIndex = Math.min(pageRequested, pages.length - 1);
      const pageContent = pages[pageIndex] || "Page content not available.";
      
      // Return book metadata along with the page content
      res.json({
        page: pageIndex,
        totalPages: pages.length,
        hasNext: pageIndex < pages.length - 1,
        hasPrev: pageIndex > 0,
        content: pageContent,
        bookInfo: {
          id: book.id,
          title: book.title,
          authors: book.authors,
          languages: book.languages,
          download_count: book.download_count
        }
      });
      
    } catch (error) {
      console.error(`Error fetching book content: ${error.message}`);
      return res.status(500).json({
        error: 'Failed to fetch book content',
        details: error.message
      });
    }
    
  } catch (error) {
    console.error('Error reading book:', error.message);
    res.status(500).json({ 
      error: 'Failed to load book content', 
      details: error.message 
    });
  }
}; 