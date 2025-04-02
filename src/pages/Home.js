import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  styled,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Search } from '@mui/icons-material';

const SearchContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(8),
  marginBottom: theme.spacing(4),
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(3),
  },
}));

const BookCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const ResponsiveHeading = styled(Typography)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    fontSize: '2rem',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    fontSize: '2.5rem',
  },
  [theme.breakpoints.up('md')]: {
    fontSize: '3rem',
  },
}));

const ResponsiveSubheading = styled(Typography)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    fontSize: '1rem',
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
}));

function Home() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const fetchBooks = async (searchQuery = '', pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching books from: /api/books?search=${encodeURIComponent(searchQuery)}&page=${pageNum}`);
      
      const response = await fetch(
        `/api/books?search=${encodeURIComponent(searchQuery)}&page=${pageNum}`
      );
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid data format received from server');
      }
      
      setBooks(data.results);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching books:', error);
      setError(`Failed to fetch books: ${error.message}`);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks(search, 1);
  };

  return (
    <Container maxWidth="lg" sx={{ px: isMobile ? 2 : 3 }}>
      <SearchContainer>
        <ResponsiveHeading variant="h1" gutterBottom>
          Hear the Story Come Alive
        </ResponsiveHeading>
        <ResponsiveSubheading variant="h5" color="textSecondary" paragraph>
          Experience books like never before with immersive AI-powered soundscapes
        </ResponsiveSubheading>
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: isMobile ? 2 : 1,
            mt: 4,
            width: '100%',
            maxWidth: '100%',
          }}
        >
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author, or subject..."
            variant="outlined"
            fullWidth
            sx={{ 
              width: '100%', 
              maxWidth: isMobile ? '100%' : 600 
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size={isMobile ? "medium" : "large"}
            startIcon={<Search />}
            fullWidth={isMobile}
            sx={{ 
              minWidth: isMobile ? '100%' : 'auto',
              height: isMobile ? '48px' : 'auto'
            }}
          >
            Search
          </Button>
        </Box>
      </SearchContainer>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={isMobile ? 2 : 4}>
          {books.length === 0 && !loading && !error ? (
            <Grid item xs={12}>
              <Typography variant="h6" textAlign="center" color="textSecondary">
                No books found. Try a different search term.
              </Typography>
            </Grid>
          ) : (
            books.map((book) => (
              <Grid item key={book.id} xs={12} sm={6} md={4} lg={3}>
                <BookCard>
                  <CardMedia
                    component="img"
                    height={isMobile ? "200" : isTablet ? "250" : "300"}
                    image={book.formats['image/jpeg']}
                    alt={book.title}
                    onError={(e) => {
                      e.target.src = '/placeholder-book.jpg';
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography 
                      gutterBottom 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      component="h2"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.3,
                        minHeight: isMobile ? '40px' : '48px'
                      }}
                    >
                      {book.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="textSecondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {book.authors.map((author) => author.name).join(', ')}
                    </Typography>
                  </CardContent>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate(`/book/${book.id}`)}
                    sx={{ 
                      borderTopLeftRadius: 0, 
                      borderTopRightRadius: 0,
                      py: isMobile ? 1 : 1.5
                    }}
                  >
                    Start Reading
                  </Button>
                </BookCard>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Container>
  );
}

export default Home; 