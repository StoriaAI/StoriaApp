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
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    setFormState(prev => ({ 
      ...prev, 
      profilePhoto: file,
      profilePhotoUrl: previewUrl
    }));
    
    // Clear any error
    setFormErrors(prev => ({ ...prev, profilePhoto: '' }));
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
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      // First upload the image if we have a new one
      let profileImageUrl = formState.profilePhotoUrl;
      
      if (formState.profilePhoto && !profileImageUrl.startsWith('https://')) {
        const fileExt = formState.profilePhoto.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile_photos')
          .upload(fileName, formState.profilePhoto);
          
        if (uploadError) throw uploadError;
        
        // Get the URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile_photos')
          .getPublicUrl(fileName);
          
        profileImageUrl = publicUrl;
      }
      
      // Check for duplicate profiles and clean them up
      try {
        console.log('Checking for duplicate profiles for user:', user.id);
        const { data: existingProfiles, error: queryError } = await supabase
          .from('user_profiles')
          .select('id, created_at')
          .eq('user_id', user.id);
          
        if (!queryError && existingProfiles && existingProfiles.length > 1) {
          console.log(`Found ${existingProfiles.length} duplicate profiles for user ${user.id}, cleaning up...`);
          
          // Keep only the most recently created profile
          const sortedProfiles = [...existingProfiles].sort((a, b) => {
            // Sort by created_at or id if no created_at
            const dateA = a.created_at ? new Date(a.created_at) : 0;
            const dateB = b.created_at ? new Date(b.created_at) : 0;
            return dateB - dateA; // descending order (most recent first)
          });
          
          // Remove all but the most recent profile
          const profilesToDelete = sortedProfiles.slice(1).map(p => p.id);
          
          if (profilesToDelete.length > 0) {
            const { error: deleteError } = await supabase
              .from('user_profiles')
              .delete()
              .in('id', profilesToDelete);
              
            if (deleteError) {
              console.error('Error deleting duplicate profiles:', deleteError.message);
            } else {
              console.log(`Successfully deleted ${profilesToDelete.length} duplicate profiles`);
            }
          }
        }
      } catch (cleanupError) {
        console.error('Error during profile cleanup:', cleanupError);
        // Continue with the profile update even if cleanup fails
      }
      
      // Check if the user already has a profile
      const { data: existingProfile } = await getUserProfile(user.id);
      const isNewUser = !existingProfile;
      
      // Save profile data
      const { error: updateError } = await updateUserProfile(user.id, {
        first_name: formState.firstName,
        last_name: formState.lastName,
        country: formState.country,
        profile_photo_url: profileImageUrl,
        preferred_genres: formState.selectedGenres,
        ai_preferences: formState.selectedAiFeatures,
        has_completed_onboarding: true,
        created_at: isNewUser ? new Date().toISOString() : existingProfile.created_at,
        updated_at: new Date().toISOString()
      });
      
      if (updateError) throw updateError;
      
      // Update the needsProfile state to false since profile is now completed
      if (needsProfile) {
        setNeedsProfile(false);
      }
      
      setSuccessMessage('Profile updated successfully!');
      
      // If user was redirected here because they needed to complete their profile,
      // redirect them back to homepage after a short delay
      if (needsProfile) {
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Error saving your profile. Please try again.');
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {needsProfile ? 'Complete Your Profile' : 'Your Profile'}
      </Typography>
      
      {needsProfile && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please complete your profile information to continue using Storia.
        </Alert>
      )}
      
      <Divider sx={{ mb: 4 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={5000} 
        onClose={handleCloseSuccessMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccessMessage} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: isMobile ? 2 : 4, 
          borderRadius: 2,
          mb: 4
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Personal Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4} 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'flex-start'
            }}
          >
            <Box
              sx={{
                width: 150,
                height: 150,
                borderRadius: '50%',
                border: '1px dashed',
                borderColor: formErrors.profilePhoto ? 'error.main' : 'divider',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                bgcolor: 'background.default',
                position: 'relative',
                mb: 2
              }}
            >
              {formState.profilePhotoUrl ? (
                <Avatar
                  src={formState.profilePhotoUrl}
                  alt="Profile Preview"
                  sx={{
                    width: '100%',
                    height: '100%'
                  }}
                />
              ) : (
                <PhotoCamera fontSize="large" color="action" />
              )}
            </Box>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCamera />}
              sx={{ mb: 1 }}
            >
              Upload Photo
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            
            {formErrors.profilePhoto && (
              <Typography color="error" variant="body2">
                {formErrors.profilePhoto}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formState.firstName}
              onChange={handleChange}
              error={!!formErrors.firstName}
              helperText={formErrors.firstName}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formState.lastName}
              onChange={handleChange}
              error={!!formErrors.lastName}
              helperText={formErrors.lastName}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Country"
              name="country"
              value={formState.country}
              onChange={handleChange}
              error={!!formErrors.country}
              helperText={formErrors.country}
              margin="normal"
              required
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: isMobile ? 2 : 4, 
          borderRadius: 2,
          mb: 4
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Book Preferences
        </Typography>
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Select at least 5 and up to 7 genres that interest you.
        </Typography>
        
        {formErrors.selectedGenres && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {formErrors.selectedGenres}
          </Typography>
        )}
        
        <Box sx={{ maxHeight: '400px', overflow: 'auto', pb: 2 }}>
          <Grid container spacing={1}>
            {BOOK_GENRES.map((genre) => (
              <Grid item xs={12} sm={6} md={4} key={genre}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    bgcolor: formState.selectedGenres.includes(genre) 
                      ? 'rgba(156, 39, 176, 0.1)' 
                      : 'background.paper',
                    border: 1,
                    borderColor: formState.selectedGenres.includes(genre)
                      ? 'primary.main'
                      : 'divider',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'rgba(156, 39, 176, 0.05)',
                    }
                  }}
                  onClick={() => handleGenreToggle(genre)}
                >
                  <Checkbox 
                    checked={formState.selectedGenres.includes(genre)}
                    color="primary"
                    size="small"
                    sx={{ p: 0.5, mr: 1 }}
                  />
                  <Typography variant="body2">{genre}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        <FormHelperText>
          {formState.selectedGenres.length}/7 genres selected
          {formState.selectedGenres.length < 5 && 
            ` (minimum 5 required)`}
        </FormHelperText>
      </Paper>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: isMobile ? 2 : 4, 
          borderRadius: 2,
          mb: 4
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          AI Content Preferences
        </Typography>
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Select which AI features you'd like to enable (up to 5).
        </Typography>
        
        <Grid container spacing={2}>
          {AI_FEATURES.map((feature) => (
            <Grid item xs={12} sm={6} key={feature}>
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  bgcolor: formState.selectedAiFeatures.includes(feature) 
                    ? 'rgba(156, 39, 176, 0.1)' 
                    : 'background.paper',
                  border: 1,
                  borderColor: formState.selectedAiFeatures.includes(feature)
                    ? 'primary.main'
                    : 'divider',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'rgba(156, 39, 176, 0.05)',
                  }
                }}
                onClick={() => handleAiFeatureToggle(feature)}
              >
                <Checkbox 
                  checked={formState.selectedAiFeatures.includes(feature)}
                  color="primary"
                  sx={{ mr: 1 }}
                />
                <Typography>{feature}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        
        <FormHelperText sx={{ mt: 2 }}>
          {formState.selectedAiFeatures.length}/5 features selected (optional)
        </FormHelperText>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
          onClick={saveProfile}
          disabled={loading}
          sx={{ px: 4, py: 1 }}
        >
          {loading ? 'Saving...' : (needsProfile ? 'Complete Profile' : 'Save Profile')}
        </Button>
      </Box>
    </Container>
  );
};

export default ProfilePage; 