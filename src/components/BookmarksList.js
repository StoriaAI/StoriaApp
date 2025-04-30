import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Paper, 
  IconButton, 
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert
} from '@mui/material';
import { Link } from 'react-router-dom';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getUserBookmarks, deleteBookmark } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const BookmarksList = () => {
  const { user, isAuthenticated } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
          // Group bookmarks by book ID
          const groupedBookmarks = data.reduce((acc, bookmark) => {
            const bookId = bookmark.book_id;
            if (!acc[bookId]) {
              acc[bookId] = [];
            }
            acc[bookId].push(bookmark);
            return acc;
          }, {});
          
          setBookmarks(groupedBookmarks);
        }
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
        setError('Failed to load bookmarks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user, isAuthenticated]);

  const handleDeleteBookmark = async (bookmarkId) => {
    try {
      const { error } = await deleteBookmark(bookmarkId);
      
      if (error) throw error;
      
      // Update local state by removing the deleted bookmark
      setBookmarks(prevBookmarks => {
        const newBookmarks = { ...prevBookmarks };
        
        // Loop through each book's bookmarks
        Object.keys(newBookmarks).forEach(bookId => {
          newBookmarks[bookId] = newBookmarks[bookId].filter(
            bookmark => bookmark.id !== bookmarkId
          );
          
          // Remove the book entry if it has no more bookmarks
          if (newBookmarks[bookId].length === 0) {
            delete newBookmarks[bookId];
          }
        });
        
        return newBookmarks;
      });
    } catch (err) {
      console.error('Error deleting bookmark:', err);
      setError('Failed to delete bookmark. Please try again.');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!isAuthenticated) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Please log in to view your bookmarks.
      </Alert>
    );
  }

  if (Object.keys(bookmarks).length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        You don't have any bookmarks yet. Start reading and bookmark your favorite passages!
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
        Your Bookmarks
      </Typography>
      
      {Object.entries(bookmarks).map(([bookId, bookMarks]) => (
        <Paper key={bookId} sx={{ mb: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {bookMarks[0]?.book_title || `Book ID: ${bookId}`}
            </Typography>
            <Tooltip title="Continue Reading">
              <IconButton 
                component={Link}
                to={`/read/${bookId}?bookmark=latest`}
                aria-label="continue reading"
                sx={{ color: 'white' }}
              >
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <List sx={{ py: 0 }}>
            {bookMarks.map((bookmark, index) => (
              <React.Fragment key={bookmark.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    <Box>
                      <Tooltip title="Go to bookmark">
                        <IconButton 
                          component={Link}
                          to={`/read/${bookmark.book_id}?page=${bookmark.page_number}&bookmark=true`}
                          edge="end" 
                          aria-label="go to bookmark"
                        >
                          <OpenInNewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete bookmark">
                        <IconButton 
                          edge="end" 
                          aria-label="delete" 
                          onClick={() => handleDeleteBookmark(bookmark.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BookmarkIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography component="span" variant="subtitle1" fontWeight="medium">
                          {bookmark.selected_word || 'Page Bookmark'}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          {bookmark.selection_context ? (
                            <>"{bookmark.selection_context.length > 100 
                              ? `${bookmark.selection_context.substring(0, 100)}...` 
                              : bookmark.selection_context}"</>
                          ) : (
                            `Page ${bookmark.page_number + 1}`
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Bookmarked on {formatTimestamp(bookmark.created_at)}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ))}
    </Box>
  );
};

export default BookmarksList; 