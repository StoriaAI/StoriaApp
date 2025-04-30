import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
  FormHelperText,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Grid,
  Chip,
  Paper,
  Avatar,
  Divider,
  Alert,
  Snackbar,
  Checkbox
} from '@mui/material';
import { PhotoCamera, Check, Save } from '@mui/icons-material';
import { supabase, updateUserProfile, getUserProfile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Available book genres
const BOOK_GENRES = [
  'Science fiction', 'Short stories', 'Psychological fiction', 'Adventure', 'Stories', 
  'Love stories', 'Historical fiction', 'Horror', 'Tales', 'Fiction', 
  'Gothic fiction', 'Humorous stories', 'Detective and mystery stories', 
  'Fantasy fiction', 'Drama', 'Fairy tales', 'Children\'s stories', 'Poetry', 
  'War stories', 'Satire', 'Ethics', 'Classical literature', 
  'Autobiographical fiction', 'Western stories', 'Fantasy', 'Literature', 
  'Sabotage', 'Paranormal fiction', 'Encyclopedias and dictionaries', 
  'Essays', 'English poetry', 'American poetry', 'Romances', 
  'Christmas stories', 'Mystery fiction', 'Ghost stories', 'Philosophy', 
  'Epic literature', 'Erotic stories', 'Periodicals', 'Young adult fiction', 
  'English drama', 'Dime novels', 'Economics', 'Religion', 'Mythology', 'Folklore'
];

// AI features options
const AI_FEATURES = [
  'Music generation',
  'Alternative endings',
  'Image generation',
  'Summarization',
  'Video generation'
];

const ProfilePage = () => {
  const { user, needsProfile, setNeedsProfile } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    country: '',
    profilePhoto: null,
    profilePhotoUrl: '',
    selectedGenres: [],
    selectedAiFeatures: []
  });

  // File input ref
  const fileInputRef = useRef(null);

  // Form validation state
  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    country: '',
    profilePhoto: '',
    selectedGenres: ''
  });

  // On component mount, check if we need to pre-populate fields from existing profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        setInitialLoading(true);
        
        // Check if user already has a profile
        const { data } = await getUserProfile(user.id);
        
        // If user has provider data (like from Google)
        if (user.user_metadata) {
          const metadata = user.user_metadata;
          
          // Pre-populate form with available data from provider and existing profile
          setFormState(prev => ({
            ...prev,
            firstName: data?.first_name || metadata.full_name?.split(' ')[0] || prev.firstName || '',
            lastName: data?.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || prev.lastName || '',
            profilePhotoUrl: data?.profile_photo_url || metadata.avatar_url || prev.profilePhotoUrl || '',
            country: data?.country || prev.country || '',
            selectedGenres: data?.preferred_genres || prev.selectedGenres || [],
            selectedAiFeatures: data?.ai_preferences || prev.selectedAiFeatures || []
          }));
        } else if (data) {
          // Use data from database if it exists
          setFormState(prev => ({
            ...prev,
            firstName: data.first_name || prev.firstName || '',
            lastName: data.last_name || prev.lastName || '',
            country: data.country || prev.country || '',
            profilePhotoUrl: data.profile_photo_url || prev.profilePhotoUrl || '',
            selectedGenres: data.preferred_genres || prev.selectedGenres || [],
            selectedAiFeatures: data.ai_preferences || prev.selectedAiFeatures || []
          }));
        }
      } catch (err) {
        console.error('Error loading user profile data:', err);
        setError('Failed to load your profile. Please try again later.');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user, navigate]);

  // Handle form field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    // Clear error when field is updated
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, profilePhoto: 'File size must be less than 2MB' }));
      return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setFormErrors(prev => ({ ...prev, profilePhoto: 'Please upload a valid image file (JPEG, PNG, GIF)' }));
      return;
    }
    
    try {
      // Show loading state
      setLoading(true);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Update state immediately to show the new image
      setFormState(prev => ({ 
        ...prev, 
        profilePhoto: file,
        profilePhotoUrl: previewUrl
      }));
      
      // Clear any error
      setFormErrors(prev => ({ ...prev, profilePhoto: '' }));
      
      // Wait a moment to allow the UI to update, giving immediate visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Upload file to storage if needed
      // This is just a placeholder for where you might handle the actual file upload
      // const { fileUrl } = await uploadProfilePhoto(file, user.id);
      // setFormState(prev => ({ ...prev, profilePhotoUrl: fileUrl }));
      
    } catch (err) {
      console.error('Error handling file:', err);
      setError('There was a problem processing your image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle genre selection with checkboxes
  const handleGenreToggle = (genre) => {
    setFormState(prev => {
      const currentGenres = [...prev.selectedGenres];
      
      if (currentGenres.includes(genre)) {
        // Remove genre if already selected
        const updatedGenres = currentGenres.filter(g => g !== genre);
        return { ...prev, selectedGenres: updatedGenres };
      } else {
        // Add genre if not already selected and under the limit of 7
        if (currentGenres.length < 7) {
          const updatedGenres = [...currentGenres, genre];
          return { ...prev, selectedGenres: updatedGenres };
        }
        return prev; // Already at max selections
      }
    });
    
    // Clear error if at least 5 genres selected
    if (formState.selectedGenres.length >= 4) { // Will be 5 after toggling
      setFormErrors(prev => ({ ...prev, selectedGenres: '' }));
    }
  };

  // Handle AI features selection with checkboxes
  const handleAiFeatureToggle = (feature) => {
    setFormState(prev => {
      const currentFeatures = [...prev.selectedAiFeatures];
      
      if (currentFeatures.includes(feature)) {
        // Remove feature if already selected
        const updatedFeatures = currentFeatures.filter(f => f !== feature);
        return { ...prev, selectedAiFeatures: updatedFeatures };
      } else {
        // Add feature if not already selected and under the limit of 5
        if (currentFeatures.length < 5) {
          const updatedFeatures = [...currentFeatures, feature];
          return { ...prev, selectedAiFeatures: updatedFeatures };
        }
        return prev; // Already at max selections
      }
    });
  };

  // Validate all required fields
  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    if (!formState.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }
    
    if (!formState.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }
    
    if (!formState.country.trim()) {
      errors.country = 'Country is required';
      isValid = false;
    }
    
    // Only require profile photo if one isn't already provided from OAuth
    if (!formState.profilePhoto && !formState.profilePhotoUrl) {
      errors.profilePhoto = 'Profile photo is required';
      isValid = false;
    }
    
    if (formState.selectedGenres.length < 5) {
      errors.selectedGenres = 'Please select at least 5 genres';
      isValid = false;
    }
    
    setFormErrors(prev => ({ ...prev, ...errors }));
    return isValid;
  };

  // Save profile to Supabase
  const saveProfile = async () => {
    // First, validate the form
    const isValid = validateForm();
    if (!isValid) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Get form data
      const { firstName, lastName, country, profilePhoto, selectedGenres, selectedAiFeatures } = formState;
      
      // Prepare profile data object
      const profileData = {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        country,
        preferred_genres: selectedGenres,
        ai_preferences: selectedAiFeatures
      };
      
      // If there's a new profile photo, upload it
      if (profilePhoto && profilePhoto instanceof File) {
        // 1. Create a unique filename
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        // 2. Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('profile-photos')
          .upload(fileName, profilePhoto, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) throw uploadError;
        
        // 3. Get the public URL
        const { data: urlData } = supabase
          .storage
          .from('profile-photos')
          .getPublicUrl(fileName);
        
        // 4. Set the profile photo URL
        profileData.profile_photo_url = urlData.publicUrl;
      } else if (formState.profilePhotoUrl) {
        // Use existing URL if available
        profileData.profile_photo_url = formState.profilePhotoUrl;
      }
      
      // Update profile in database
      const { data, error } = await updateUserProfile(profileData);
      
      if (error) throw error;
      
      // Profile successfully updated
      setSuccessMessage('Profile updated successfully!');
      
      // Mark that user has completed profile setup if needed
      if (needsProfile) {
        setNeedsProfile(false);
        
        // Redirect to home page after short delay for success message
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle close of success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage('');
  };

  if (initialLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography 
        variant="h1" 
        component="h1" 
        sx={{ 
          fontSize: { xs: '2rem', md: '2.5rem' },
          mb: 4,
          textAlign: 'center',
          fontWeight: 700,
          color: theme.palette.primary.main
        }}
      >
        {needsProfile ? 'Complete Your Profile' : 'Edit Your Profile'}
      </Typography>
      
      {initialLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 4 }, 
          mb: 4, 
          borderRadius: 3,
          bgcolor: 'rgba(25,25,25,0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Display any errors */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {/* Display success message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Profile Photo */}
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={formState.profilePhotoUrl || ''}
                alt={`${formState.firstName} ${formState.lastName}`}
                sx={{ 
                  width: 150, 
                  height: 150,
                  mb: 2,
                  border: '4px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
              />
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="profile-photo-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <label htmlFor="profile-photo-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  sx={{ mt: 1 }}
                  disabled={loading}
                >
                  {formState.profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
                </Button>
              </label>
              {formErrors.profilePhoto && (
                <FormHelperText error>{formErrors.profilePhoto}</FormHelperText>
              )}
            </Box>
          </Grid>
          
          {/* Basic Info */}
          <Grid item xs={12} sm={8}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                Basic Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="First Name"
                    name="firstName"
                    value={formState.firstName}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    required
                    error={!!formErrors.firstName}
                    helperText={formErrors.firstName}
                    disabled={loading}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last Name"
                    name="lastName"
                    value={formState.lastName}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    required
                    error={!!formErrors.lastName}
                    helperText={formErrors.lastName}
                    disabled={loading}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>
              
              <TextField
                label="Country"
                name="country"
                value={formState.country}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                required
                error={!!formErrors.country}
                helperText={formErrors.country}
                disabled={loading}
                sx={{ mb: 2 }}
              />
            </Box>
          </Grid>
          
          {/* Genre Selection Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              Book Preferences
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Select up to 7 genres that you enjoy reading. This helps us personalize your experience.
            </Typography>
            
            {formErrors.selectedGenres && (
              <FormHelperText error sx={{ mb: 2 }}>{formErrors.selectedGenres}</FormHelperText>
            )}
            
            <Box sx={{ mb: 3 }}>
              <Box component="div" sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1,
                maxHeight: '200px',
                overflowY: 'auto',
                p: 1,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                },
              }}>
                {BOOK_GENRES.map((genre) => (
                  <Chip
                    key={genre}
                    label={genre}
                    clickable
                    onClick={() => handleGenreToggle(genre)}
                    color={formState.selectedGenres.includes(genre) ? 'primary' : 'default'}
                    variant={formState.selectedGenres.includes(genre) ? 'filled' : 'outlined'}
                    sx={{ 
                      m: 0.5,
                      transition: 'all 0.2s ease',
                      borderWidth: formState.selectedGenres.includes(genre) ? 0 : 1,
                      '&:hover': {
                        backgroundColor: formState.selectedGenres.includes(genre) 
                          ? theme.palette.primary.main 
                          : 'rgba(244, 228, 188, 0.1)',
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Grid>
          
          {/* AI Features Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              AI Features
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Select which AI features you'd like to enable (up to 5). You can change these settings later.
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {AI_FEATURES.map((feature) => (
                  <Chip
                    key={feature}
                    label={feature}
                    clickable
                    onClick={() => handleAiFeatureToggle(feature)}
                    color={formState.selectedAiFeatures.includes(feature) ? 'primary' : 'default'}
                    variant={formState.selectedAiFeatures.includes(feature) ? 'filled' : 'outlined'}
                    sx={{ 
                      m: 0.5,
                      transition: 'all 0.2s ease',
                      borderWidth: formState.selectedAiFeatures.includes(feature) ? 0 : 1,
                      '&:hover': {
                        backgroundColor: formState.selectedAiFeatures.includes(feature) 
                          ? theme.palette.primary.main 
                          : 'rgba(244, 228, 188, 0.1)',
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={saveProfile}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
            sx={{ 
              px: 4,
              py: 1.2,
              borderRadius: 2,
              fontWeight: 600 
            }}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </Box>
      </Paper>
      )}
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfilePage; 