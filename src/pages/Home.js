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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FallbackLibrary from '../components/FallbackLibrary';
import '../styles/Home.css';

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

// Book categories from reference image
const bookCategories = [
  'Latest Summaries',
  'Trending Books',
  'Top 100 Non-Fiction Books of All Time',
  'Top 100 Fiction Books of All Time',
  'Best Psychology Books',
  'Best Technology Books',
  'Deep Mental Health Books',
  'Best Nonfiction Books',
  'Best Business Books',
  'Best Motivational Books',
  'Best Relationship Books',
  'Best Design Books',
  'Best Food Books'
];

function Home() {
  const [books, setBooks] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState({});
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [showFallback, setShowFallback] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Fetch books for a specific category
  const fetchCategoryBooks = async (category, pageNum = 1) => {
    try {
      setLoadingCategories(prev => ({ ...prev, [category]: true }));
      
      let apiUrl = `/api/books?search=${encodeURIComponent(category)}&page=${pageNum}`;
      console.log(`Fetching ${category} books from: ${apiUrl}`);
      
      let response = await fetch(apiUrl);
      
      // If we get an HTML response (error) and we're in development, try using localhost API
      if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
        console.warn('First API attempt failed, trying absolute URL');
        
        const baseUrl = window.location.hostname === 'localhost' ? 
          'http://localhost:3000' : // Use port 3000 for the Express server
          window.location.origin;
          
        apiUrl = `${baseUrl}/api/books?search=${encodeURIComponent(category)}&page=${pageNum}`;
        console.log(`Retrying with: ${apiUrl}`);
        
        response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
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
      
      // Update the books state with this category
      setBooks(prev => ({
        ...prev,
        [category]: data.results.slice(0, 5) // Only take first 5 books for each category
      }));
      
    } catch (error) {
      console.error(`Error fetching ${category} books:`, error);
      
      // Use fallback if available
      if (showFallback) {
        setBooks(prev => ({
          ...prev,
          [category]: generateFallbackBooks(category, 5)
        }));
      }
    } finally {
      setLoadingCategories(prev => ({ ...prev, [category]: false }));
    }
  };

  // Generate fallback books if API fails
  const generateFallbackBooks = (category, count) => {
    // This would be replaced with actual fallback logic
    return Array(count).fill(null).map((_, index) => ({
      id: `fallback-${category}-${index}`,
      title: `${category} Book ${index + 1}`,
      authors: [{name: 'Author Name'}],
      formats: {'image/jpeg': '/placeholder-book.jpg'},
      download_count: Math.floor(Math.random() * 1000),
      rating: (4 + Math.random()).toFixed(1)
    }));
  };

  useEffect(() => {
    // Fetch the first few categories initially
    const initialCategories = bookCategories.slice(0, 4);
    initialCategories.forEach(category => {
      fetchCategoryBooks(category);
    });
    
    // Lazy load the rest as user scrolls
    const lazyLoadCategories = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const pageHeight = document.body.scrollHeight;
      
      if (scrollPosition > pageHeight * 0.7) {
        // Load more categories as user scrolls down
        const remainingCategories = bookCategories.slice(4);
        remainingCategories.forEach(category => {
          if (!books[category] && !loadingCategories[category]) {
            fetchCategoryBooks(category);
          }
        });
        
        // Remove scroll listener once all categories are loaded
        if (Object.keys(books).length >= bookCategories.length) {
          window.removeEventListener('scroll', lazyLoadCategories);
        }
      }
    };
    
    window.addEventListener('scroll', lazyLoadCategories);
    return () => window.removeEventListener('scroll', lazyLoadCategories);
  }, [books, loadingCategories]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?query=${encodeURIComponent(search)}`);
    }
  };
  
  const handleBookSelect = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  // Function to generate star rating display
  const renderRating = (rating) => {
    const ratingNum = parseFloat(rating) || 4.5;
    return (
      <BookRating>
        {'★★★★★'.slice(0, Math.floor(ratingNum))}
        {ratingNum % 1 > 0 ? '☆' : ''}
        <span className="count">({ratingNum})</span>
      </BookRating>
    );
  };

  return (
    <Container maxWidth="lg" className="home-container">
      {/* Hero Section with Search */}
      <Box className="hero-section">
        <Typography variant="h1" className="main-heading">
          Read any book in 10 minutes
        </Typography>
        <Typography variant="body1" className="sub-heading">
          73,530 book summaries with audio • 24 languages
          Best for busy folks for a key takeaways
        </Typography>
        
        <Box
          component="form"
          onSubmit={handleSearch}
          className="search-form"
        >
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for book summaries..."
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

      {/* Book Categories */}
      {bookCategories.map((category) => (
        <CategorySection key={category}>
          <SectionHeading variant="h2">
            {category}
            <span className="see-all">See all</span>
          </SectionHeading>
          
          <Grid container spacing={2}>
            {loadingCategories[category] ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 4 }}>
                <CircularProgress size={30} />
              </Box>
            ) : books[category] && books[category].length > 0 ? (
              books[category].map((book) => (
                <Grid item key={book.id} xs={6} sm={4} md={2.4}>
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
                      {renderRating(book.rating || 4.5)}
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
              ))
            ) : (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No books found for this category.
                </Typography>
              </Grid>
            )}
          </Grid>
        </CategorySection>
      ))}
    </Container>
  );
}

export default Home; 