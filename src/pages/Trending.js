import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  styled,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SearchIcon from '@mui/icons-material/Search';

// Styled components
const SearchInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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

const GenreBox = styled(Paper)(({ theme, expanded, color }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1),
  backgroundColor: expanded ? 'rgba(20, 20, 30, 0.6)' : 'rgba(20, 20, 30, 0.5)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  border: `1px solid ${color || 'rgba(255, 255, 255, 0.05)'}`,
  transform: expanded ? 'scale(1)' : 'scale(0.98)',
  '&:hover': {
    boxShadow: `0 8px 16px rgba(0,0,0,0.3), 0 0 20px ${color || 'rgba(244, 228, 188, 0.1)'}`,
    backgroundColor: 'rgba(25, 25, 35, 0.7)',
    border: `1px solid ${color || 'rgba(255, 255, 255, 0.1)'}`,
    transform: 'scale(1)',
    cursor: 'pointer'
  }
}));

const GenreHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 0),
  cursor: 'pointer',
}));

const SeeAllLink = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.primary.main,
  cursor: 'pointer',
  '&:hover': {
    textDecoration: 'underline',
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
  transition: 'transform 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-8px)',
  }
}));

const BookCover = styled(CardMedia)(({ theme }) => ({
  height: 0,
  paddingTop: '150%', // 2:3 aspect ratio
  borderRadius: theme.spacing(1),
  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
}));

const BookPreview = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
  justifyContent: 'flex-start',
  flexWrap: 'nowrap',
  overflow: 'hidden'
}));

const PreviewBookCover = styled(CardMedia)(({ theme }) => ({
  width: 60,
  height: 90,
  borderRadius: theme.spacing(0.5),
  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'translateY(-5px)'
  }
}));

const GenreBackground = styled(Box)(({ theme, color }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  width: '50%',
  height: '100%',
  background: `radial-gradient(circle at right, ${color || 'rgba(244, 228, 188, 0.1)'}, transparent 70%)`,
  opacity: 0.2,
  zIndex: 0
}));

// Featured genres with their respective search terms and theme colors
const FEATURED_GENRES = [
  { 
    name: 'Fiction',
    searchTerm: 'fiction',
    description: 'Timeless literary masterpieces that have stood the test of time',
    icon: <LocalFireDepartmentIcon sx={{ color: '#ff7043' }} />,
    color: 'rgba(255, 112, 67, 0.3)'
  },
  { 
    name: 'Mystery & Detective',
    searchTerm: 'mystery detective',
    description: 'Thrilling tales of intrigue, suspense and crime solving',
    icon: <LocalFireDepartmentIcon sx={{ color: '#ff7043' }} />,
    color: 'rgba(156, 39, 176, 0.3)'
  },
  { 
    name: 'Science Fiction',
    searchTerm: 'science fiction',
    description: 'Futuristic adventures exploring technology and space',
    icon: <LocalFireDepartmentIcon sx={{ color: '#ff7043' }} />,
    color: 'rgba(33, 150, 243, 0.3)'
  },
  { 
    name: 'Romance',
    searchTerm: 'romance love',
    description: 'Stories of love, passion and relationships',
    icon: <LocalFireDepartmentIcon sx={{ color: '#ff7043' }} />,
    color: 'rgba(233, 30, 99, 0.3)'
  },
  { 
    name: 'Adventure',
    searchTerm: 'adventure',
    description: 'Exciting tales of exploration, danger and bravery',
    icon: <LocalFireDepartmentIcon sx={{ color: '#ff7043' }} />,
    color: 'rgba(0, 150, 136, 0.3)'
  },
  { 
    name: 'Historical',
    searchTerm: 'historical history',
    description: 'Stories set in the past, bringing history to life',
    icon: <LocalFireDepartmentIcon sx={{ color: '#ff7043' }} />,
    color: 'rgba(121, 85, 72, 0.3)'
  },
  { 
    name: 'Philosophy',
    searchTerm: 'philosophy',
    description: 'Thought-provoking works exploring ideas and wisdom',
    icon: <LocalFireDepartmentIcon sx={{ color: '#ff7043' }} />,
    color: 'rgba(96, 125, 139, 0.3)'
  },
  { 
    name: 'Horror & Gothic',
    searchTerm: 'horror gothic',
    description: 'Spine-chilling tales of the supernatural and macabre',
    icon: <LocalFireDepartmentIcon sx={{ color: '#ff7043' }} />,
    color: 'rgba(55, 71, 79, 0.3)'
  }
];

function Trending() {
  const [genreBooks, setGenreBooks] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [expandedGenres, setExpandedGenres] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Initialize expanded state for each genre and start loading all genres
  useEffect(() => {
    // Create initial states
    const initialExpandedState = {};
    const initialLoadingState = {};
    
    FEATURED_GENRES.forEach(genre => {
      // All genres collapsed by default
      initialExpandedState[genre.name] = false;
      // Set initial loading state for all genres
      initialLoadingState[genre.name] = true;
    });
    
    setExpandedGenres(initialExpandedState);
    setLoading(initialLoadingState);
    
    // Function to load all genres at once
    const loadAllGenres = async () => {
      try {
        console.log("Starting to load all genres simultaneously");
        
        // Create an array of fetch promises for all genres
        const fetchPromises = FEATURED_GENRES.map(genre => {
          console.log(`Creating fetch promise for genre: ${genre.name}`);
          return fetchGenreBooks(genre);
        });
        
        // Wait for all fetches to complete concurrently
        await Promise.all(fetchPromises);
        console.log(`All genres loaded successfully`);
        
      } catch (error) {
        console.error('Error loading all genres:', error);
      }
    };
    
    // Start loading all genres immediately
    loadAllGenres();
  }, []);

  // Fetch books for a specific genre
  const fetchGenreBooks = async (genre) => {
    // Return cached data if available
    if (genreBooks[genre.name]?.length > 0) {
      console.log(`Using cached data for ${genre.name}`);
      return genreBooks[genre.name];
    }

    try {
      console.log(`Starting fetch for ${genre.name} books`);
      // Set loading state
      setLoading(prev => ({ ...prev, [genre.name]: true }));
      setError(prev => ({ ...prev, [genre.name]: null }));
      
      // Build API URL
      const apiUrl = `/api/books?search=${encodeURIComponent(genre.searchTerm)}&page=1`;
      console.log(`Fetching ${genre.name} books from: ${apiUrl}`);
      
      // Set a timeout to ensure the request doesn't hang indefinitely
      const timeoutId = setTimeout(() => {
        console.warn(`Fetch for ${genre.name} taking too long`);
      }, 10000); // 10 second warning
      
      // Make the API request
      const response = await fetch(apiUrl);
      clearTimeout(timeoutId);
      
      // Check if request was successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Parse the response data
      const data = await response.json();
      
      // Validate response format
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid data format received from server');
      }
      
      console.log(`Received ${data.results.length} books for ${genre.name}`);
      
      // Process and sort the results
      const sortedBooks = [...data.results]
        .filter(book => book.title && book.id && book.formats)
        .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
        .slice(0, 10);
      
      console.log(`Processed ${sortedBooks.length} books for ${genre.name}`);
      
      // Update state with the fetched books
      setGenreBooks(prev => ({
        ...prev,
        [genre.name]: sortedBooks
      }));
      
      // Return the processed books
      return sortedBooks;
      
    } catch (error) {
      console.error(`Error fetching ${genre.name} books:`, error);
      setError(prev => ({
        ...prev,
        [genre.name]: `Failed to load ${genre.name} books: ${error.message}`
      }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, [genre.name]: false }));
    }
  };

  // Toggle expanded state for a genre
  const toggleExpand = (genre) => {
    setExpandedGenres(prev => ({
      ...prev,
      [genre.name]: !prev[genre.name]
    }));
  };

  // Navigate to search page with genre query
  const handleSeeAll = (genre, e) => {
    e.stopPropagation(); // Prevent triggering the toggleExpand
    navigate(`/search?query=${encodeURIComponent(genre.searchTerm)}`);
  };

  // Navigate to book detail page
  const handleBookSelect = (bookId, e) => {
    e.stopPropagation(); // Prevent triggering the toggleExpand
    navigate(`/book/${bookId}`);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
      {/* Search Bar */}
      <Box sx={{ mb: 4, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ width: '100%', maxWidth: '600px' }}
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

      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            mb: 2, 
            fontWeight: 600,
            fontSize: { xs: '1.8rem', sm: '2.5rem' } 
          }}
        >
          Trending Books
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: '700px', mx: 'auto', color: 'text.secondary' }}>
          Discover the most popular classic books across different genres, 
          based on download counts and reader popularity.
        </Typography>
      </Box>

      {/* Genre sections */}
      <Grid container spacing={3}>
        {FEATURED_GENRES.map((genre) => {
          const isExpanded = expandedGenres[genre.name];
          const books = genreBooks[genre.name] || [];
          const previewBooks = books.slice(0, 3);
          
          return (
            <Grid item xs={12} md={isExpanded ? 12 : 6} key={genre.name}>
              <GenreBox 
                onClick={() => toggleExpand(genre)}
                expanded={isExpanded}
                color={genre.color}
                sx={{ 
                  height: isExpanded ? 'auto' : 'auto', 
                  transition: 'all 0.3s ease' 
                }}
              >
                <GenreBackground color={genre.color} />
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <GenreHeader>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {genre.icon}
                      <Typography 
                        variant="h5" 
                        component="h2" 
                        sx={{ 
                          ml: 1, 
                          fontWeight: 600,
                          fontSize: { xs: '1.2rem', sm: '1.5rem' } 
                        }}
                      >
                        {genre.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SeeAllLink onClick={(e) => handleSeeAll(genre, e)}>
                        See all
                      </SeeAllLink>
                      <IconButton 
                        size="small" 
                        color="primary"
                        aria-expanded={isExpanded}
                        aria-label="show more"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(genre);
                        }}
                        sx={{ ml: 1 }}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  </GenreHeader>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 2 }}
                  >
                    {genre.description}
                  </Typography>
                  
                  {/* Preview of books (shown when not expanded) */}
                  {!isExpanded && !loading[genre.name] && books.length > 0 && (
                    <BookPreview>
                      {previewBooks.map((book, index) => (
                        <Box 
                          key={book.id} 
                          onClick={(e) => handleBookSelect(book.id, e)}
                          sx={{ 
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.05)'
                            }
                          }}
                        >
                          <PreviewBookCover
                            image={book.formats['image/jpeg'] || '/placeholder-book.jpg'}
                            title={book.title}
                            onError={(e) => {
                              e.target.src = '/placeholder-book.jpg';
                            }}
                          />
                        </Box>
                      ))}
                      {books.length > 3 && (
                        <Box 
                          sx={{ 
                            width: 60, 
                            height: 90, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: theme.spacing(0.5),
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontWeight: 'bold'
                          }}
                        >
                          +{books.length - 3}
                        </Box>
                      )}
                    </BookPreview>
                  )}
                  
                  {/* Expanded view with all books */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ pt: 1 }}>
                      <Divider sx={{ my: 2, opacity: 0.2 }} />
                      
                      {loading[genre.name] ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress size={40} />
                        </Box>
                      ) : error[genre.name] ? (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          {error[genre.name]}
                        </Alert>
                      ) : books.length === 0 ? (
                        <Box sx={{ py: 2, textAlign: 'center' }}>
                          <Typography variant="body2">
                            No books found for this genre.
                          </Typography>
                        </Box>
                      ) : (
                        <Grid container spacing={2}>
                          {books.map((book, index) => (
                            <Grid item key={book.id} xs={6} sm={4} md={2} lg={isExpanded ? 2 : 3}>
                              <BookCard onClick={(e) => handleBookSelect(book.id, e)}>
                                <BookCover
                                  image={book.formats['image/jpeg'] || '/placeholder-book.jpg'}
                                  title={book.title}
                                  onError={(e) => {
                                    e.target.src = '/placeholder-book.jpg';
                                  }}
                                />
                                <CardContent sx={{ px: 0, py: 1 }}>
                                  <Typography
                                    variant="caption"
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
                                    sx={{ display: 'block', fontSize: '0.7rem' }}
                                  >
                                    {book.download_count?.toLocaleString() || 0} downloads
                                  </Typography>
                                </CardContent>
                              </BookCard>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              </GenreBox>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}

export default Trending; 