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
} from '@mui/material';
import { Search } from '@mui/icons-material';

const SearchContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(8),
  marginBottom: theme.spacing(4),
  textAlign: 'center',
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

function Home() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchBooks = async (searchQuery = '', pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `http://localhost:3001/api/books?search=${encodeURIComponent(searchQuery)}&page=${pageNum}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid data format received from server');
      }
      
      setBooks(data.results);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching books:', error);
      setError('Failed to fetch books. Please try again later.');
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
    <Container>
      <SearchContainer>
        <Typography variant="h1" gutterBottom>
          Hear the Story Come Alive
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph>
          Experience books like never before with immersive AI-powered soundscapes
        </Typography>
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            mt: 4,
          }}
        >
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author, or subject..."
            variant="outlined"
            sx={{ width: '100%', maxWidth: 600 }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<Search />}
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
        <Grid container spacing={4}>
          {books.length === 0 && !loading && !error ? (
            <Grid item xs={12}>
              <Typography variant="h6" textAlign="center" color="textSecondary">
                No books found. Try a different search term.
              </Typography>
            </Grid>
          ) : (
            books.map((book) => (
              <Grid item key={book.id} xs={12} sm={6} md={4}>
                <BookCard>
                  <CardMedia
                    component="img"
                    height="300"
                    image={book.formats['image/jpeg']}
                    alt={book.title}
                    onError={(e) => {
                      e.target.src = '/placeholder-book.jpg';
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="h2">
                      {book.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {book.authors.map((author) => author.name).join(', ')}
                    </Typography>
                  </CardContent>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate(`/book/${book.id}`)}
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