import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Button,
  CircularProgress,
  Alert,
  styled,
  useTheme,
  useMediaQuery,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FallbackLibrary from '../components/FallbackLibrary';
import '../styles/Home.css';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Styled Components
const SectionHeading = styled(Typography)(({ theme }) => ({
  fontSize: '1.2rem',
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  '& .see-all': {
    fontSize: '0.875rem',
    color: theme.palette.primary.main,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}));

const BookCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'transparent',
  boxShadow: 'none',
  borderRadius: 0,
  position: 'relative',
  overflow: 'visible',
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
  '& .star': {
    color: '#f5bb00',
    fontSize: '0.85rem',
  },
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

const CategorySection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6),
}));

// Update book categories to simpler ones that work reliably with Gutenberg
const bookCategories = [
  'Fiction',
  'Adventure',
  'Mystery',
  'Science',
  'History',
  'Philosophy'
];

// Add cache constants
const LOCAL_STORAGE_PREFIX = 'storia_cache_';
const CATEGORY_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

function Home() {
  const [books, setBooks] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState({});
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Fetch books for a specific category
  const fetchCategoryBooks = async (category, isBackgroundRefresh = false) => {
    try {
      // Only show loading state if not a background refresh
      if (!isBackgroundRefresh) {
        setLoadingCategories(prev => ({ ...prev, [category]: true }));
      }
      
      // Check localStorage cache first
      const cacheKey = `${LOCAL_STORAGE_PREFIX}category_${category}`;
      if (!isBackgroundRefresh) {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const { timestamp, data } = JSON.parse(cachedData);
          
          // Check if cache is still valid
          if (Date.now() - timestamp < CATEGORY_CACHE_TTL) {
            console.log(`Using cached category data for ${category}`);
            setBooks(prev => ({
              ...prev,
              [category]: data
            }));
            setLoadingCategories(prev => ({ ...prev, [category]: false }));
            
            // Refresh in background
            setTimeout(() => {
              fetchCategoryBooks(category, true);
            }, 100);
            
            return data;
          } else {
            console.log(`Cache expired for ${category}, fetching fresh data`);
            localStorage.removeItem(cacheKey);
          }
        }
      }
      
      // Use simple search terms for better Gutenberg results
      let searchTerm = category.toLowerCase();
      
      // Use a direct call to the Gutenberg API proxy
      let apiUrl = `/api/books?search=${encodeURIComponent(searchTerm)}&page=1`;
      console.log(`Fetching ${category} books from: ${apiUrl}`);
      
      let response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid data format received from server');
      }
      
      // Filter out books without proper data
      const validResults = data.results.filter(book => 
        book.title && book.formats && book.id
      );
      
      // Take only a few books to avoid layout issues
      const categoryBooks = validResults.slice(0, 4);
      
      // Update state (only if not background refresh or if we're still showing this category)
      if (!isBackgroundRefresh) {
        setBooks(prev => ({
          ...prev,
          [category]: categoryBooks
        }));
      } else {
        // For background refresh, check if we have this category before updating
        setBooks(prev => {
          if (prev[category]) {
            return {
              ...prev,
              [category]: categoryBooks
            };
          }
          return prev;
        });
      }
      
      // Update cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: categoryBooks
        }));
        console.log(`Cached category data for ${category}`);
      } catch (cacheError) {
        console.error('Error caching category data:', cacheError);
      }
      
      return categoryBooks;
      
    } catch (error) {
      console.error(`Error fetching ${category} books:`, error);
      
      // Only update error state if not a background refresh
      if (!isBackgroundRefresh) {
        // Don't use fallbacks - show error state directly
        setBooks(prev => ({
          ...prev,
          [category]: []
        }));
      }
      
      return [];
    } finally {
      if (!isBackgroundRefresh) {
        setLoadingCategories(prev => ({ ...prev, [category]: false }));
      }
    }
  };

  // Load cached categories on initial render
  useEffect(() => {
    // Initialize categories with cached data if available
    const loadCachedCategories = () => {
      let hasCachedData = false;
      const initialCategoryState = {};
      
      bookCategories.forEach(category => {
        const cacheKey = `${LOCAL_STORAGE_PREFIX}category_${category}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          try {
            const { timestamp, data } = JSON.parse(cachedData);
            
            if (Date.now() - timestamp < CATEGORY_CACHE_TTL) {
              initialCategoryState[category] = data;
              hasCachedData = true;
            } else {
              localStorage.removeItem(cacheKey);
            }
          } catch (error) {
            console.error(`Error parsing cached data for ${category}:`, error);
          }
        }
      });
      
      if (hasCachedData) {
        setBooks(initialCategoryState);
        
        // Mark all cached categories as loaded
        const loadingState = {};
        bookCategories.forEach(category => {
          loadingState[category] = !initialCategoryState[category];
        });
        setLoadingCategories(loadingState);
      }
      
      return hasCachedData;
    };
    
    // Try to load from cache first
    const hasCachedData = loadCachedCategories();
    
    // Fetch all categories
    const fetchAllCategories = async () => {
      // For categories that weren't cached
      const missingCategories = bookCategories.filter(category => !books[category]);
      
      if (missingCategories.length > 0) {
        console.log(`Fetching ${missingCategories.length} missing categories`);
        
        // Fetch missing categories
        await Promise.all(missingCategories.map(category => fetchCategoryBooks(category)));
      }
      
      // Refresh cached categories in background
      if (hasCachedData) {
        setTimeout(() => {
          const cachedCategories = bookCategories.filter(category => books[category]);
          cachedCategories.forEach(category => {
            fetchCategoryBooks(category, true);
          });
        }, 1000); // Wait a second before refreshing
      }
    };
    
    fetchAllCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?query=${encodeURIComponent(search.trim())}`);
    }
  };
  
  const handleBookSelect = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
      {/* Hero Section with Search */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h1" sx={{ fontSize: { xs: '2rem', sm: '2.5rem' }, mb: 2, fontWeight: 700 }}>
          Explore Classic Books
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, mx: 'auto', maxWidth: '600px' }}>
          Discover thousands of free classic books from Project Gutenberg
        </Typography>
        
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ maxWidth: '600px', mx: 'auto' }}
        >
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      {/* Trending Banner */}
      <Paper 
        elevation={0} 
        sx={{
          p: 3,
          mb: 5,
          borderRadius: 2,
          background: 'linear-gradient(to right, rgba(15,15,25,0.95), rgba(25,25,40,0.95))',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
        }}
      >
        <Box 
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
            <LocalFireDepartmentIcon color="error" fontSize="large" sx={{ mr: 2 }} />
            <Box>
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ fontWeight: 600 }}
              >
                Trending Books
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Explore the most popular books across different genres. Discover what others are reading right now.
              </Typography>
            </Box>
          </Box>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/trending')}
            endIcon={<ArrowForwardIcon />}
            sx={{ 
              borderRadius: 8,
              px: 3,
              py: 1,
              borderColor: 'rgba(255,255,255,0.15)', 
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'rgba(244, 228, 188, 0.05)',
              }
            }}
          >
            View Trending
          </Button>
        </Box>
      </Paper>

      {/* Book Categories */}
      {bookCategories.map((category) => (
        <CategorySection key={category}>
          <SectionHeading variant="h2">
            {category}
            <span className="see-all" onClick={() => navigate(`/search?query=${category}`)}>See all</span>
          </SectionHeading>
          
          {loadingCategories[category] ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : books[category] && books[category].length > 0 ? (
            <Grid container spacing={3}>
              {books[category].map((book) => (
                <Grid item key={book.id} xs={6} sm={6} md={3}>
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
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No books found for this category.
            </Typography>
          )}
        </CategorySection>
      ))}
    </Container>
  );
}

export default Home; 