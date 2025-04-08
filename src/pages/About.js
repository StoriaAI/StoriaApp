import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  styled
} from '@mui/material';
import '../styles/About.css';

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

const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

function About() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Container maxWidth="lg" sx={{ px: isMobile ? 2 : 3, mb: { xs: 8, md: 8 }, mt: 8, flex: '1 0 auto' }}>
      <Box textAlign="center" mb={6}>
        <ResponsiveHeading variant="h1" gutterBottom>
          About Storia
        </ResponsiveHeading>
        <Typography variant="h5" color="textSecondary">
          Bringing books to life through immersive soundscapes
        </Typography>
      </Box>
      
      <SectionPaper elevation={3}>
        <Typography variant="h4" gutterBottom color="primary">
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
          distracting from the content.
        </Typography>
      </SectionPaper>
      
      <SectionPaper elevation={3}>
        <Typography variant="h4" gutterBottom color="primary">
          Our Story
        </Typography>
        <Typography variant="body1" paragraph>
          Storia began with a simple question: what if books could be more immersive? Founded by 
          a team of literature enthusiasts and technology innovators, we set out to create a 
          platform that would bridge the gap between traditional reading and modern digital experiences.
        </Typography>
        <Typography variant="body1" paragraph>
          After years of research and development, we're proud to offer a service that enhances the 
          literary experience while staying true to the essence of storytelling. Our team 
          continues to refine our technology, always seeking new ways to make reading more 
          engaging and accessible.
        </Typography>
      </SectionPaper>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <SectionPaper elevation={3}>
            <Typography variant="h4" gutterBottom color="primary">
              Our Technology
            </Typography>
            <Typography variant="body1" paragraph>
              Storia's proprietary AI algorithms analyze the emotional context, setting, 
              and action within text to generate responsive soundscapes that adapt as you read. 
              From subtle ambient sounds to dynamic environmental effects, our technology creates 
              a personalized audio environment for every page.
            </Typography>
            <Typography variant="body1">
              We work with sound designers and composers to ensure each audio element meets the 
              highest quality standards, providing a truly premium experience for our users.
            </Typography>
          </SectionPaper>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionPaper elevation={3}>
            <Typography variant="h4" gutterBottom color="primary">
              Our Values
            </Typography>
            <Box mb={2}>
              <Typography variant="h6" gutterBottom>
                Accessibility
              </Typography>
              <Typography variant="body1" paragraph>
                We believe everyone should have access to immersive reading experiences, 
                regardless of background or ability.
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box mb={2}>
              <Typography variant="h6" gutterBottom>
                Innovation
              </Typography>
              <Typography variant="body1" paragraph>
                We're constantly pushing the boundaries of what's possible in digital reading.
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="h6" gutterBottom>
                Respect for Literature
              </Typography>
              <Typography variant="body1">
                We enhance stories without changing their essence, honoring the author's intent.
              </Typography>
            </Box>
          </SectionPaper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default About; 