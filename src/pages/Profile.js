import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  styled,
  IconButton,
  Fade,
  Chip,
  Stack,
  InputAdornment,
  Switch,
  FormControlLabel,
  Badge
} from '@mui/material';
import {
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  AutoStories as AutoStoriesIcon,
  Notifications as NotificationsIcon,
  Edit as EditIcon,
  BookmarkAdded as BookmarkAddedIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Profile.css';
import BookmarksList from '../components/BookmarksList';

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

const LargeAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(18),
  height: theme.spacing(18),
  margin: '0 auto',
  border: `4px solid ${theme.palette.primary.main}`,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  [theme.breakpoints.down('sm')]: {
    width: theme.spacing(14),
    height: theme.spacing(14),
  },
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: theme.spacing(1),
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiOutlinedInput-input': {
    padding: theme.spacing(1.5, 2),
  },
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const BookCard = styled(Card)(({ theme }) => ({
  background: 'rgba(25,25,25,0.7)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  border: '1px solid rgba(255,255,255,0.1)',
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.15)',
  }
}));

function Profile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const fileInputRef = useRef(null);
  
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    bio: '',
    preferredGenres: '',
    notificationSettings: true
  });
  
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  
  // Mock reading history data
  const [readingHistory] = useState([
    {
      id: 1,
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      lastRead: '2023-04-01',
      progress: 78,
      coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
    },
    {
      id: 2,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      lastRead: '2023-03-15',
      progress: 100,
      coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
    },
    {
      id: 3,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      lastRead: '2023-02-20',
      progress: 45,
      coverUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
    }
  ]);

  useEffect(() => {
    if (user) {
      // In a real app, you would fetch the user profile data from your backend
      setProfileData({
        displayName: user.user_metadata?.full_name || '',
        email: user.email || '',
        bio: 'Avid reader and lover of classic literature.',
        preferredGenres: 'Fiction, Mystery, Historical',
        notificationSettings: true
      });
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = name === 'notificationSettings' ? checked : value;
    
    setProfileData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!profileData.displayName.trim()) newErrors.displayName = 'Display name is required';
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(profileData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    setSubmitStatus(null);
    
    // Simulate API call
    setTimeout(() => {
      // In a real app, you would send the updated profile data to your backend
      console.log('Profile updated:', profileData);
      setSubmitStatus('success');
      setLoading(false);
    }, 1500);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAvatarLoading(true);
    
    // Simulate image upload delay
    setTimeout(() => {
      console.log('Avatar changed:', file.name);
      setAvatarLoading(false);
    }, 1500);
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  // Parse genres into array
  const genreArray = profileData.preferredGenres.split(',').map(genre => genre.trim()).filter(Boolean);

  return (
    <Box sx={{ 
      py: { xs: 6, md: 8 },
      backgroundImage: 'linear-gradient(180deg, rgba(10,10,10,0.3) 0%, rgba(0,0,0,0.8) 100%)',
      minHeight: 'calc(100vh - 64px - 120px)'
    }}>
      <Container maxWidth="lg">
        <Fade in={true} timeout={1000}>
          <Box textAlign="center" mb={6}>
            <Typography 
              variant="h1" 
              component="h1" 
              sx={{ 
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 700,
                mb: 2,
                color: theme.palette.primary.main
              }}
            >
              Your Profile
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                maxWidth: '800px', 
                mx: 'auto',
                color: 'rgba(255,255,255,0.8)'
              }}
            >
              Manage your account and reading preferences
            </Typography>
          </Box>
        </Fade>
        
        <Fade in={true} timeout={1000} style={{ transitionDelay: '200ms' }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 3, md: 4 }, 
              mb: 4,
              bgcolor: 'rgba(25,25,25,0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', 
                alignItems: 'center', 
                mb: 4 
              }}
            >
              <Box sx={{ textAlign: 'center', mb: isMobile ? 3 : 0, position: 'relative' }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        color: '#000',
                        '&:hover': {
                          bgcolor: theme.palette.primary.light,
                        },
                        width: '40px',
                        height: '40px'
                      }}
                      onClick={handleAvatarClick}
                    >
                      {avatarLoading ? <CircularProgress size={20} color="inherit" /> : <EditIcon />}
                    </IconButton>
                  }
                >
                  <LargeAvatar 
                    src={user?.user_metadata?.avatar_url}
                    alt={profileData.displayName}
                    onClick={handleAvatarClick}
                    sx={{ cursor: 'pointer' }}
                  >
                    {profileData.displayName ? profileData.displayName.charAt(0).toUpperCase() : 'U'}
                  </LargeAvatar>
                </Badge>
              </Box>
              
              <Box 
                sx={{ 
                  ml: isMobile ? 0 : 4, 
                  flex: 1, 
                  textAlign: isMobile ? 'center' : 'left',
                  mt: isMobile ? 2 : 0
                }}
              >
                <Typography 
                  variant="h3" 
                  gutterBottom 
                  sx={{ 
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    fontSize: { xs: '1.8rem', md: '2.2rem' }
                  }}
                >
                  {profileData.displayName || 'Welcome!'}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'recently'}
                </Typography>
                {genreArray.length > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: isMobile ? 'center' : 'flex-start' }}>
                    {genreArray.map((genre, index) => (
                      <Chip 
                        key={index} 
                        label={genre} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(244, 228, 188, 0.1)',
                          border: '1px solid rgba(244, 228, 188, 0.3)',
                          color: 'white',
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
            
            <Divider sx={{ mb: 4, borderColor: 'rgba(255,255,255,0.1)' }} />
            
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant={isMobile ? "fullWidth" : "standard"}
              centered={!isMobile}
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.primary.main,
                },
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.6)',
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    fontWeight: 600
                  },
                  fontSize: '1rem',
                  textTransform: 'none',
                  py: 1.5
                },
              }}
            >
              <Tab 
                label="Profile Information" 
                icon={<PersonIcon />} 
                iconPosition="start"
              />
              <Tab 
                label="Reading History" 
                icon={<HistoryIcon />} 
                iconPosition="start"
              />
              <Tab 
                label="Bookmarks" 
                icon={<BookmarkAddedIcon />} 
                iconPosition="start"
              />
              <Tab 
                label="Notifications" 
                icon={<NotificationsIcon />} 
                iconPosition="start"
              />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              {submitStatus === 'success' && (
                <Alert 
                  severity="success" 
                  variant="filled"
                  sx={{ 
                    mb: 4,
                    borderRadius: 2,
                    '& .MuiAlert-icon': {
                      display: { xs: 'none', sm: 'flex' }
                    }
                  }}
                >
                  Your profile has been updated successfully!
                </Alert>
              )}
              
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      label="Display Name"
                      name="displayName"
                      value={profileData.displayName}
                      onChange={handleChange}
                      fullWidth
                      required
                      error={!!errors.displayName}
                      helperText={errors.displayName}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      label="Email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleChange}
                      fullWidth
                      required
                      error={!!errors.email}
                      helperText={errors.email}
                      disabled={!user?.app_metadata?.provider === 'email'}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <StyledTextField
                      label="Bio"
                      name="bio"
                      value={profileData.bio}
                      onChange={handleChange}
                      multiline
                      rows={3}
                      fullWidth
                      placeholder="Tell us a bit about yourself and your reading interests..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5, mr: 0.5 }}>
                            <DescriptionIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <StyledTextField
                      label="Preferred Genres"
                      name="preferredGenres"
                      value={profileData.preferredGenres}
                      onChange={handleChange}
                      fullWidth
                      helperText="Separate genres with commas (e.g., Fiction, Mystery, Historical)"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AutoStoriesIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3, 
                        mt: 2,
                        bgcolor: 'rgba(15,15,15,0.6)',
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <NotificationsIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                        <Typography variant="h6">Notification Settings</Typography>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={profileData.notificationSettings}
                            onChange={handleChange}
                            name="notificationSettings"
                            color="primary"
                          />
                        }
                        label="Receive email notifications about new features and updates"
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      disabled={loading}
                      sx={{ 
                        mt: 3,
                        py: 1.2,
                        px: 4,
                        borderRadius: 2,
                        fontWeight: 600,
                        boxShadow: '0 4px 14px rgba(244, 228, 188, 0.4)',
                        '&:hover': {
                          boxShadow: '0 6px 20px rgba(244, 228, 188, 0.6)',
                        }
                      }}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Stack 
                direction="row" 
                alignItems="center" 
                spacing={1} 
                sx={{ 
                  mb: 4,
                  p: 2,
                  bgcolor: 'rgba(15,15,15,0.6)',
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <BookmarkAddedIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Your Reading Journey
                </Typography>
              </Stack>
              
              {readingHistory.length === 0 ? (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    bgcolor: 'rgba(15,15,15,0.4)',
                    borderRadius: 2,
                    border: '1px dashed rgba(255,255,255,0.1)'
                  }}
                >
                  <HistoryIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1, color: 'rgba(255,255,255,0.7)' }}>
                    Your reading history is empty
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Start your reading journey today!
                  </Typography>
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      mt: 3,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2
                      }
                    }}
                    onClick={() => navigate('/books')}
                  >
                    Browse Books
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {readingHistory.map((book) => (
                    <Grid item xs={12} key={book.id}>
                      <BookCard>
                        <CardContent sx={{ p: 3 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={3} sm={2} md={1}>
                              <Box 
                                component="img"
                                src={book.coverUrl}
                                alt={book.title}
                                sx={{
                                  width: '100%',
                                  aspectRatio: '2/3',
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                                }}
                              />
                            </Grid>
                            <Grid item xs={9} sm={6} md={7}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>{book.title}</Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                                by {book.author}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                Last read: {new Date(book.lastRead).toLocaleDateString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    Progress
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                                    {book.progress}%
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    width: '100%',
                                    height: 8,
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 4,
                                    position: 'relative',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      height: '100%',
                                      borderRadius: 4,
                                      background: book.progress === 100
                                        ? `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
                                        : theme.palette.primary.main,
                                      width: `${book.progress}%`,
                                      transition: 'width 1s ease-in-out',
                                    }}
                                  />
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </BookCard>
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Fade in={tabValue === 2}>
                <Box>
                  <BookmarksList />
                </Box>
              </Fade>
            </TabPanel>
            
            <TabPanel value={tabValue} index={3}>
              {/* ... existing notifications tab content ... */}
            </TabPanel>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
}

export default Profile; 