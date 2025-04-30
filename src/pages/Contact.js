import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  styled,
  Fade,
  InputAdornment
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Subject as SubjectIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import '../styles/Contact.css';

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

const ContactInfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

const FormTextField = styled(TextField)(({ theme }) => ({
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

function Contact() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    
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
      // In a real app, you would send the data to your backend
      console.log('Form submitted:', formData);
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <Box sx={{ 
      py: { xs: 6, md: 8 },
      backgroundImage: 'linear-gradient(180deg, rgba(10,10,10,0.3) 0%, rgba(0,0,0,0.8) 100%)',
      minHeight: 'calc(100vh - 64px - 120px)'
    }}>
      <Container maxWidth="lg">
        <Fade in={true} timeout={1000}>
          <Box textAlign="center" mb={{ xs: 6, md: 8 }}>
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
              Contact Us
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                maxWidth: '800px', 
                mx: 'auto',
                color: 'rgba(255,255,255,0.8)'
              }}
            >
              We'd love to hear from you — reach out with any questions or feedback
            </Typography>
          </Box>
        </Fade>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Fade in={true} timeout={1000} style={{ transitionDelay: '200ms' }}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 3, md: 4 }, 
                  height: '100%',
                  bgcolor: 'rgba(25,25,25,0.6)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }
                }}
              >
                <Typography 
                  variant="h3" 
                  component="h2" 
                  gutterBottom 
                  sx={{ 
                    fontSize: { xs: '1.8rem', md: '2.2rem' },
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    mb: 3
                  }}
                >
                  Get in Touch
                </Typography>
                
                <Typography variant="body1" paragraph sx={{ color: 'rgba(255,255,255,0.8)', mb: 3 }}>
                  Have questions about Storia? Want to share your experience? 
                  We're here to help with any inquiries about our service.
                </Typography>
                
                <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
                
                <ContactInfoItem>
                  <IconButton 
                    sx={{ 
                      mr: 2, 
                      bgcolor: 'rgba(244, 228, 188, 0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(244, 228, 188, 0.2)'
                      }
                    }}
                  >
                    <EmailIcon color="primary" />
                  </IconButton>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Joinstoria@gmail.com
                    </Typography>
                  </Box>
                </ContactInfoItem>
                
                <ContactInfoItem>
                  <IconButton 
                    sx={{ 
                      mr: 2, 
                      bgcolor: 'rgba(244, 228, 188, 0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(244, 228, 188, 0.2)'
                      }
                    }}
                  >
                    <PhoneIcon color="primary" />
                  </IconButton>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Phone
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      +1 (555) 123-4567
                    </Typography>
                  </Box>
                </ContactInfoItem>
                
                <ContactInfoItem sx={{ mb: 0 }}>
                  <IconButton 
                    sx={{ 
                      mr: 2, 
                      bgcolor: 'rgba(244, 228, 188, 0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(244, 228, 188, 0.2)'
                      }
                    }}
                  >
                    <LocationIcon color="primary" />
                  </IconButton>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Address
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      1600 Pennsylvania Avenue NW · Washington, D.C. 20500 · U.S.A
                    </Typography>
                  </Box>
                </ContactInfoItem>
              </Paper>
            </Fade>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Fade in={true} timeout={1000} style={{ transitionDelay: '300ms' }}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 3, md: 4 },
                  bgcolor: 'rgba(25,25,25,0.6)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }
                }}
              >
                <Typography 
                  variant="h3" 
                  component="h2" 
                  gutterBottom 
                  sx={{ 
                    fontSize: { xs: '1.8rem', md: '2.2rem' },
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    mb: 3
                  }}
                >
                  Send a Message
                </Typography>
                
                {submitStatus === 'success' && (
                  <Alert 
                    severity="success" 
                    variant="filled"
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        display: { xs: 'none', sm: 'flex' }
                      }
                    }}
                  >
                    Thank you for your message! We'll get back to you soon.
                  </Alert>
                )}
                
                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <FormTextField
                        label="Your Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errors.name}
                        helperText={errors.name}
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
                      <FormTextField
                        label="Your Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errors.email}
                        helperText={errors.email}
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
                      <FormTextField
                        label="Subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errors.subject}
                        helperText={errors.subject}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SubjectIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormTextField
                        label="Your Message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        multiline
                        rows={6}
                        fullWidth
                        required
                        error={!!errors.message}
                        helperText={errors.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5, mr: 0.5 }}>
                              <MessageIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={loading}
                        endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        sx={{ 
                          py: 1.5, 
                          px: 4,
                          borderRadius: 2,
                          fontWeight: 600
                        }}
                      >
                        {loading ? 'Sending...' : 'Send Message'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Fade>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Contact; 