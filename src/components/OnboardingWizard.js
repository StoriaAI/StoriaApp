import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormHelperText,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Autocomplete,
  DialogActions
} from '@mui/material';
import { Close, PhotoCamera, ArrowBack, ArrowForward, Check } from '@mui/icons-material';
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

const OnboardingWizard = () => {
  const { user, setShowOnboarding } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Steps state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

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

  // On component mount, check if we need to pre-populate fields from provider info
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return;
      
      try {
        setInitialLoading(true);
        
        // Check if user already has a profile
        const { data } = await getUserProfile(user.id);
        
        // If user has provider data (like from Google)
        if (user.user_metadata) {
          const metadata = user.user_metadata;
          
          // Pre-populate form with available data from provider
          setFormState(prev => ({
            ...prev,
            firstName: data?.first_name || metadata.full_name?.split(' ')[0] || '',
            lastName: data?.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || '',
            profilePhotoUrl: data?.profile_photo_url || metadata.avatar_url || '',
            // Don't clear other fields if they exist in the database
            country: data?.country || prev.country,
            selectedGenres: data?.preferred_genres || prev.selectedGenres,
            selectedAiFeatures: data?.ai_preferences || prev.selectedAiFeatures
          }));
        } else if (data) {
          // Use data from database if it exists
          setFormState(prev => ({
            ...prev,
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            country: data.country || '',
            profilePhotoUrl: data.profile_photo_url || '',
            selectedGenres: data.preferred_genres || [],
            selectedAiFeatures: data.ai_preferences || []
          }));
        }
      } catch (err) {
        console.error('Error loading user profile data:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    
    checkExistingProfile();
  }, [user]);

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

  // Handle genre selection
  const handleGenreChange = (_, newValue) => {
    // Limit to max 7 selections
    if (newValue.length <= 7) {
      setFormState(prev => ({ ...prev, selectedGenres: newValue }));
      // Clear error if at least 5 genres selected
      if (newValue.length >= 5) {
        setFormErrors(prev => ({ ...prev, selectedGenres: '' }));
      }
    }
  };

  // Handle AI features selection
  const handleAiFeaturesChange = (_, newValue) => {
    // Limit to max 5 selections
    if (newValue.length <= 5) {
      setFormState(prev => ({ ...prev, selectedAiFeatures: newValue }));
    }
  };

  // Validate personal info step
  const validatePersonalInfo = () => {
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
    
    setFormErrors(prev => ({ ...prev, ...errors }));
    return isValid;
  };

  // Validate genre selection step
  const validateGenreSelection = () => {
    const errors = {};
    let isValid = true;
    
    if (formState.selectedGenres.length < 5) {
      errors.selectedGenres = 'Please select at least 5 genres';
      isValid = false;
    }
    
    setFormErrors(prev => ({ ...prev, ...errors }));
    return isValid;
  };

  // Save profile to Supabase
  const saveProfile = async () => {
    try {
      setLoading(true);
      setError('');

      // First upload the image if we have a new one
      let profileImageUrl = formState.profilePhotoUrl;
      
      if (formState.profilePhoto && !profileImageUrl.startsWith('https://')) {
        const fileExt = formState.profilePhoto.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('profile_photos')
          .upload(fileName, formState.profilePhoto);
          
        if (uploadError) throw uploadError;
        
        // Get the URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile_photos')
          .getPublicUrl(fileName);
          
        profileImageUrl = publicUrl;
      }
      
      // Save profile data
      const { error: updateError } = await updateUserProfile(user.id, {
        first_name: formState.firstName,
        last_name: formState.lastName,
        country: formState.country,
        profile_photo_url: profileImageUrl,
        preferred_genres: formState.selectedGenres,
        ai_preferences: formState.selectedAiFeatures,
        has_completed_onboarding: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      if (updateError) throw updateError;
      
      // Close the onboarding wizard
      setShowOnboarding(false);
      
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Error saving your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle next step
  const handleNext = () => {
    // Validate current step
    let isValid = true;
    
    if (activeStep === 0) {
      isValid = validatePersonalInfo();
    } else if (activeStep === 1) {
      isValid = validateGenreSelection();
    }
    
    if (isValid) {
      if (activeStep === 2) {
        // Last step, save everything
        saveProfile();
      } else {
        setActiveStep(prev => prev + 1);
      }
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Handle dialog close attempt
  const handleCloseAttempt = () => {
    // If it's the first sign up, don't allow closing
    // In a real app, you might want to confirm with the user or save progress
    if (activeStep < 2) {
      return;
    }
    
    setShowOnboarding(false);
  };
  
  // If we're still loading data, show a loading state
  if (initialLoading) {
    return (
      <Dialog 
        open={true} 
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, minHeight: 400 }}>
          <CircularProgress size={60} />
        </Box>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={true} 
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      onClose={handleCloseAttempt}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: { xs: 0, sm: 2 },
          margin: { xs: 0, sm: 2 },
          maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' }
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h5" component="h2">
          Welcome to Storia
        </Typography>
        {activeStep === 2 && (
          <IconButton onClick={handleCloseAttempt} size="large">
            <Close />
          </IconButton>
        )}
      </DialogTitle>
      
      <Stepper 
        activeStep={activeStep} 
        alternativeLabel 
        sx={{ 
          px: { xs: 2, sm: 4 },
          py: 2
        }}
      >
        <Step>
          <StepLabel>Personal Info</StepLabel>
        </Step>
        <Step>
          <StepLabel>Book Preferences</StepLabel>
        </Step>
        <Step>
          <StepLabel>AI Features</StepLabel>
        </Step>
      </Stepper>
      
      <DialogContent sx={{ 
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 2, sm: 4 },
      }}>
        {error && (
          <Box sx={{ mb: 3 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}
        
        {/* Step 1: Personal Info */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Tell us about yourself
            </Typography>
            
            <Box sx={{ mb: 3 }}>
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
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Profile Photo (Max 2MB)
              </Typography>
              
              <Box 
                sx={{ 
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'center', sm: 'flex-start' },
                  gap: 2
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
                    position: 'relative'
                  }}
                >
                  {formState.profilePhotoUrl ? (
                    <Box
                      component="img"
                      src={formState.profilePhotoUrl}
                      alt="Profile Preview"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <PhotoCamera fontSize="large" color="action" />
                  )}
                </Box>
                
                <Box sx={{ mt: { xs: 2, sm: 0 } }}>
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
                </Box>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Step 2: Book Genres */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              What type of books do you enjoy?
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Select at least 5 and up to 7 genres that interest you.
            </Typography>
            
            <Autocomplete
              multiple
              id="genre-selector"
              options={BOOK_GENRES}
              value={formState.selectedGenres}
              onChange={handleGenreChange}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Book Genres" 
                  error={!!formErrors.selectedGenres}
                  helperText={formErrors.selectedGenres}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    sx={{ m: 0.5 }}
                  />
                ))
              }
              sx={{ mb: 2 }}
            />
            
            <FormHelperText>
              {formState.selectedGenres.length}/7 genres selected
              {formState.selectedGenres.length < 5 && 
                ` (minimum 5 required)`}
            </FormHelperText>
          </Box>
        )}
        
        {/* Step 3: AI Features */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              AI-Generated Content Preferences
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Select which AI features you'd like to enable (up to 5). You can change these settings later.
            </Typography>
            
            <Autocomplete
              multiple
              id="ai-features-selector"
              options={AI_FEATURES}
              value={formState.selectedAiFeatures}
              onChange={handleAiFeaturesChange}
              renderInput={(params) => (
                <TextField {...params} label="AI Features" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    sx={{ m: 0.5 }}
                  />
                ))
              }
              sx={{ mb: 2 }}
            />
            
            <FormHelperText>
              {formState.selectedAiFeatures.length}/5 features selected (optional)
            </FormHelperText>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        px: { xs: 2, sm: 4 }, 
        pb: { xs: 3, sm: 4 },
        pt: 2
      }}>
        {activeStep > 0 && (
          <Button 
            startIcon={<ArrowBack />} 
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </Button>
        )}
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button
          variant="contained"
          color="primary"
          endIcon={activeStep === 2 ? <Check /> : <ArrowForward />}
          onClick={handleNext}
          disabled={loading}
        >
          {loading ? (
            <>
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
              {activeStep === 2 ? 'Saving...' : 'Next...'}
            </>
          ) : (
            activeStep === 2 ? 'Complete' : 'Next'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingWizard; 