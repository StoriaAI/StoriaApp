import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  Stack,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import BookIcon from '@mui/icons-material/Book';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import LanguageIcon from '@mui/icons-material/Language';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import DevicesIcon from '@mui/icons-material/Devices';
import HtmlIcon from '@mui/icons-material/Html';
import DataObjectIcon from '@mui/icons-material/DataObject';
import ImageIcon from '@mui/icons-material/Image';
import CategoryIcon from '@mui/icons-material/Category';

// Format mapping with icons and file extensions
const FORMAT_MAP = {
  'application/epub+zip': { 
    name: 'EPUB', 
    icon: <AutoStoriesIcon />, 
    extension: '.epub',
    description: 'Most e-readers and apps'
  },
  'application/x-mobipocket-ebook': { 
    name: 'Kindle', 
    icon: <LocalLibraryIcon />, 
    extension: '.mobi',
    description: 'Amazon Kindle devices'
  },
  'application/pdf': { 
    name: 'PDF', 
    icon: <PictureAsPdfIcon />, 
    extension: '.pdf',
    description: 'Fixed layout format'
  },
  'text/plain': { 
    name: 'Plain Text', 
    icon: <TextSnippetIcon />, 
    extension: '.txt',
    description: 'Universal compatibility'
  },
  'text/plain; charset=utf-8': { 
    name: 'UTF-8 Text', 
    icon: <TextSnippetIcon />, 
    extension: '.txt',
    description: 'Unicode text format'
  },
  'text/plain; charset=us-ascii': { 
    name: 'ASCII Text', 
    icon: <TextSnippetIcon />, 
    extension: '.txt',
    description: 'Basic ASCII format'
  },
  'text/plain; charset=iso-8859-1': { 
    name: 'ISO Text', 
    icon: <TextSnippetIcon />, 
    extension: '.txt',
    description: 'Latin alphabet text'
  },
  'text/html': { 
    name: 'HTML', 
    icon: <HtmlIcon />, 
    extension: '.html',
    description: 'Web browser format'
  },
  'text/html; charset=utf-8': { 
    name: 'UTF-8 HTML', 
    icon: <HtmlIcon />, 
    extension: '.html',
    description: 'Unicode web format'
  },
  'application/rdf+xml': { 
    name: 'RDF', 
    icon: <DataObjectIcon />, 
    extension: '.rdf',
    description: 'Metadata format'
  },
  'application/zip': { 
    name: 'ZIP Archive', 
    icon: <CloudDownloadIcon />, 
    extension: '.zip',
    description: 'Compressed archive'
  }
};

function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [rawBook, setRawBook] = useState(null); // Store the raw response
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableFormats, setAvailableFormats] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        setLoading(true);
        
        // Call the books API with the specific book ID
        const response = await fetch(`/api/books?id=${id}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching book details: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.results || !data.results.length) {
          throw new Error('Book not found');
        }
        
        // Set the book data
        setBook(data.results[0]);
        
        // Fetch raw data directly from Gutendex to get all formats and subjects
        const rawResponse = await fetch(`https://gutendex.com/books?ids=${id}`);
        if (rawResponse.ok) {
          const rawData = await rawResponse.json();
          if (rawData.results && rawData.results.length) {
            setRawBook(rawData.results[0]);
            
            // Process available formats
            const formats = [];
            for (const [mimeType, url] of Object.entries(rawData.results[0].formats)) {
              if (FORMAT_MAP[mimeType] && !url.includes('cover') && !url.includes('small')) {
                formats.push({
                  mimeType,
                  url,
                  ...FORMAT_MAP[mimeType]
                });
              }
            }
            
            // Sort formats by relevance
            formats.sort((a, b) => {
              const order = ['application/epub+zip', 'application/x-mobipocket-ebook', 'application/pdf'];
              return order.indexOf(a.mimeType) - order.indexOf(b.mimeType);
            });
            
            setAvailableFormats(formats);
          }
        }
      } catch (error) {
        console.error('Error fetching book details:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookDetails();
  }, [id]);

  const handleReadOnline = () => {
    navigate(`/book/read/${id}`);
  };

  const handleDownload = (format) => {
    if (!format || !format.url) return;
    
    // Generate a filename based on the book title and format extension
    let fileName = book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + format.extension;
    
    // Create a hidden anchor element for download
    const a = document.createElement('a');
    a.href = format.url;
    a.download = fileName;
    a.target = '_blank'; // Open in new tab if browser doesn't download automatically
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const goBack = () => {
    navigate(-1);
  };

  // Get subjects from the raw book data
  const getSubjects = () => {
    if (!rawBook || !rawBook.subjects) return [];
    return rawBook.subjects;
  };

  // Get languages in a readable format
  const getLanguages = () => {
    if (!rawBook || !rawBook.languages) return ['English'];
    
    // Map language codes to full names
    const languageMap = {
      'en': 'English',
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ar': 'Arabic',
      'la': 'Latin',
      'gr': 'Greek'
    };
    
    return rawBook.languages.map(code => languageMap[code] || code.toUpperCase());
  };

  // Render loading state
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
          Return Home
        </Button>
      </Container>
    );
  }

  const subjects = getSubjects();
  const languages = getLanguages();

  // Render book details
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ maxWidth: '1100px', mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={goBack}
            sx={{ 
              color: 'text.primary',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
            }}
          >
            Back
          </Button>
        </Box>
        
        <Grid container spacing={isMobile ? 3 : 5}>
          {/* Left Column - Book Cover */}
          <Grid item xs={12} sm={5} md={4}>
            <Card 
              elevation={0} 
              sx={{ 
                height: '100%', 
                background: 'transparent',
                maxWidth: '350px',
                mx: 'auto'
              }}
            >
              <CardMedia
                component="img"
                image={book.formats['image/jpeg'] || '/placeholder-book.jpg'}
                alt={book.title}
                sx={{ 
                  width: '100%',
                  borderRadius: 2,
                  boxShadow: 3,
                  mb: 2
                }}
                onError={(e) => {
                  e.target.src = '/placeholder-book.jpg';
                }}
              />
              
              <Typography variant="h3" component="h1" sx={{ 
                fontSize: '2rem', 
                fontWeight: 600,
                mb: 1,
                display: { xs: 'block', sm: 'none' } 
              }}>
                {book.title}
              </Typography>
              
              <Typography sx={{ 
                color: 'text.secondary',
                mb: 3,
                display: { xs: 'block', sm: 'none' } 
              }}>
                by {book.authors && book.authors.length > 0 
                  ? book.authors.map(author => author.name).join(', ') 
                  : 'Unknown Author'}
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 2, 
                    display: 'flex', 
                    alignItems: 'center',
                    fontWeight: 600
                  }}
                >
                  <LanguageIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                  Language: 
                  <Box component="span" sx={{ ml: 1, color: 'primary.main' }}>
                    {languages.join(', ')}
                  </Box>
                </Typography>
                
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    fontWeight: 600
                  }}
                >
                  <CloudDownloadIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                  Downloads: <Box component="span" sx={{ ml: 1, color: 'primary.main' }}>{book.download_count?.toLocaleString() || '0'}</Box>
                </Typography>
              </Box>
            </Card>
          </Grid>
          
          {/* Right Column - Book Details */}
          <Grid item xs={12} sm={7} md={8}>
            <Box sx={{ height: '100%' }}>
              <Typography variant="h3" component="h1" sx={{ 
                fontSize: '2rem', 
                fontWeight: 600,
                mb: 1,
                display: { xs: 'none', sm: 'block' } 
              }}>
                {book.title}
              </Typography>
              
              <Typography sx={{ 
                color: 'text.secondary',
                mb: 3,
                display: { xs: 'none', sm: 'block' } 
              }}>
                by {book.authors && book.authors.length > 0 
                  ? book.authors.map(author => author.name).join(', ') 
                  : 'Unknown Author'}
              </Typography>
              
              {/* Subjects/Tags */}
              {subjects.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ 
                    mb: 1, 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <CategoryIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                    Subjects:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {subjects.map((subject, index) => (
                      <Chip 
                        key={index} 
                        label={subject} 
                        variant="outlined" 
                        size="small"
                        sx={{ 
                          borderRadius: 1,
                          color: 'primary.main',
                          borderColor: 'rgba(244, 228, 188, 0.3)', 
                        }}
                        onClick={() => navigate(`/search?query=${encodeURIComponent(subject)}`)}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* Start Reading Section */}
              <Box sx={{ mb: 5 }}>
                <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
                  Start Reading
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<MenuBookIcon />}
                  onClick={handleReadOnline}
                  fullWidth={isMobile}
                  sx={{ 
                    borderRadius: 6,
                    py: 1.5,
                    backgroundColor: 'primary.main',
                    color: '#000',
                    '&:hover': {
                      backgroundColor: '#e4d4ac'
                    }
                  }}
                >
                  Read Online
                </Button>
              </Box>
              
              {/* Download Options Section */}
              <Box>
                <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
                  Download Options
                </Typography>
                {availableFormats.length > 0 ? (
                  <Grid container spacing={2}>
                    {availableFormats.map((format, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Tooltip title={format.description || ''} arrow>
                          <Button
                            variant="outlined"
                            fullWidth
                            startIcon={format.icon}
                            onClick={() => handleDownload(format)}
                            sx={{ 
                              borderRadius: 6,
                              py: 1.5,
                              borderColor: 'rgba(244, 228, 188, 0.3)',
                              color: 'primary.main',
                              '&:hover': {
                                borderColor: 'primary.main',
                                backgroundColor: 'rgba(244, 228, 188, 0.1)'
                              }
                            }}
                          >
                            {format.name}
                          </Button>
                        </Tooltip>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="info">
                    No download formats available for this book.
                  </Alert>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default BookDetail; 