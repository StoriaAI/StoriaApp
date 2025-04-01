import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, CircularProgress, Alert, Slider } from '@mui/material';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

function BookReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [musicUrl, setMusicUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [generatingMusic, setGeneratingMusic] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:3001/api/read/${id}?page=${page}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        setContent(data.content);
        setTotalPages(data.totalPages);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchPage();
  }, [id, page]);

  const nextPage = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const generateMusic = async () => {
    try {
      // Format the text as a single block
      const formattedText = content
        .replace(/[\n\r]+/g, ' ')  // Replace newlines and carriage returns with spaces
        .replace(/\s+/g, ' ')       // Replace multiple spaces with a single space
        .trim();

      console.log('Formatted Text:', formattedText);
      
      setError(null); // Clear any previous errors
      
      // Show loading indication
      setGeneratingMusic(true);

      const response = await fetch('http://localhost:3001/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: formattedText })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server error response:', errorData);
        throw new Error(errorData.details || errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setMusicUrl(data.musicUrl);
      console.log('Music URL:', data.musicUrl);
    } catch (error) {
      console.error('Error generating music:', error);
      setError(`Failed to generate music: ${error.message}`);
    } finally {
      setGeneratingMusic(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
          Return Home
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 4, minHeight: '70vh' }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {content}
        </Typography>
      </Paper>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
        <Button variant="outlined" onClick={prevPage} disabled={page === 0}>
          Previous
        </Button>
        <Typography sx={{ alignSelf: 'center' }}>
          Page {page + 1} of {totalPages}
        </Typography>
        <Button variant="outlined" onClick={nextPage} disabled={page >= totalPages - 1}>
          Next
        </Button>
      </div>
      <Button 
        variant="contained" 
        onClick={generateMusic} 
        disabled={generatingMusic}
        sx={{ mt: 2 }}
      >
        {generatingMusic ? 'Generating Music...' : 'Generate Music'}
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
      {musicUrl && (
        <div style={{ marginTop: '16px' }}>
          <audio ref={audioRef} src={musicUrl} volume={volume} onEnded={() => setIsPlaying(false)} />
          <Button 
            variant="outlined" 
            onClick={togglePlay} 
            startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
            <VolumeDownIcon />
            <Slider
              value={volume}
              onChange={handleVolumeChange}
              min={0}
              max={1}
              step={0.01}
              sx={{ mx: 2, width: '200px' }}
            />
            <VolumeUpIcon />
          </div>
        </div>
      )}
    </Container>
  );
}

export default BookReader;
