import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Button,
  Grid,
  useTheme,
  useMediaQuery,
  Fade
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  return (
    <Box sx={{ 
      py: { xs: 6, md: 10 },
      backgroundImage: 'linear-gradient(180deg, rgba(10,10,10,0.3) 0%, rgba(0,0,0,0.7) 100%)',
      minHeight: 'calc(100vh - 64px - 120px)'
    }}>
      <Container maxWidth="lg">
        <Fade in={true} timeout={1000}>
          <Typography 
            variant="h1" 
            component="h1" 
            sx={{ 
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              mb: { xs: 5, md: 8 },
              textAlign: 'center',
              fontWeight: 700,
              color: '#f4e4bc',
            }}
          >
            Business Model
          </Typography>
        </Fade>
        
        <Grid container spacing={4}>
          {/* User Experience */}
          <Grid item xs={12} md={4}>
            <Fade in={true} timeout={1000} style={{ transitionDelay: '100ms' }}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  bgcolor: 'rgba(25,25,25,0.6)',
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 20px -10px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }
                }}
              >
                <Typography 
                  variant="h5" 
                  component="h2" 
                  sx={{ 
                    mb: 4, 
                    textAlign: 'center',
                    py: 1.5,
                    backgroundColor: 'rgba(35,35,35,0.8)',
                    borderRadius: 2,
                    color: '#f4e4bc',
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                >
                  User Experience
                </Typography>
                
                <List sx={{ flexGrow: 1, py: 2 }}>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CheckCircleOutlineIcon sx={{ color: theme.palette.primary.main }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography sx={{ fontWeight: 500, fontSize: '1.05rem' }}>
                          Access to <Box component="span" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>10,000+ books</Box> completely free
                        </Typography>
                      } 
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CheckCircleOutlineIcon sx={{ color: theme.palette.primary.main }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography sx={{ fontWeight: 500, fontSize: '1.05rem' }}>
                          Experience Soundscapes: Ad-based model (Ads displayed after every 3 soundscapes)
                        </Typography>
                      } 
                    />
                  </ListItem>
                </List>
              </Paper>
            </Fade>
          </Grid>
          
          {/* Subscription Plans */}
          <Grid item xs={12} md={4}>
            <Fade in={true} timeout={1000} style={{ transitionDelay: '200ms' }}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  bgcolor: 'rgba(25,25,25,0.6)',
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  position: 'relative',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 20px -10px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }
                }}
              >
                <Typography 
                  variant="h5" 
                  component="h2" 
                  sx={{ 
                    mb: 4, 
                    textAlign: 'center',
                    py: 1.5,
                    backgroundColor: 'rgba(35,35,35,0.8)',
                    borderRadius: 2,
                    color: '#f4e4bc',
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                >
                  Subscription Plans
                </Typography>
                
                <Box sx={{ 
                  p: 3, 
                  mb: 3, 
                  bgcolor: 'rgba(30,30,30,0.9)', 
                  color: '#f4e4bc', 
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(244, 228, 188, 0.1)'
                }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      color: '#f4e4bc',
                      fontWeight: 700,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>Book Enthusiast Plan</span>
                    <Box component="span" sx={{ fontSize: '1.1rem', color: '#f4e4bc' }}>
                      $30<Box component="span" sx={{ fontSize: '0.9rem', opacity: 0.8 }}>/month</Box>
                    </Box>
                  </Typography>
                  
                  <List sx={{ py: 0 }}>
                    <ListItem sx={{ px: 0, py: 0.75 }}>
                      <ListItemIcon sx={{ minWidth: 32, color: '#f4e4bc' }}>
                        <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#f4e4bc' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography variant="body1" color="#f4e4bc" fontWeight={500}>
                            Add up to <strong>3 books</strong> to your Book Board
                          </Typography>
                        } 
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0, py: 0.75 }}>
                      <ListItemIcon sx={{ minWidth: 32, color: '#f4e4bc' }}>
                        <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#f4e4bc' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography variant="body1" color="#f4e4bc" fontWeight={500}>
                            Books on the board are locked in for the month
                          </Typography>
                        } 
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0, py: 0.75 }}>
                      <ListItemIcon sx={{ minWidth: 32, color: '#f4e4bc' }}>
                        <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#f4e4bc' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography variant="body1" color="#f4e4bc" fontWeight={500}>
                            <strong>Unlimited ambiance generations</strong> for those 3 books
                          </Typography>
                        } 
                      />
                    </ListItem>
                  </List>
                </Box>
                
                <Box sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(30,30,30,0.9)', 
                  color: '#f4e4bc', 
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  border: '1px solid rgba(244, 228, 188, 0.1)'
                }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      color: '#f4e4bc',
                      fontWeight: 700,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>Bibliophile Plan</span>
                    <Box component="span" sx={{ fontSize: '1.1rem', color: '#f4e4bc' }}>
                      $50<Box component="span" sx={{ fontSize: '0.9rem', opacity: 0.8 }}>/month</Box>
                    </Box>
                  </Typography>
                  
                  <List sx={{ py: 0 }}>
                    <ListItem sx={{ px: 0, py: 0.75 }}>
                      <ListItemIcon sx={{ minWidth: 32, color: '#f4e4bc' }}>
                        <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#f4e4bc' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography variant="body1" color="#f4e4bc" fontWeight={500}>
                            <strong>No limits</strong> – Generate ambiance for <strong>any number of books</strong>
                          </Typography>
                        } 
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0, py: 0.75 }}>
                      <ListItemIcon sx={{ minWidth: 32, color: '#f4e4bc' }}>
                        <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#f4e4bc' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography variant="body1" color="#f4e4bc" fontWeight={500}>
                            Full access to Storia's immersive experience
                          </Typography>
                        } 
                      />
                    </ListItem>
                  </List>
                </Box>
                
                <Box sx={{ mt: 'auto', pt: 4, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    sx={{ 
                      px: 4, 
                      py: 1.5, 
                      borderRadius: '30px',
                      fontWeight: 600,
                      fontSize: '1rem',
                      boxShadow: '0 4px 14px rgba(244, 228, 188, 0.4)',
                      '&:hover': {
                        boxShadow: '0 6px 20px rgba(244, 228, 188, 0.6)',
                      }
                    }}
                  >
                    Subscribe Now
                  </Button>
                </Box>
              </Paper>
            </Fade>
          </Grid>
          
          {/* For Authors */}
          <Grid item xs={12} md={4}>
            <Fade in={true} timeout={1000} style={{ transitionDelay: '300ms' }}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  bgcolor: 'rgba(25,25,25,0.6)',
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 20px -10px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }
                }}
              >
                <Typography 
                  variant="h5" 
                  component="h2" 
                  sx={{ 
                    mb: 4, 
                    textAlign: 'center',
                    py: 1.5,
                    backgroundColor: 'rgba(35,35,35,0.8)',
                    borderRadius: 2,
                    color: '#f4e4bc',
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                >
                  For Authors
                </Typography>
                
                <List sx={{ flexGrow: 1, py: 2 }}>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CheckCircleOutlineIcon sx={{ color: theme.palette.primary.main }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography sx={{ fontWeight: 500, fontSize: '1.05rem' }}>
                          <Box component="span" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>One-time listing fee</Box> per book to feature in the Spotlight section
                        </Typography>
                      } 
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CheckCircleOutlineIcon sx={{ color: theme.palette.primary.main }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography sx={{ fontWeight: 500, fontSize: '1.05rem' }}>
                          Readers pay to access your book, <Box component="span" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>80% of the revenue</Box> goes to the author
                        </Typography>
                      } 
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CheckCircleOutlineIcon sx={{ color: theme.palette.primary.main }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography sx={{ fontWeight: 500, fontSize: '1.05rem' }}>
                          <Box component="span" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>No additional charges</Box> for ambiance generations—fully included for the reader
                        </Typography>
                      } 
                    />
                  </ListItem>
                </List>
                
                <Box sx={{ mt: 'auto', pt: 4, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="outlined" 
                    size="large"
                    sx={{ 
                      px: 4, 
                      py: 1.5, 
                      borderRadius: '30px',
                      fontWeight: 600,
                      fontSize: '1rem',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        backgroundColor: 'rgba(244, 228, 188, 0.1)'
                      }
                    }}
                    onClick={() => navigate('/contact')}
                  >
                    Contact Us
                  </Button>
                </Box>
              </Paper>
            </Fade>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Pricing; 