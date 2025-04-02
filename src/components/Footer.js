import React from 'react';
import { Box, Container, Typography, Link, useTheme, useMediaQuery } from '@mui/material';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 2, 
        mt: 'auto',
        backgroundColor: theme.palette.background.paper,
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      <Container maxWidth="lg">
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'center' : 'center',
            textAlign: isMobile ? 'center' : 'inherit'
          }}
        >
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mb: isMobile ? 1 : 0 }}
          >
            Made by Storia Dev Team
          </Typography>
          <Box>
            <Link
              href="/privacy_policy.html"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              underline="hover"
              sx={{ 
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main
                }
              }}
            >
              Privacy Policy
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 