import React, { useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  styled,
  Avatar,
  Card,
  CardContent,
  Stack,
  Button,
  Fade
} from '@mui/material';
import { 
  AutoStories, 
  Headphones, 
  Lightbulb, 
  Group, 
  Psychology,
  EmojiObjects
} from '@mui/icons-material';
import '../styles/About.css';

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  background: 'rgba(25,25,25,0.7)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  border: '1px solid rgba(255,255,255,0.1)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.15)',
  }
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 52,
  height: 52,
  borderRadius: '50%',
  backgroundColor: 'rgba(244, 228, 188, 0.15)',
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main
}));

const TeamMember = styled(Card)(({ theme }) => ({
  background: 'rgba(25,25,25,0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
  }
}));

const StorySection = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(6, 0),
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.8) 100%)',
    zIndex: -1,
  }
}));

function About() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const team = [
    {
      name: 'Shivang Thakor',
      role: 'Founder and CEO',
      bio: 'Bachelors in Business Analytics. Posse Foundation Scholar. 1st-Generation College Graduate. Ex - DS at Cummins.',
      avatar: 'src\Assets\Shivang Thakor.png',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Notre_Dame_Fighting_Irish_logo.svg/1200px-Notre_Dame_Fighting_Irish_logo.svg.png'
    },
    {
      name: 'Raj Mehta',
      role: 'Co-Founder and CTO',
      bio: 'Masters in Information Systems. Bachelors in Computer Science. Ex - DE at Fidelity Investments.',
      avatar: 'src\Assets\Raj Mehta.png',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/NU_RGB_seal_R.png/640px-NU_RGB_seal_R.png'
    },
    {
      name: 'Shivam Patel',
      role: 'Co-Founder and Lead Engineer',
      bio: 'Bachelors in Computer Science. 1st Generation College Graduate. Ex - Tech Associate at Geek Squad.',
      avatar: 'src\Assets\Shivam Patel.png',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/LSU_Athletics_logo.svg/640px-LSU_Athletics_logo.svg.png'
    }
  ];
  
  const features = [
    {
      title: 'Adaptive Soundscapes',
      description: 'Our AI generates unique audio environments that adjust to the tone and context of your reading in real-time.',
      icon: <Headphones fontSize="medium" />
    },
    {
      title: 'Extensive Library',
      description: 'Access thousands of books with custom-tailored soundscapes across all genres and reading preferences.',
      icon: <AutoStories fontSize="medium" />
    },
    {
      title: 'Personalization',
      description: 'Fine-tune your experience with customizable audio settings that adapt to your unique reading style.',
      icon: <Psychology fontSize="medium" />
    },
    {
      title: 'Innovative Technology',
      description: 'Our proprietary algorithms analyze text semantics to create the perfect audio accompaniment.',
      icon: <EmojiObjects fontSize="medium" />
    }
  ];
  
  useEffect(() => {
    const storyTextEl = document.getElementById('our-story-text');
    if (storyTextEl) {
      const storyParagraphs = storyTextEl.querySelectorAll('p');
      if (storyParagraphs.length >= 2) {
        storyParagraphs[1].textContent = 'Our journey started in 2023, when our founder Shivang Thakor envisioned a platform that could transform how people interact with books. He assembled a talented team with Raj Mehta and Shivam Patel to build technology that could analyze text and generate contextual soundscapes in real-time.';
      }
    }
  }, []);

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
              About Storia
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                maxWidth: '800px', 
                mx: 'auto',
                color: 'rgba(255,255,255,0.8)'
              }}
            >
              Revolutionizing reading through immersive soundscapes that bring literature to life
            </Typography>
          </Box>
        </Fade>
        
        {/* Mission Section */}
        <Fade in={true} timeout={1000} style={{ transitionDelay: '200ms' }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 3, md: 5 }, 
              mb: 6, 
              borderRadius: 3,
              background: 'rgba(25,25,25,0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={7}>
                <Typography 
                  variant="h3" 
                  component="h2" 
                  gutterBottom 
                  sx={{ 
                    fontSize: { xs: '1.8rem', md: '2.5rem' },
                    fontWeight: 700,
                    color: theme.palette.primary.main
                  }}
                >
                  Our Mission
                </Typography>
                <Typography variant="body1" paragraph>
                  Storia is dedicated to transforming the reading experience by seamlessly blending 
                  literature with immersive audio environments. We believe that books should engage 
                  all your senses, creating a deeper connection with the stories you love.
                </Typography>
                <Typography variant="body1" paragraph>
                  Our cutting-edge AI technology analyzes text in real-time to generate adaptive 
                  soundscapes that perfectly complement what you're reading, enhancing immersion without 
                  distracting from the content. With Storia, you don't just read a story—you experience it.
                </Typography>
                <Box mt={3}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    sx={{ 
                      borderRadius: 2,
                      px: 4,
                      py: 1.2,
                      fontWeight: 600
                    }}
                    onClick={() => window.location.href = '/pricing'}
                  >
                    Explore Plans
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box 
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2
                  }}
                >
                  <Box 
                    component="img"
                    src="https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                    alt="Book with headphones"
                    sx={{
                      width: '100%',
                      maxWidth: '400px',
                      borderRadius: 3,
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Fade>
        
        {/* Features Section */}
        <Fade in={true} timeout={1000} style={{ transitionDelay: '300ms' }}>
          <Box sx={{ mb: 8 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              align="center" 
              gutterBottom
              sx={{ 
                mb: 5,
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                fontWeight: 700
              }}
            >
              What Makes Us Unique
            </Typography>
            
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <FeatureCard>
                    <IconWrapper>
                      {feature.icon}
                    </IconWrapper>
                    <Typography 
                      variant="h5" 
                      component="h3" 
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      {feature.description}
                    </Typography>
                  </FeatureCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>
        
        {/* Our Story Section */}
        <Fade in={true} timeout={1000} style={{ transitionDelay: '400ms' }}>
          <StorySection sx={{ mb: 8 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              align="center" 
              gutterBottom
              sx={{ 
                mb: 4,
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                fontWeight: 700
              }}
            >
              Our Story
            </Typography>
            
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 3, md: 5 }, 
                borderRadius: 3,
                background: 'rgba(25,25,25,0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
              id="our-story-text"
            >
              <Typography variant="body1" paragraph>
                Storia began with a simple question: what if books could be more immersive? Founded by 
                a team of literature enthusiasts and technology innovators, we set out to create a 
                platform that would bridge the gap between traditional reading and modern digital experiences.
              </Typography>
              <Typography variant="body1" paragraph>
                Our journey started in 2023, when our founder Shivang Thakor envisioned a platform that could transform how people interact with books. He assembled a talented team with Raj Mehta and Shivam Patel to build technology that could analyze text and generate contextual soundscapes in real-time.
              </Typography>
              <Typography variant="body1">
                After years of research and development, we're proud to offer a service that enhances the 
                literary experience while staying true to the essence of storytelling. Our team 
                continues to refine our technology, always seeking new ways to make reading more 
                engaging and accessible for everyone who loves books.
              </Typography>
            </Paper>
          </StorySection>
        </Fade>
        
        {/* Team Section */}
        <Fade in={true} timeout={1000} style={{ transitionDelay: '500ms' }}>
          <Box sx={{ mb: 8 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              align="center" 
              gutterBottom
              sx={{ 
                mb: 5,
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                fontWeight: 700
              }}
            >
              Meet Our Team
            </Typography>
            
            <Grid container spacing={4}>
              {team.map((member, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <TeamMember>
                    <Box
                      sx={{
                        height: 240,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(20,20,20,0.8)',
                        position: 'relative'
                      }}
                    >
                      <Avatar
                        src={member.avatar}
                        alt={member.name}
                        sx={{ 
                          width: 140, 
                          height: 140,
                          border: '4px solid rgba(244, 228, 188, 0.3)'
                        }}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=140&color=fff&bold=true`;
                        }}
                      />
                      {member.logo && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 10,
                            right: 10,
                            width: 50,
                            height: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Box 
                            component="img"
                            src={member.logo}
                            alt="University Logo"
                            sx={{
                              maxWidth: '100%',
                              maxHeight: '100%'
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Typography 
                        variant="h5" 
                        component="h3" 
                        gutterBottom
                        sx={{ fontWeight: 700 }}
                      >
                        {member.name}
                      </Typography>
                      <Typography 
                        variant="subtitle1" 
                        color="primary" 
                        gutterBottom
                        sx={{ mb: 2, fontWeight: 600 }}
                      >
                        {member.role}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {member.bio}
                      </Typography>
                    </CardContent>
                  </TeamMember>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>
        
        {/* Values Section */}
        <Fade in={true} timeout={1000} style={{ transitionDelay: '600ms' }}>
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              align="center" 
              gutterBottom
              sx={{ 
                mb: 5,
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                fontWeight: 700
              }}
            >
              Our Values
            </Typography>
            
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 3, md: 5 }, 
                borderRadius: 3,
                background: 'rgba(25,25,25,0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Stack alignItems="center" textAlign="center">
                    <IconWrapper sx={{ mb: 2, width: 64, height: 64 }}>
                      <Group fontSize="medium" />
                    </IconWrapper>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                      Accessibility
                    </Typography>
                    <Typography variant="body1">
                      We believe everyone should have access to immersive reading experiences, 
                      regardless of background or ability.
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack alignItems="center" textAlign="center">
                    <IconWrapper sx={{ mb: 2, width: 64, height: 64 }}>
                      <Lightbulb fontSize="medium" />
                    </IconWrapper>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                      Innovation
                    </Typography>
                    <Typography variant="body1">
                      We're constantly pushing the boundaries of what's possible in digital reading
                      with cutting-edge AI and sound technology.
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack alignItems="center" textAlign="center">
                    <IconWrapper sx={{ mb: 2, width: 64, height: 64 }}>
                      <AutoStories fontSize="medium" />
                    </IconWrapper>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                      Respect for Literature
                    </Typography>
                    <Typography variant="body1">
                      We enhance stories without changing their essence, honoring the author's intent
                      and the reader's personal imagination.
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
            
            <Box sx={{ mt: 6, textAlign: 'center' }}>
              <Button 
                variant="outlined" 
                color="primary" 
                size="large"
                sx={{ 
                  borderRadius: 2,
                  px: 4,
                  py: 1.2,
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2
                  }
                }}
                onClick={() => window.location.href = '/contact'}
              >
                Get In Touch
              </Button>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}

export default About; 