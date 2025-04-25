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
  const fetchCategoryBooks = async (category) => {
    try {
      setLoadingCategories(prev => ({ ...prev, [category]: true }));
      
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
      setBooks(prev => ({
        ...prev,
        [category]: validResults.slice(0, 4)
      }));
      
    } catch (error) {
      console.error(`Error fetching ${category} books:`, error);
      // Don't use fallbacks - show error state directly
      setBooks(prev => ({
        ...prev,
        [category]: []
      }));
    } finally {
      setLoadingCategories(prev => ({ ...prev, [category]: false }));
    }
  };

  useEffect(() => {
    // Fetch all categories at once when component mounts
    bookCategories.forEach(category => {
      fetchCategoryBooks(category);
    });
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