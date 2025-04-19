import React from 'react';
import { Box, Container, Typography, Link, useTheme, useMediaQuery, Grid, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', path: '/features' },
        { name: 'Pricing', path: '/pricing' },
        { name: 'FAQ', path: '/faq' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Blog', path: '/blog' },
        { name: 'Help Center', path: '/help' },
        { name: 'Contact', path: '/contact' },
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About', path: '/about' },
        { name: 'Careers', path: '/careers' },
        { name: 'Terms', path: '/terms' },
      ]
    },
  ];

  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 4, 
        mt: 'auto',
        backgroundColor: theme.palette.background.default,
        borderTop: 1,
        borderColor: 'divider'
      }}
      className="footer"
    >
      <Container maxWidth="lg">
        {/* Main Footer Content */}
        <Grid container spacing={4}>
          {/* Logo and tagline */}
          <Grid item xs={12} md={3}>
            <Box className="logo-section">
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    mr: '6px'
                  }}
                />
                Storia
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Read any book in 10 minutes
              </Typography>
            </Box>
          </Grid>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <Grid item xs={6} sm={4} md={3} key={section.title}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600,
                  mb: 2
                }}
              >
                {section.title}
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}
              >
                {section.links.map((link) => (
                  <Link
                    key={link.name}
                    component={RouterLink}
                    to={link.path}
                    color="text.secondary"
                    underline="none"
                    sx={{ 
                      fontSize: '0.875rem',
                      '&:hover': {
                        color: theme.palette.text.primary
                      }
                    }}
                  >
                    {link.name}
                  </Link>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Copyright and Legal Links */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'center' : 'center',
            textAlign: isMobile ? 'center' : 'inherit',
            pt: 1
          }}
        >
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ mb: isMobile ? 1 : 0 }}
          >
            © {new Date().getFullYear()} Storia. All rights reserved.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 3
            }}
          >
            <Link
              href="/privacy_policy.html"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              underline="none"
              sx={{ 
                fontSize: '0.75rem',
                '&:hover': {
                  color: theme.palette.text.primary
                }
              }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              underline="none"
              sx={{ 
                fontSize: '0.75rem',
                '&:hover': {
                  color: theme.palette.text.primary
                }
              }}
            >
              Terms of Service
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 