import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  TextField,
  Grid,
  Alert,
  Snackbar,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  Notifications, 
  Palette, 
  Lock, 
  Visibility, 
  Delete, 
  Save 
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      newFeatures: true,
      marketing: false,
      soundscapeUpdates: true
    },
    preferences: {
      fontFamily: 'Inter',
      fontSize: 16,
      theme: 'dark',
      highContrast: false,
      autoPlaySoundscapes: true
    },
    privacy: {
      profileVisibility: 'public',
      shareReadingStats: true,
      allowRecommendations: true
    },
    account: {
      email: user?.email || '',
      password: '',
      confirmPassword: ''
    }
  });

  // Simulate fetching user settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, you'd fetch the settings from your backend
      // For now, we'll just use the default settings
      
      setLoading(false);
    };

    fetchSettings();
  }, [user]);

  const handleNotificationChange = (event) => {
    const { name, checked } = event.target;
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: checked
      }
    }));
  };

  const handlePreferenceChange = (event) => {
    const { name, value, checked, type } = event.target;
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handlePrivacyChange = (event) => {
    const { name, value, checked, type } = event.target;
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleFontSizeChange = (event, newValue) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        fontSize: newValue
      }
    }));
  };

  const handleAccountChange = (event) => {
    const { name, value } = event.target;
    setSettings(prev => ({
      ...prev,
      account: {
        ...prev.account,
        [name]: value
      }
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Show success notification
    setNotification({
      open: true,
      message: 'Settings saved successfully!',
      severity: 'success'
    });
    
    setSaving(false);
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 'calc(100vh - 200px)' 
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography 
        variant="h1" 
        component="h1" 
        sx={{ 
          fontSize: { xs: '2rem', md: '2.5rem' },
          mb: 4,
          fontWeight: 700,
          color: theme.palette.primary.main
        }}
      >
        Settings
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {/* Notification Settings */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              mb: 4, 
              bgcolor: 'rgba(25,25,25,0.6)',
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Notifications sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h5" component="h2" fontWeight={600}>
                Notification Settings
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.notifications.emailNotifications}
                  onChange={handleNotificationChange}
                  name="emailNotifications"
                  color="primary"
                />
              }
              label="Email notifications"
              sx={{ display: 'block', mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.notifications.newFeatures}
                  onChange={handleNotificationChange}
                  name="newFeatures"
                  color="primary"
                />
              }
              label="New features and updates"
              sx={{ display: 'block', mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.notifications.marketing}
                  onChange={handleNotificationChange}
                  name="marketing"
                  color="primary"
                />
              }
              label="Marketing and promotional emails"
              sx={{ display: 'block', mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.notifications.soundscapeUpdates}
                  onChange={handleNotificationChange}
                  name="soundscapeUpdates"
                  color="primary"
                />
              }
              label="New soundscape availability for your books"
              sx={{ display: 'block' }}
            />
          </Paper>
          
          {/* Appearance & Preferences */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              mb: 4, 
              bgcolor: 'rgba(25,25,25,0.6)',
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Palette sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h5" component="h2" fontWeight={600}>
                Appearance & Preferences
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Font Family
              </Typography>
              <FormControl fullWidth variant="outlined" size="small">
                <Select
                  value={settings.preferences.fontFamily}
                  onChange={handlePreferenceChange}
                  name="fontFamily"
                  sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                >
                  <MenuItem value="Inter">Inter</MenuItem>
                  <MenuItem value="Roboto">Roboto</MenuItem>
                  <MenuItem value="Open Sans">Open Sans</MenuItem>
                  <MenuItem value="Merriweather">Merriweather</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Font Size: {settings.preferences.fontSize}px
              </Typography>
              <Slider
                value={settings.preferences.fontSize}
                onChange={handleFontSizeChange}
                min={12}
                max={24}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Theme
              </Typography>
              <FormControl fullWidth variant="outlined" size="small">
                <Select
                  value={settings.preferences.theme}
                  onChange={handlePreferenceChange}
                  name="theme"
                  sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                >
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="system">Follow System</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.preferences.highContrast}
                  onChange={handlePreferenceChange}
                  name="highContrast"
                  color="primary"
                />
              }
              label="High contrast mode"
              sx={{ display: 'block', mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.preferences.autoPlaySoundscapes}
                  onChange={handlePreferenceChange}
                  name="autoPlaySoundscapes"
                  color="primary"
                />
              }
              label="Auto-play soundscapes when reading"
              sx={{ display: 'block' }}
            />
          </Paper>
          
          {/* Privacy Settings */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              mb: 4, 
              bgcolor: 'rgba(25,25,25,0.6)',
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Visibility sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h5" component="h2" fontWeight={600}>
                Privacy Settings
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Profile Visibility
              </Typography>
              <FormControl fullWidth variant="outlined" size="small">
                <Select
                  value={settings.privacy.profileVisibility}
                  onChange={handlePrivacyChange}
                  name="profileVisibility"
                  sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                >
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="friends">Friends Only</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.privacy.shareReadingStats}
                  onChange={handlePrivacyChange}
                  name="shareReadingStats"
                  color="primary"
                />
              }
              label="Share my reading statistics"
              sx={{ display: 'block', mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={settings.privacy.allowRecommendations}
                  onChange={handlePrivacyChange}
                  name="allowRecommendations"
                  color="primary"
                />
              }
              label="Allow personalized recommendations"
              sx={{ display: 'block' }}
            />
          </Paper>
          
          {/* Account Settings */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              bgcolor: 'rgba(25,25,25,0.6)',
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Lock sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h5" component="h2" fontWeight={600}>
                Account Settings
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <TextField
              label="Email Address"
              value={settings.account.email}
              onChange={handleAccountChange}
              name="email"
              fullWidth
              variant="outlined"
              margin="normal"
              disabled={user?.app_metadata?.provider === 'google'}
              helperText={user?.app_metadata?.provider === 'google' ? 'Email managed by Google' : ''}
              sx={{ mb: 2 }}
            />
            
            <TextField
              label="New Password"
              value={settings.account.password}
              onChange={handleAccountChange}
              name="password"
              fullWidth
              variant="outlined"
              margin="normal"
              type="password"
              disabled={user?.app_metadata?.provider === 'google'}
              helperText={user?.app_metadata?.provider === 'google' ? 'Password managed by Google' : ''}
              sx={{ mb: 2 }}
            />
            
            <TextField
              label="Confirm New Password"
              value={settings.account.confirmPassword}
              onChange={handleAccountChange}
              name="confirmPassword"
              fullWidth
              variant="outlined"
              margin="normal"
              type="password"
              disabled={user?.app_metadata?.provider === 'google'}
              sx={{ mb: 3 }}
            />
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<Delete />}
                sx={{ borderWidth: 2, '&:hover': { borderWidth: 2 } }}
              >
                Delete Account
              </Button>
              
              <Button 
                variant="contained" 
                color="primary" 
                onClick={saveSettings}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              mb: 4, 
              bgcolor: 'rgba(25,25,25,0.6)',
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.1)',
              position: 'sticky',
              top: 80
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Settings Help
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body2" paragraph sx={{ color: 'text.secondary' }}>
              Customize your Storia experience with these settings. Changes are saved automatically and will be applied to all your devices.
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
              Notification Settings
            </Typography>
            <Typography variant="body2" paragraph sx={{ color: 'text.secondary' }}>
              Control which notifications you receive. You can always unsubscribe from emails directly.
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
              Appearance & Preferences
            </Typography>
            <Typography variant="body2" paragraph sx={{ color: 'text.secondary' }}>
              Customize how Storia looks and works for you. Font settings affect the reading experience.
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
              Privacy Settings
            </Typography>
            <Typography variant="body2" paragraph sx={{ color: 'text.secondary' }}>
              Control who can see your profile and how your data is used for recommendations.
            </Typography>
            
            <Box sx={{ mt: 4, p: 2, bgcolor: 'rgba(244, 228, 188, 0.1)', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main }}>
                Need help?
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                If you have questions about your settings or account, please contact our support team.
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                sx={{ mt: 2 }}
                onClick={() => window.location.href = '/contact'}
              >
                Contact Support
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings; 