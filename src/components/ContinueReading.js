import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  CircularProgress, 
  Card, 
  CardMedia, 
  CardContent,
  Button,
  Menu,
  MenuItem,
  styled,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { useAuth } from '../contexts/AuthContext';
import { getUserBookmarks } from '../lib/supabase';

// Styled components
const SectionHeading = styled(Typography)(({ theme }) => ({
  fontSize: '1.2rem',
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  '& svg': {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  }
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
  paddingTop: '150%', // 2:3 aspect ratio for book covers
  borderRadius: theme.spacing(1),
  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  position: 'relative',
}));

const BookmarkBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: -8,
  right: -8,
  backgroundColor: theme.palette.primary.main,
  borderRadius: '50%',
  width: 24,
  height: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1,
  '& svg': {
    fontSize: '0.875rem',
    color: '#fff',
  }
}));

const BookTitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 500,
  marginTop: theme.spacing(1),
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
}));

const ReadingInfo = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
}));

// Format date to be more readable
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const ContinueReading = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookCardMenuAnchor, setBookCardMenuAnchor] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Fetch user's bookmarks
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const { data, error } = await getUserBookmarks(user.id);
        
        if (error) throw error;
        
        if (data) {
          // Group bookmarks by book and take the most recent bookmark for each book
          const booksByIdMap = data.reduce((acc, bookmark) => {
            if (!acc[bookmark.book_id] || new Date(bookmark.created_at) > new Date(acc[bookmark.book_id].created_at)) {
              acc[bookmark.book_id] = bookmark;
            }
            return acc;
          }, {});
          
          // Convert map to array and sort by most recent
          const recentBookmarks = Object.values(booksByIdMap).sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          
          setBookmarks(recentBookmarks.slice(0, 6)); // Limit to 6 books
        }
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
        setError('Failed to load your reading progress');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookmarks();
  }, [user, isAuthenticated]);
  
  const handleBookClick = (book, event) => {
    setSelectedBook(book);
    setBookCardMenuAnchor(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setBookCardMenuAnchor(null);
  };
  
  const navigateToBook = (bookId, option) => {
    handleMenuClose();
    
    if (option === 'continue') {
      // Navigate to the reader and open at the bookmark location
      navigate(`/read/${bookId}?bookmark=latest`);
    } else {
      // Navigate to the book details page
      navigate(`/book/${bookId}`);
    }
  };
  
  if (!isAuthenticated) return null;
  
  if (loading) {
    return (
      <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ my: 2 }}>
        <Typography color="error" variant="body2">{error}</Typography>
      </Box>
    );
  }
  
  if (bookmarks.length === 0) {
    return null; // Don't show the section if there are no bookmarks
  }
  
  return (
    <Box sx={{ mb: 6 }}>
      <SectionHeading>
        <AutoStoriesIcon />
        Continue Reading
      </SectionHeading>
      
      <Grid container spacing={2}>
        {bookmarks.map((bookmark) => (
          <Grid item xs={6} sm={4} md={2} key={bookmark.id}>
            <BookCard onClick={(e) => handleBookClick(bookmark, e)}>
              <Box sx={{ position: 'relative' }}>
                <BookCover 
                  image={bookmark.book_cover || `https://via.placeholder.com/150x225?text=${bookmark.book_title || 'Book'}`} 
                  title={bookmark.book_title}
                />
                <BookmarkBadge>
                  <BookmarkIcon />
                </BookmarkBadge>
              </Box>
              <CardContent sx={{ p: 1, pb: 1, '&:last-child': { pb: 1 } }}>
                <BookTitle>{bookmark.book_title || `Book ID: ${bookmark.book_id}`}</BookTitle>
                <ReadingInfo>
                  Last read: {formatDate(bookmark.created_at)}
                </ReadingInfo>
              </CardContent>
            </BookCard>
          </Grid>
        ))}
      </Grid>
      
      {/* Book options menu */}
      <Menu
        anchorEl={bookCardMenuAnchor}
        open={Boolean(bookCardMenuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <MenuItem onClick={() => navigateToBook(selectedBook?.book_id, 'continue')}>
          Continue Reading
        </MenuItem>
        <MenuItem onClick={() => navigateToBook(selectedBook?.book_id, 'details')}>
          Read Online
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ContinueReading; 