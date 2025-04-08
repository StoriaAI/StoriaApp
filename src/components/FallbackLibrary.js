import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Grid,
  Paper
} from '@mui/material';
import { Refresh, Book } from '@mui/icons-material';

const fallbackBooks = [
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    id: 1342
  },
  {
    title: "Frankenstein",
    author: "Mary Shelley",
    id: 84
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    id: 64317
  },
  {
    title: "A Tale of Two Cities",
    author: "Charles Dickens",
    id: 98
  },
  {
    title: "Moby Dick",
    author: "Herman Melville",
    id: 2701
  },
  {
    title: "Dracula",
    author: "Bram Stoker",
    id: 345
  }
];

const FallbackLibrary = ({ onRetry, onBookSelect }) => {
  return (
    <Box>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          backgroundColor: 'rgba(255, 0, 0, 0.05)', 
          borderLeft: '4px solid #f44336'
        }}
      >
        <Typography variant="h6" color="error" gutterBottom>
          Unable to connect to book server
        </Typography>
        <Typography variant="body1" paragraph>
          We're having trouble connecting to our book database. You can try again later or choose from our selection of classic books below.
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<Refresh />} 
          onClick={onRetry}
        >
          Try Again
        </Button>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Popular Classics
      </Typography>
      
      <Grid container spacing={3}>
        {fallbackBooks.map((book) => (
          <Grid item xs={12} sm={6} md={4} key={book.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {book.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {book.author}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<Book />}
                  onClick={() => onBookSelect(book.id)}
                  fullWidth
                >
                  Read Now
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FallbackLibrary; 