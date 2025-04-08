import React, { useState, useEffect } from 'react';
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
  styled
} from '@mui/material';
import {
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Profile.css';

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
  boxShadow: theme.shadows[3],
  [theme.breakpoints.down('sm')]: {
    width: theme.spacing(12),
    height: theme.spacing(12),
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

function Profile() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  
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
  
  // Mock reading history data
  const [readingHistory] = useState([
    {
      id: 1,
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      lastRead: '2023-04-01',
      progress: 78
    },
    {
      id: 2,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      lastRead: '2023-03-15',
      progress: 100
    },
    {
      id: 3,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      lastRead: '2023-02-20',
      progress: 45
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
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
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

  const handleAvatarChange = () => {
    // In a real app, this would open a file picker and upload the new avatar
    console.log('Changing avatar');
  };

  return (
    <Container maxWidth="lg" sx={{ px: isMobile ? 2 : 3, mb: { xs: 8, md: 8 }, mt: 8, flex: '1 0 auto' }}>
      <Box textAlign="center" mb={6}>
        <ResponsiveHeading variant="h1" gutterBottom>
          Your Profile
        </ResponsiveHeading>
        <Typography variant="h5" color="textSecondary">
          Manage your account and preferences
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', mb: 4 }}>
          <Box sx={{ textAlign: 'center', mb: isMobile ? 3 : 0 }}>
            <LargeAvatar src={user?.user_metadata?.avatar_url} alt={profileData.displayName}>
              {profileData.displayName ? profileData.displayName.charAt(0).toUpperCase() : 'U'}
            </LargeAvatar>
            <Button
              startIcon={<PhotoCameraIcon />}
              sx={{ mt: 2 }}
              onClick={handleAvatarChange}
            >
              Change Photo
            </Button>
          </Box>
          
          <Box sx={{ ml: isMobile ? 0 : 4, flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
            <Typography variant="h3" gutterBottom color="primary">
              {profileData.displayName || 'Welcome!'}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'recently'}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? "fullWidth" : "standard"}
          centered={!isMobile}
        >
          <Tab label="Profile Information" />
          <Tab label="Reading History" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          {submitStatus === 'success' && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Your profile has been updated successfully!
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Display Name"
                  name="displayName"
                  value={profileData.displayName}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.displayName}
                  helperText={errors.displayName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
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
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Preferred Genres"
                  name="preferredGenres"
                  value={profileData.preferredGenres}
                  onChange={handleChange}
                  fullWidth
                  helperText="Separate genres with commas (e.g., Fiction, Mystery, Historical)"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <HistoryIcon sx={{ mr: 1 }} />
            Your Reading History
          </Typography>
          
          {readingHistory.length === 0 ? (
            <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
              You haven't read any books yet. Start your reading journey today!
            </Typography>
          ) : (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {readingHistory.map((book) => (
                <Grid item xs={12} key={book.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={8}>
                          <Typography variant="h6">{book.title}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            by {book.author}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Last read: {new Date(book.lastRead).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="body2" color="textSecondary" align="right">
                              Progress: {book.progress}%
                            </Typography>
                            <Box
                              sx={{
                                mt: 1,
                                width: '100%',
                                height: 8,
                                bgcolor: 'rgba(244, 228, 188, 0.2)',
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
                                  bgcolor: 'primary.main',
                                  width: `${book.progress}%`,
                                }}
                              />
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default Profile; 