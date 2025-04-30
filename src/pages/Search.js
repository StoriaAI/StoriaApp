import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  InputAdornment,
  Box,
  Grid,
  CardMedia,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  styled,
  useTheme,
  useMediaQuery,
  IconButton,
  Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Styled Components
const BookCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'transparent',
  boxShadow: 'none',
  borderRadius: 0,
  position: 'relative',
  overflow: 'visible',
  cursor: 'pointer',
}));

const BookCover = styled(CardMedia)(({ theme }) => ({
  height: 0,
  paddingTop: '150%', // 2:3 aspect ratio for book covers
  borderRadius: theme.spacing(1),
  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
  },
}));

const BookRating = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: theme.spacing(0.5),
  '& .count': {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(0.5),
  },
}));

const SearchInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.spacing(3),
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.5, 2),
  },
}));

// Add cache constants 
const LOCAL_STORAGE_PREFIX = 'storia_cache_';
const SEARCH_CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get('query') || '';
  const [searchTerm, setSearchTerm] = useState(query);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Search for books when the query or page changes
  useEffect(() => {
    if (!query) return;
    
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Generate cache key for this search
        const cacheKey = `${LOCAL_STORAGE_PREFIX}search_${query}_page${page}`;
        
        // Try to get from cache first
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const { timestamp, data, totalPages: cachedTotalPages } = JSON.parse(cachedData);
          
          // Check if cache is still valid
          if (Date.now() - timestamp < SEARCH_CACHE_TTL) {
            console.log(`Using cached search results for "${query}" page ${page}`);
            setBooks(data);
            setTotalPages(cachedTotalPages);
            setLoading(false);
            
            // Refresh cache in background after a short delay
            setTimeout(() => {
              refreshSearchResults(query, page, cacheKey);
            }, 100);
            
            return;
          } else {
            console.log(`Cache expired for "${query}" page ${page}, fetching fresh data`);
            localStorage.removeItem(cacheKey);
          }
        }
        
        let apiUrl = `/api/books?search=${encodeURIComponent(query)}&page=${page}`;
        console.log(`Searching for books: ${apiUrl}`);
        
        let response = await fetch(apiUrl);
        
        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check content type to ensure it's JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON response but got ${contentType}`);
        }
        
        const data = await response.json();
        
        if (!data.results || !Array.isArray(data.results)) {
          throw new Error('Invalid data format received from server');
        }
        
        console.log(`Found ${data.count} books matching "${query}"`);
        setBooks(data.results);
        
        // Calculate total pages - assume 32 items per page from Gutenberg API
        const totalItems = data.count;
        const itemsPerPage = 32;
        const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
        setTotalPages(calculatedTotalPages);
        
        // Save to cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data: data.results,
            totalPages: calculatedTotalPages
          }));
          console.log(`Cached search results for "${query}" page ${page}`);
        } catch (cacheError) {
          console.error('Error caching search results:', cacheError);
        }
        
      } catch (error) {
        console.error('Search error:', error);
        setError(`Failed to search books: ${error.message}`);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooks();
  }, [query, page]);
  
  // Refresh search results in background
  const refreshSearchResults = async (query, page, cacheKey) => {
    try {
      console.log(`Background refresh for "${query}" page ${page}`);
      
      let apiUrl = `/api/books?search=${encodeURIComponent(query)}&page=${page}`;
      let response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid data format received from server');
      }
      
      // Only update if we're still on the same search/page
      const currentQuery = new URLSearchParams(location.search).get('query') || '';
      const currentPage = page;
      
      if (currentQuery === query && currentPage === page) {
        setBooks(data.results);
        
        // Calculate total pages
        const totalItems = data.count;
        const itemsPerPage = 32;
        const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
        setTotalPages(calculatedTotalPages);
      }
      
      // Update cache
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: data.results,
        totalPages: calculatedTotalPages
      }));
      
    } catch (error) {
      console.error('Background refresh error:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
    }
  };
  
  const handleBookSelect = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    // Scroll back to top when changing pages
    window.scrollTo(0, 0);
  };

  // Function to generate star rating display - based on download count
  const renderRating = (downloadCount) => {
    // Normalize download count to a 1-5 scale
    // Let's say 50,000+ downloads is 5 stars, 0 is 3 stars
    const normalizedRating = Math.min(5, 3 + (downloadCount / 50000) * 2);
    const ratingNum = parseFloat(normalizedRating).toFixed(1);
    
    return (
      <BookRating>
        {'★★★★★'.slice(0, Math.floor(normalizedRating))}
        {normalizedRating % 1 > 0 ? '☆' : ''}
        <span className="count">({ratingNum})</span>
      </BookRating>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Search Header */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton 
            onClick={() => navigate(-1)} 
            sx={{ mr: 1 }}
            aria-label="Go back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            Search Results
          </Typography>
        </Box>
        
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ width: '100%' }}
        >
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for books..."
            fullWidth
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
      
      {/* Results Count & Status */}
      {!loading && !error && books.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Found {books.length} books for "{query}"
        </Typography>
      )}
      
      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress size={40} />
        </Box>
      )}
      
      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* No Results */}
      {!loading && !error && books.length === 0 && (
        <Box sx={{ textAlign: 'center', my: 8 }}>
          <Typography variant="h6">No books found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try a different search term or browse our categories
          </Typography>
        </Box>
      )}
      
      {/* Results Grid */}
      {!loading && !error && books.length > 0 && (
        <>
          <Grid container spacing={isMobile ? 2 : 3}>
            {books.map((book) => (
              <Grid item key={book.id} xs={6} sm={4} md={3} lg={2.4}>
                <BookCard onClick={() => handleBookSelect(book.id)}>
                  <BookCover
                    image={book.formats['image/jpeg'] || '/placeholder-book.jpg'}
                    title={book.title}
                    onError={(e) => {
                      e.target.src = '/placeholder-book.jpg';
                    }}
                  />
                  <CardContent sx={{ px: 0, py: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.2,
                        minHeight: '2.4em',
                        fontWeight: 500
                      }}
                    >
                      {book.title}
                    </Typography>
                    {renderRating(book.download_count || 100)}
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      {(book.authors && book.authors[0]?.name) || 'Unknown Author'}
                    </Typography>
                  </CardContent>
                </BookCard>
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default Search; 