import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert, 
  Slider, 
  AppBar,
  Toolbar,
  IconButton, 
  TextField,
  Box,
  LinearProgress,
  Tooltip,
  Divider,
  Backdrop
} from '@mui/material';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';

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
  const [fontSize, setFontSize] = useState(16);
  const [targetPage, setTargetPage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [loopMusic, setLoopMusic] = useState(true);
  const [cachedMusic, setCachedMusic] = useState({});
  const [backgroundGenerating, setBackgroundGenerating] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [pageContents, setPageContents] = useState({});
  const [loadingMessage, setLoadingMessage] = useState('Preparing your immersive reading experience...');
  const audioRef = useRef(null);
  const nextPagesToGenerate = useRef([]);
  const MIN_PAGES_TO_LOAD = 3; // Minimum pages to load before showing content

  // Initial load - fetch first few pages and start music generation
  useEffect(() => {
    const initialize = async () => {
      setInitialLoading(true);
      setLoadingMessage('Loading book content...');
      
      try {
        // First, fetch basic book information to get total pages
        const response = await fetch(`/api/read/${id}?page=0`);
        if (!response.ok) {
          throw new Error(`Error fetching book: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.content || typeof data.content !== 'string') {
          throw new Error('Invalid content received from the server');
        }
        
        // Set the content directly instead of relying on state updates
        const firstPageContent = data.content;
        setTotalPages(data.totalPages);
        
        // Update states synchronously for the first page
        setContent(firstPageContent);
        // Create a new object to avoid state update issues
        const initialPageContents = { [0]: firstPageContent };
        setPageContents(initialPageContents);
        
        // Pre-fetch content for the first buffer of pages
        setLoadingMessage('Pre-fetching initial pages...');
        const totalPagesToBuffer = Math.min(MIN_PAGES_TO_LOAD, data.totalPages);
        
        // Fetch content for initial buffer (we already have page 0)
        const contentPromises = [];
        for (let i = 1; i < totalPagesToBuffer; i++) {
          contentPromises.push(fetchAndStorePageContent(i, initialPageContents));
        }
        
        await Promise.all(contentPromises);
        
        // Now initialPageContents contains all fetched pages
        setPageContents({ ...initialPageContents });
        
        // Now that we have content, generate music for the first buffer of pages
        setLoadingMessage('Generating initial ambient music...');
        await generateMusicForInitialBuffer(initialPageContents, totalPagesToBuffer);
        
        // Queue up the next buffer of pages
        queueNextBuffer(totalPagesToBuffer);
        
      } catch (err) {
        console.error('Initialization error:', err);
        setError(`Failed to initialize: ${err.message}`);
      } finally {
        // Final safety check - ensure we have content before removing loading screen
        if (!content) {
          const pageZeroContent = pageContents[0];
          if (pageZeroContent && typeof pageZeroContent === 'string') {
            setContent(pageZeroContent);
          }
        }
        setInitialLoading(false);
      }
    };
    
    initialize();
  }, [id]);

  // Helper function to fetch and store a page's content
  const fetchAndStorePageContent = async (pageNum, contentStore) => {
    try {
      const response = await fetch(`/api/read/${id}?page=${pageNum}`);
      if (!response.ok) {
        console.warn(`Warning: Failed to fetch page ${pageNum}: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      if (!data.content || typeof data.content !== 'string') {
        console.warn(`Warning: Invalid content received for page ${pageNum}`);
        return null;
      }
      
      // Store in the provided content store
      contentStore[pageNum] = data.content;
      return data.content;
    } catch (err) {
      console.warn(`Warning: Error fetching page ${pageNum}:`, err);
      return null;
    }
  };

  // Generate music for initial buffer (MIN_PAGES_TO_LOAD)
  const generateMusicForInitialBuffer = async (contentStore, bufferSize) => {
    setBackgroundGenerating(true);
    
    // Use provided content store or fall back to state
    const pageStore = contentStore || pageContents;
    
    // Generate music for all pages in the initial buffer
    let generatedCount = 0;
    const pagesToGenerate = bufferSize;
    
    console.log(`Generating music for initial buffer of ${pagesToGenerate} pages`);
    
    for (let i = 0; i < pagesToGenerate; i++) {
      if (!pageStore[i] || !pageStore[i].trim()) {
        // If we don't have content, fetch it first
        console.log(`Fetching missing content for page ${i}`);
        await fetchPage(i, true);
      }
      
      if ((pageStore[i] || pageContents[i]) && !cachedMusic[i]) {
        try {
          setLoadingProgress(Math.round((generatedCount / pagesToGenerate) * 100));
          setLoadingMessage(`Generating music for page ${i+1}/${pagesToGenerate}...`);
          
          await generateMusicForPage(i, pageStore[i] || pageContents[i]);
          generatedCount++;
          console.log(`Generated music for initial buffer page ${i} (${generatedCount}/${pagesToGenerate})`);
        } catch (err) {
          console.error(`Failed to generate music for initial buffer page ${i}:`, err);
        }
      } else {
        console.log(`Skipping music generation for page ${i} (already cached or no content)`);
      }
    }
    
    setBackgroundGenerating(false);
    return generatedCount;
  };

  // Queue up the next buffer of pages for background processing
  const queueNextBuffer = (startPage) => {
    // Clear any existing queue first
    nextPagesToGenerate.current = [];
    
    // Buffer size is fixed at 3 pages
    const bufferSize = MIN_PAGES_TO_LOAD;
    const endPage = Math.min(startPage + bufferSize - 1, totalPages - 1);
    
    // Queue up the next set of pages
    for (let i = startPage; i <= endPage; i++) {
      if (!cachedMusic[i] && i < totalPages) {
        nextPagesToGenerate.current.push(i);
        console.log(`Queued next buffer page ${i} for background generation`);
      }
    }
    
    // Start processing the queue if not empty
    if (nextPagesToGenerate.current.length > 0) {
      console.log(`Starting background generation for next buffer: ${nextPagesToGenerate.current.join(', ')}`);
      setBackgroundGenerating(true);
      processBackgroundGeneration();
    } else {
      console.log('No pages to generate in next buffer');
    }
  };

  // Check if we need to generate music for the next buffer
  const checkAndQueueNextBuffer = () => {
    // Always maintain a 3-page look-ahead buffer from the current page
    const pagesToLookAhead = 3;
    const neededPages = [];
    
    // Check which of the next 3 pages need music generation
    for (let i = 1; i <= pagesToLookAhead; i++) {
      const futurePage = page + i;
      
      // Only consider pages that are within book bounds and don't have music yet
      if (futurePage < totalPages && !cachedMusic[futurePage] && 
          !nextPagesToGenerate.current.includes(futurePage)) {
        neededPages.push(futurePage);
      }
    }
    
    // If we found pages that need music, queue them
    if (neededPages.length > 0) {
      console.log(`Queueing music generation for pages: ${neededPages.join(', ')}`);
      
      // Clear the current queue and add the needed pages
      nextPagesToGenerate.current = neededPages;
      
      // Start the background generation if it's not already running
      if (!backgroundGenerating) {
        setBackgroundGenerating(true);
        processBackgroundGeneration();
      }
    } else {
      console.log(`No need to queue pages - next ${pagesToLookAhead} pages already have music`);
    }
  };

  // Monitor page changes to maintain music playback and buffer management
  useEffect(() => {
    // Set the content from our cached page contents
    if (pageContents[page]) {
      setContent(pageContents[page]);
    } else {
      // If we don't have the content cached, fetch it
      setLoading(true);
      fetchPage(page, true).then(pageContent => {
        if (pageContent) {
          setContent(pageContent);
        }
        setLoading(false);
      }).catch(err => {
        console.error(`Error loading page ${page}:`, err);
        setError(`Failed to load page ${page + 1}`);
        setLoading(false);
      });
    }
    
    // When page changes, check if we have cached music for this page
    if (cachedMusic[page]) {
      console.log(`Using cached music for page ${page}`);
      
      // Stop current audio if playing
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
      }
      
      // Set the music URL for the current page
      setMusicUrl(cachedMusic[page]);
      
      // Auto-play the cached music
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.volume = volume;
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(e => console.error('Auto-play failed:', e));
        }
      }, 500);
    } else {
      // If no cached music, generate it only if we have content
      if (pageContents[page] && pageContents[page].trim()) {
        // Pause any currently playing music before generating new music
        if (audioRef.current && isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        
        // Clear the current music URL to avoid playing the wrong music
        setMusicUrl(null);
        
        // Generate music for this page
        generateMusicForCurrentPage();
      }
    }
    
    // Always check and update the buffer when page changes
    checkAndQueueNextBuffer();
    
    // Debug log the current music cache status
    console.log(`Page changed to ${page}. Music cached for pages: ${Object.keys(cachedMusic).sort((a, b) => a - b).join(', ')}`);
  }, [page]);

  // Effect to handle the audio element's loop property
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loopMusic;
    }
  }, [loopMusic, musicUrl]);

  const generateMusicForPage = async (pageNum, contentText = null) => {
    // Use provided content or get from state
    const pageContent = contentText || pageContents[pageNum];
    
    if (!pageContent || !pageContent.trim()) {
      console.error(`Cannot generate music for page ${pageNum}: No content available`);
      return null;
    }
    
    try {
      // Format the text as a single block
      const formattedText = pageContent
        .replace(/[\n\r]+/g, ' ')  // Replace newlines and carriage returns with spaces
        .replace(/\s+/g, ' ')       // Replace multiple spaces with a single space
        .trim();
      
      if (!formattedText) {
        console.error(`Empty formatted text for page ${pageNum}`);
        return null;
      }
      
      console.log(`Generating music for page ${pageNum}, text length: ${formattedText.length}`);
      
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: formattedText })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`Server error for page ${pageNum}:`, errorData);
        throw new Error(errorData.details || errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.musicUrl) {
        throw new Error('No music URL returned from server');
      }
      
      // Cache the music URL
      setCachedMusic(prev => ({
        ...prev,
        [pageNum]: data.musicUrl
      }));
      
      console.log(`Music URL generated for page ${pageNum}`);
      
      // If this is the current page and we don't have music playing yet, set it
      if (pageNum === page) {
        // Stop any currently playing music first
        if (audioRef.current && isPlaying) {
          audioRef.current.pause();
        }
        
        setMusicUrl(data.musicUrl);
        
        // Auto-play the music
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.play()
              .then(() => setIsPlaying(true))
              .catch(e => console.error('Auto-play failed:', e));
          }
        }, 500);
      }
      
      return data.musicUrl;
    } catch (error) {
      console.error(`Music generation error for page ${pageNum}:`, error);
      return null;
    }
  };

  const processBackgroundGeneration = async () => {
    if (nextPagesToGenerate.current.length === 0) {
      setBackgroundGenerating(false);
      console.log('Background music generation buffer complete');
      return;
    }

    setBackgroundGenerating(true);
    const pageToGenerate = nextPagesToGenerate.current.shift();
    
    console.log(`Starting background music generation for page ${pageToGenerate}`);
    
    // Skip if we already have music for this page or it's out of bounds
    if (cachedMusic[pageToGenerate] || pageToGenerate >= totalPages) {
      console.log(`Skipping page ${pageToGenerate}: already cached or out of bounds`);
      processBackgroundGeneration();
      return;
    }
    
    try {
      // Fetch the content for this page if needed
      if (!pageContents[pageToGenerate] || !pageContents[pageToGenerate].trim()) {
        console.log(`Fetching content for page ${pageToGenerate} before generating music`);
        
        // Direct fetch instead of using fetchPage to avoid state timing issues
        const response = await fetch(`/api/read/${id}?page=${pageToGenerate}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching page ${pageToGenerate}: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.content || typeof data.content !== 'string') {
          throw new Error(`Invalid content received for page ${pageToGenerate}`);
        }
        
        // Store the fetched content immediately
        const pageContent = data.content;
        
        // Update the pageContents state with the new content
        setPageContents(prev => ({
          ...prev,
          [pageToGenerate]: pageContent
        }));
        
        console.log(`Successfully fetched content for page ${pageToGenerate}, length: ${pageContent.length}`);
        
        // Now generate music with the freshly fetched content
        if (pageContent && pageContent.trim()) {
          try {
            console.log(`Generating background music for page ${pageToGenerate}`);
            const musicUrl = await generateMusicForPage(pageToGenerate, pageContent);
            console.log(`Successfully generated music for page ${pageToGenerate}: ${musicUrl ? 'Success' : 'Failed'}`);
          } catch (error) {
            console.error(`Failed to generate background music for page ${pageToGenerate}:`, error);
          }
        } else {
          console.warn(`Empty content for page ${pageToGenerate} after fetching`);
        }
      } else {
        // We already have content, proceed with music generation
        console.log(`Using cached content for page ${pageToGenerate}`);
        try {
          console.log(`Generating background music for page ${pageToGenerate}`);
          await generateMusicForPage(pageToGenerate);
          console.log(`Successfully generated music for page ${pageToGenerate}`);
        } catch (error) {
          console.error(`Failed to generate background music for page ${pageToGenerate}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error processing page ${pageToGenerate}:`, error);
    }
    
    // Continue with the next page in the queue
    processBackgroundGeneration();
  };

  const fetchPage = async (pageNum, storeContent = false) => {
    try {
      if (pageNum === page) {
        setLoading(true);
      }
      
      setError(null);
      
      const response = await fetch(`/api/read/${id}?page=${pageNum}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.content || typeof data.content !== 'string') {
        console.error(`Invalid content received for page ${pageNum}:`, data);
        throw new Error(`Invalid content received for page ${pageNum}`);
      }
      
      // Store the total pages
      setTotalPages(data.totalPages);
      
      // Cache the content in our state
      if (storeContent && data.content && data.content.trim()) {
        setPageContents(prev => ({
          ...prev,
          [pageNum]: data.content
        }));
      }
      
      // If this is the current page, update the display
      if (pageNum === page) {
        setContent(data.content);
        setLoading(false);
      }
      
      return data.content;
    } catch (err) {
      console.error(`Error fetching page ${pageNum}:`, err);
      
      if (pageNum === page) {
        setError(`Failed to load page ${pageNum+1}: ${err.message}`);
        setLoading(false);
      }
      
      return null;
    }
  };

  // Fallback function to re-fetch content if it's empty
  const ensurePageContent = async () => {
    if (!content && page >= 0) {
      console.log(`Content is empty for page ${page}, re-fetching...`);
      try {
        const pageContent = await fetchPage(page, true);
        if (pageContent) {
          setContent(pageContent);
        } else {
          setError('Unable to load page content. Please try again.');
        }
      } catch (err) {
        console.error(`Failed to re-fetch content for page ${page}:`, err);
        setError(`Failed to load content: ${err.message}`);
      }
    }
  };

  // Effect to verify we have content after loading completes
  useEffect(() => {
    if (!initialLoading && !loading && !content) {
      ensurePageContent();
    }
  }, [initialLoading, loading, content]);

  const nextPage = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const generateMusicForCurrentPage = async () => {
    if (generatingMusic) return;
    
    // Check if we already have content
    if (!pageContents[page] || !pageContents[page].trim()) {
      // Try to fetch the content first
      const content = await fetchPage(page, true);
      if (!content || !content.trim()) {
        setError('Cannot generate music: No content available for this page');
        return;
      }
    }
    
    try {
      setGeneratingMusic(true);
      await generateMusicForPage(page);
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

  const toggleLoop = () => {
    setLoopMusic(!loopMusic);
  };

  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume > 0 ? volume : 0.5;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const zoomIn = () => {
    setFontSize(prev => Math.min(prev + 2, 28));
  };

  const zoomOut = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  const handleTargetPageChange = (e) => {
    setTargetPage(e.target.value);
  };

  const goToPage = () => {
    const pageNum = parseInt(targetPage);
    if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
      setPage(pageNum - 1); // Convert from 1-indexed to 0-indexed
      setTargetPage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      goToPage();
    }
  };

  // Debug function - call this to log the current state
  const debugState = () => {
    console.log('Current State:', {
      currentPage: page,
      totalPages,
      hasContent: !!content,
      contentLength: content?.length || 0,
      pageContentsKeys: Object.keys(pageContents),
      pageContentsFirstPage: pageContents[0]?.substring(0, 50),
      cachedMusicKeys: Object.keys(cachedMusic),
      error
    });
  };

  // For debugging the music buffer
  const logMusicStatus = () => {
    console.log('Music Status:');
    console.log(`Current page: ${page}`);
    console.log(`Cached music for pages: ${Object.keys(cachedMusic).join(', ')}`);
    console.log(`Queue for music generation: ${nextPagesToGenerate.current.join(', ')}`);
    console.log(`Background generation running: ${backgroundGenerating}`);
  };

  if (initialLoading) {
    return (
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column' }}
        open={true}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {loadingMessage}
        </Typography>
        {loadingProgress > 0 && (
          <>
            <Box sx={{ width: '300px', mt: 2 }}>
              <LinearProgress variant="determinate" value={loadingProgress} />
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {loadingProgress}% complete
            </Typography>
          </>
        )}
      </Backdrop>
    );
  }

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
        <Button variant="outlined" sx={{ mt: 2, ml: 2 }} onClick={ensurePageContent}>
          Retry Loading
        </Button>
      </Container>
    );
  }

  // Guard against empty content
  if (!content && !loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Alert severity="warning">No content available for this page.</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={ensurePageContent}>
          Retry Loading Content
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 2, pb: 4, position: 'relative' }}>
      {/* Top Control Bar */}
      <Paper elevation={3} sx={{ mb: 2 }}>
        <Toolbar variant="dense" sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Zoom out">
              <IconButton onClick={zoomOut} disabled={fontSize <= 12}>
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="body2" sx={{ mx: 1 }}>
              {fontSize}px
            </Typography>
            <Tooltip title="Zoom in">
              <IconButton onClick={zoomIn} disabled={fontSize >= 28}>
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Divider orientation="vertical" flexItem />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={generatingMusic || backgroundGenerating ? "Music generation in progress..." : "Generate ambient music"}>
              <span>
                <IconButton 
                  onClick={generateMusicForCurrentPage} 
                  disabled={generatingMusic || !pageContents[page]?.trim()}
                  color={musicUrl ? "primary" : "default"}
                >
                  <MusicNoteIcon />
                  {(generatingMusic || backgroundGenerating) && (
                    <CircularProgress
                      size={24}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginTop: '-12px',
                        marginLeft: '-12px',
                      }}
                    />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            
            {musicUrl && (
              <>
                <Tooltip title={isPlaying ? "Pause" : "Play"}>
                  <IconButton onClick={togglePlay}>
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={loopMusic ? "Disable loop" : "Enable loop"}>
                  <IconButton onClick={toggleLoop} color={loopMusic ? "primary" : "default"}>
                    {loopMusic ? <RepeatOneIcon /> : <RepeatIcon />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={isMuted ? "Unmute" : "Mute"}>
                  <IconButton onClick={toggleMute}>
                    {isMuted ? <VolumeMuteIcon /> : <VolumeDownIcon />}
                  </IconButton>
                </Tooltip>
                
                <Slider
                  value={volume}
                  onChange={handleVolumeChange}
                  min={0}
                  max={1}
                  step={0.01}
                  sx={{ width: 100, mx: 1 }}
                  size="small"
                />
              </>
            )}
          </Box>
        </Toolbar>
      </Paper>

      {/* Content Area */}
      <Paper sx={{ p: 4, minHeight: '70vh' }}>
        <Typography 
          variant="body1" 
          sx={{ 
            whiteSpace: 'pre-line',
            fontSize: `${fontSize}px`,
            lineHeight: 1.6
          }}
        >
          {content}
        </Typography>
      </Paper>

      {/* Hidden audio element */}
      {musicUrl && (
        <audio 
          ref={audioRef} 
          src={musicUrl} 
          loop={loopMusic}
          volume={volume} 
          onEnded={() => !loopMusic && setIsPlaying(false)} 
        />
      )}

      {/* Bottom Navigation */}
      <Paper elevation={3} sx={{ mt: 2, p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={(page / (totalPages - 1)) * 100} 
            sx={{ mb: 1, height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            {Math.round((page / (totalPages - 1)) * 100)}% complete
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant="outlined" onClick={prevPage} disabled={page === 0}>
            Previous
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ mr: 1 }}>
              Page {page + 1} of {totalPages}
            </Typography>
            <TextField
              size="small"
              placeholder="Go to page"
              value={targetPage}
              onChange={handleTargetPageChange}
              onKeyPress={handleKeyPress}
              sx={{ width: 100 }}
              inputProps={{ 
                'aria-label': 'Go to page',
                style: { textAlign: 'center' }
              }}
            />
            <Button 
              size="small" 
              variant="outlined" 
              onClick={goToPage} 
              sx={{ ml: 1 }}
            >
              Go
            </Button>
          </Box>
          
          <Button variant="outlined" onClick={nextPage} disabled={page >= totalPages - 1}>
            Next
          </Button>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
      
      {/* Debug info - only for development */}
      {process.env.NODE_ENV === 'development' && (
        <Paper sx={{ mt: 2, p: 2, opacity: 0.8 }}>
          <Typography variant="caption">Debug Info:</Typography>
          <Typography variant="caption" component="div">
            Cached Pages: {Object.keys(pageContents).length} | 
            Cached Music: {Object.keys(cachedMusic).length} | 
            Queue Size: {nextPagesToGenerate.current.length}
          </Typography>
        </Paper>
      )}
    </Container>
  );
}

export default BookReader;
