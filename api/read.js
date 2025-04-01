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
    const bookId = req.query.id;
    const pageRequested = parseInt(req.query.page) || 0;
    const CHARS_PER_PAGE = 2500;
    const PARAGRAPHS_PER_PAGE = 8;

    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

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
}; 