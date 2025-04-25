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
  Backdrop,
  useTheme,
  useMediaQuery,
  Stack,
  Menu,
  MenuItem,
  Snackbar
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
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useAuth } from '../contexts/AuthContext';
import { supabase, getUserBookmarks, saveBookmark, deleteBookmark } from '../lib/supabase';

function BookReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
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
  // Bookmark related states
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState({ top: 0, left: 0 });
  const [selectionMenuOpen, setSelectionMenuOpen] = useState(false);
  const [bookmarkSnackbarOpen, setBookmarkSnackbarOpen] = useState(false);
  const [bookmarkMessage, setBookmarkMessage] = useState('');
  const contentRef = useRef(null);
  const audioRef = useRef(null);
  const nextPagesToGenerate = useRef([]);
  const MIN_PAGES_TO_LOAD = 3; // Base minimum pages to load
  const LOOK_AHEAD_BUFFER = 3; // How many pages ahead to pre-generate music
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Add a specific debug flag to disable music to ensure reading works properly
  const DEBUG_DISABLE_MUSIC = true; // Set to false if you want to enable music again

  // Initialize page and fetch first content and load bookmarks
  useEffect(() => {
    const initialize = async () => {
      setInitialLoading(true);
      setLoadingMessage('Loading book content...');
      
      try {
        // Fetch the first page - ensure the id is properly extracted from URL
        const response = await fetch(`/api/read/${id}?page=0`);
        if (!response.ok) {
          throw new Error(`Error fetching book: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.content || typeof data.content !== 'string') {
          throw new Error('Invalid content received from the server');
        }
        
        // Set the important book info
        setContent(data.content);
        setTotalPages(data.totalPages);
        
        // Add to pageContents cache
        setPageContents({
          0: data.content
        });
        
        // Load user bookmarks for this book
        if (isAuthenticated) {
          await fetchBookmarks();
        }
        
        if (!DEBUG_DISABLE_MUSIC) {
          // Skip music generation for testing
          setLoadingMessage('Generating ambient music...');
          await generateMusicForCurrentPage();
        }
        
      } catch (err) {
        console.error('Initialization error:', err);
        setError(`Failed to initialize: ${err.message}`);
      } finally {
        setInitialLoading(false);
      }
    };
    
    initialize();
  }, [id, isAuthenticated]);

  // Fetch bookmarks for current user and book
  const fetchBookmarks = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const { data, error } = await getUserBookmarks(user.id, id);
        
      if (error) throw error;
      
      if (data) {
        setBookmarks(data);
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    }
  };
  
  // Add a bookmark
  const addBookmark = async (selectedWord, selection) => {
    if (!isAuthenticated || !user) {
      setBookmarkMessage('Please log in to add bookmarks');
      setBookmarkSnackbarOpen(true);
      return;
    }
    
    try {
      const timestamp = new Date().toISOString();
      
      const newBookmark = {
        user_id: user.id,
        book_id: id,
        page_number: page,
        selected_word: selectedWord,
        selection_context: selection,
        created_at: timestamp,
      };
      
      const { data, error } = await saveBookmark(newBookmark);
        
      if (error) throw error;
      
      // Update local state
      if (data) {
        setBookmarks([...bookmarks, { ...newBookmark, id: data[0]?.id }]);
        setBookmarkMessage('Bookmark added successfully');
        setBookmarkSnackbarOpen(true);
      }
      
      // Close the selection menu
      handleSelectionMenuClose();
    } catch (err) {
      console.error('Error adding bookmark:', err);
      setBookmarkMessage('Failed to add bookmark');
      setBookmarkSnackbarOpen(true);
    }
  };
  
  // Remove a bookmark
  const removeBookmark = async (bookmarkId) => {
    if (!isAuthenticated || !user) return;
    
    try {
      const { error } = await deleteBookmark(bookmarkId);
        
      if (error) throw error;
      
      // Update local state
      setBookmarks(bookmarks.filter(bookmark => bookmark.id !== bookmarkId));
      setBookmarkMessage('Bookmark removed');
      setBookmarkSnackbarOpen(true);
    } catch (err) {
      console.error('Error removing bookmark:', err);
      setBookmarkMessage('Failed to remove bookmark');
      setBookmarkSnackbarOpen(true);
    }
  };
  
  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    
    if (selection.toString().trim() === '') {
      setSelectionMenuOpen(false);
      return;
    }
    
    // Get the selected text and its position
    const selectedText = selection.toString().trim();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setSelectedText(selectedText);
    setSelectionPosition({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX
    });
    
    setSelectionMenuOpen(true);
  };
  
  // Close the selection menu
  const handleSelectionMenuClose = () => {
    setSelectionMenuOpen(false);
    setSelectedText('');
  };
  
  // Handle bookmark from selection
  const handleBookmarkSelection = () => {
    const selection = window.getSelection();
    const selectionContext = selection.toString();
    const selectionWord = selection.toString().trim();
    
    addBookmark(selectionWord, selectionContext);
  };

  // Check if the current page has a bookmark
  const hasBookmarkOnCurrentPage = () => {
    return bookmarks.some(bookmark => bookmark.page_number === page);
  };
  
  // Get bookmark for current page
  const getCurrentPageBookmark = () => {
    return bookmarks.find(bookmark => bookmark.page_number === page);
  };
  
  // Toggle bookmark for the current page
  const togglePageBookmark = () => {
    const currentBookmark = getCurrentPageBookmark();
    
    if (currentBookmark) {
      removeBookmark(currentBookmark.id);
    } else {
      // Add a bookmark for the whole page if no text is selected
      addBookmark("Whole page", content);
    }
  };
  
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
    
    console.log(`Generating music for initial buffer of ${bufferSize} pages`);
    
    // We'll generate for the buffer, focusing on the current page and ones ahead
    const startPage = Math.max(0, page - 1); // Include current page and one before if possible
    const endPage = Math.min(startPage + bufferSize - 1, totalPages - 1);
    
    for (let i = startPage; i <= endPage; i++) {
      if (!pageStore[i] || !pageStore[i].trim()) {
        // If we don't have content, fetch it first
        console.log(`Fetching missing content for page ${i}`);
        await fetchPage(i, true);
      }
      
      if ((pageStore[i] || pageContents[i]) && !cachedMusic[i]) {
        try {
          const progress = Math.round(((i - startPage + 1) / (endPage - startPage + 1)) * 100);
          setLoadingProgress(progress);
          setLoadingMessage(`Generating music for page ${i+1}/${endPage+1}...`);
          
          await generateMusicForPage(i, pageStore[i] || pageContents[i]);
          generatedCount++;
          console.log(`Generated music for buffer page ${i} (${generatedCount}/${bufferSize})`);
        } catch (err) {
          console.error(`Failed to generate music for buffer page ${i}:`, err);
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
    
    // Use a dynamic buffer centered around the current page
    const bufferSize = LOOK_AHEAD_BUFFER;
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
    // Always maintain a dynamic look-ahead buffer from the current page
    const pagesToLookAhead = LOOK_AHEAD_BUFFER;
    const neededPages = [];
    
    // Check which of the next pages need music generation
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

  // Monitor page changes to maintain book reading flow
  useEffect(() => {
    // Set the content from our cached page contents
    if (pageContents[page]) {
      setContent(pageContents[page]);
      setLoading(false);
    } else {
      // If we don't have the content cached, fetch it
      setLoading(true);
      
      fetch(`/api/read/${id}?page=${page}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.content) {
            setContent(data.content);
            
            // Update page cache
            setPageContents(prev => ({
              ...prev,
              [page]: data.content
            }));
            
            // Update total pages if needed
            if (data.totalPages && data.totalPages !== totalPages) {
              setTotalPages(data.totalPages);
            }
          } else {
            throw new Error('No content received from server');
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(`Error loading page ${page}:`, err);
          setError(`Failed to load page ${page + 1}: ${err.message}`);
          setLoading(false);
        });
    }
    
    // Only generate music if it's enabled
    if (!DEBUG_DISABLE_MUSIC && !cachedMusic[page] && !generatingMusic) {
      generateMusicForCurrentPage();
    }
    
    // Log the current page for debugging
    console.log(`Changed to page ${page + 1} of ${totalPages}`);
    
  }, [page, id]);

  // Effect to handle the audio element's loop property
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loopMusic;
    }
  }, [loopMusic, musicUrl]);

  const generateMusicForPage = async (pageNum, contentText = null, retryCount = 0) => {
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
      
      // Add page identifier and book ID to ensure unique music for each page
      const requestData = {
        text: formattedText,
        pageId: pageNum,
        bookId: id,
        timestamp: new Date().toISOString().slice(0, 10) // Include date to allow daily variation
      };
      
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`Server error for page ${pageNum}:`, errorData);
        
        // If it's a 401 error, show a more specific message
        if (response.status === 401) {
          setError(`Authentication error with music service. Please check API configuration.`);
          throw new Error(`API authentication error: ${errorData.details || 'Invalid API key'}`);
        }
        
        // If it's a 429 error (rate limit), retry after a delay
        if (response.status === 429 && retryCount < 3) {
          console.log(`Rate limit hit. Retrying after delay (${retryCount + 1}/3)...`);
          setError(`Music service rate limit reached. Retrying in ${Math.pow(2, retryCount + 1)} seconds...`);
          
          // Wait with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount + 1)));
          
          // Clear error message before retry
          setError(null);
          
          // Retry the request
          return generateMusicForPage(pageNum, contentText, retryCount + 1);
        }
        
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
              .catch(e => {
                console.error('Auto-play failed:', e);
                // User interaction might be needed, show message
                setError("Music playback failed. Click play to start music.");
              });
          }
        }, 500);
      }
      
      return data.musicUrl;
    } catch (error) {
      console.error(`Music generation error for page ${pageNum}:`, error);
      
      // For network or server errors, retry once after a delay
      if ((error.message.includes('network') || error.message.includes('timeout')) && retryCount < 2) {
        console.log(`Network or timeout error. Retrying after delay (${retryCount + 1}/2)...`);
        setError(`Music generation failed. Retrying in ${retryCount + 1} seconds...`);
        
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        
        // Clear error message before retry
        setError(null);
        
        // Retry the request
        return generateMusicForPage(pageNum, contentText, retryCount + 1);
      }
      
      // If retries failed or other error, show error message
      setError(`Music generation failed: ${error.message}`);
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
    if (!pageContents[page] || pageContents[page].trim() === '') {
      console.warn(`No content available for page ${page}, cannot generate music`);
      return;
    }
    
    setLoading(true);
    setLoadingMessage('Generating music for current page...');
    
    try {
      const url = await generateMusicForPage(page);
      if (url) {
        setMusicUrl(url);
        setError(null); // Clear any previous errors on success
      } else {
        // If no URL but also no exception was thrown, show generic error
        setError('Failed to generate music. Try again later.');
      }
    } catch (error) {
      console.error('Error in generateMusicForCurrentPage:', error);
      // Error is already displayed by the generateMusicForPage function
    } finally {
      setLoading(false);
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
      <Container sx={{ mt: 4, px: isMobile ? 2 : 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
          Return Home
        </Button>
        <Button variant="outlined" sx={{ mt: 2, ml: isMobile ? 0 : 2, width: isMobile ? '100%' : 'auto' }} onClick={ensurePageContent}>
          Retry Loading
        </Button>
      </Container>
    );
  }

  // Guard against empty content
  if (!content && !loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center', px: isMobile ? 2 : 3 }}>
        <Alert severity="warning">No content available for this page.</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={ensurePageContent}>
          Retry Loading Content
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%', mb: 6 }}>
      <Container sx={{ mt: isMobile ? 1 : 2, pb: isMobile ? 2 : 4, position: 'relative', px: isMobile ? 1 : 3, flex: '1 0 auto' }} maxWidth="lg">
        {/* Top Control Bar */}
        <Paper elevation={3} sx={{ mb: isMobile ? 1 : 2 }}>
          <Toolbar 
            variant="dense" 
            sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              py: isMobile ? 1 : 0
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'center' : 'flex-start',
              mb: isMobile ? 1 : 0
            }}>
              <Tooltip title="Zoom out">
                <IconButton onClick={zoomOut} disabled={fontSize <= 12} size={isMobile ? 'small' : 'medium'}>
                  <ZoomOutIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" sx={{ mx: 1 }}>
                {fontSize}px
              </Typography>
              <Tooltip title="Zoom in">
                <IconButton onClick={zoomIn} disabled={fontSize >= 28} size={isMobile ? 'small' : 'medium'}>
                  <ZoomInIcon />
                </IconButton>
              </Tooltip>
              
              {isAuthenticated && (
                <Tooltip title={hasBookmarkOnCurrentPage() ? "Remove bookmark" : "Add bookmark"}>
                  <IconButton 
                    onClick={togglePageBookmark} 
                    color="primary"
                    size={isMobile ? 'small' : 'medium'}
                  >
                    {hasBookmarkOnCurrentPage() ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            
            {!isMobile && <Divider orientation="vertical" flexItem />}
            {isMobile && <Divider sx={{ width: '100%', my: 1 }} />}
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}>
              <Tooltip title={generatingMusic || backgroundGenerating ? "Music generation in progress..." : "Generate ambient music"}>
                <span>
                  <IconButton 
                    onClick={generateMusicForCurrentPage} 
                    disabled={generatingMusic || !pageContents[page]?.trim()}
                    color={musicUrl ? "primary" : "default"}
                    size={isMobile ? 'small' : 'medium'}
                  >
                    <MusicNoteIcon />
                    {(generatingMusic || backgroundGenerating) && (
                      <CircularProgress
                        size={isMobile ? 18 : 24}
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          marginTop: isMobile ? '-9px' : '-12px',
                          marginLeft: isMobile ? '-9px' : '-12px',
                        }}
                      />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              
              {musicUrl && (
                <>
                  <Tooltip title={isPlaying ? "Pause" : "Play"}>
                    <IconButton onClick={togglePlay} size={isMobile ? 'small' : 'medium'}>
                      {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={loopMusic ? "Disable loop" : "Enable loop"}>
                    <IconButton onClick={toggleLoop} color={loopMusic ? "primary" : "default"} size={isMobile ? 'small' : 'medium'}>
                      {loopMusic ? <RepeatOneIcon /> : <RepeatIcon />}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={isMuted ? "Unmute" : "Mute"}>
                    <IconButton onClick={toggleMute} size={isMobile ? 'small' : 'medium'}>
                      {isMuted ? <VolumeMuteIcon /> : <VolumeDownIcon />}
                    </IconButton>
                  </Tooltip>
                  
                  <Slider
                    value={volume}
                    onChange={handleVolumeChange}
                    min={0}
                    max={1}
                    step={0.01}
                    sx={{ width: isMobile ? 80 : 100, mx: isMobile ? 0.5 : 1 }}
                    size="small"
                  />
                </>
              )}
            </Box>
          </Toolbar>
        </Paper>

        {/* Content Area */}
        <Paper sx={{ 
          p: isMobile ? 2 : 4, 
          minHeight: isMobile ? '60vh' : '70vh',
          borderRadius: isMobile ? 1 : 2,
          position: 'relative'
        }}>
          <Typography 
            ref={contentRef}
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-line',
              fontSize: `${fontSize}px`,
              lineHeight: 1.6
            }}
            onMouseUp={handleTextSelection}
            onTouchEnd={handleTextSelection}
          >
            {content}
          </Typography>
          
          {/* Selection Menu */}
          <Menu
            open={selectionMenuOpen}
            onClose={handleSelectionMenuClose}
            anchorReference="anchorPosition"
            anchorPosition={
              selectionPosition.top !== 0 && selectionPosition.left !== 0
                ? { top: selectionPosition.top, left: selectionPosition.left }
                : undefined
            }
          >
            <MenuItem onClick={handleBookmarkSelection}>
              <BookmarkIcon sx={{ mr: 1 }} fontSize="small" /> 
              Bookmark
            </MenuItem>
          </Menu>
        </Paper>

        {/* Bookmark success/error snackbar */}
        <Snackbar
          open={bookmarkSnackbarOpen}
          autoHideDuration={3000}
          onClose={() => setBookmarkSnackbarOpen(false)}
          message={bookmarkMessage}
        />

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
        <Paper elevation={3} sx={{ mt: isMobile ? 1 : 2, p: isMobile ? 1 : 2, borderRadius: isMobile ? 1 : 2 }}>
          <Box sx={{ mb: isMobile ? 1 : 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={(page / (totalPages - 1)) * 100} 
              sx={{ mb: 1, height: isMobile ? 6 : 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              {Math.round((page / (totalPages - 1)) * 100)}% complete
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: isMobile ? 1 : 0
          }}>
            <Button 
              variant="outlined" 
              onClick={prevPage} 
              disabled={page === 0}
              fullWidth={isMobile}
              size={isMobile ? 'small' : 'medium'}
            >
              Previous
            </Button>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              width: isMobile ? '100%' : 'auto',
              gap: isMobile ? 1 : 0,
              my: isMobile ? 1 : 0,
              justifyContent: 'center'
            }}>
              <Typography sx={{ mr: isMobile ? 0 : 1, fontSize: isMobile ? '0.875rem' : '1rem' }}>
                Page {page + 1} of {totalPages}
              </Typography>
              <Stack 
                direction="row" 
                spacing={1} 
                alignItems="center"
                sx={{ width: isMobile ? '100%' : 'auto' }}
              >
                <TextField
                  size="small"
                  placeholder="Go to page"
                  value={targetPage}
                  onChange={handleTargetPageChange}
                  onKeyPress={handleKeyPress}
                  sx={{ 
                    width: isMobile ? '100%' : 100,
                    '& .MuiInputBase-input': {
                      textAlign: 'center',
                      py: isMobile ? 0.5 : 1
                    }
                  }}
                  inputProps={{ 
                    'aria-label': 'Go to page'
                  }}
                />
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={goToPage}
                  sx={{ minWidth: isMobile ? '80px' : 'auto' }}
                >
                  Go
                </Button>
              </Stack>
            </Box>
            
            <Button 
              variant="outlined" 
              onClick={nextPage} 
              disabled={page >= totalPages - 1}
              fullWidth={isMobile}
              size={isMobile ? 'small' : 'medium'}
            >
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
        
        {/* Loading backdrop */}
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={initialLoading}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress color="inherit" sx={{ mb: 2 }} />
            <Typography variant="body1">{loadingMessage}</Typography>
            {loadingProgress > 0 && (
              <Box sx={{ width: '250px', mt: 2 }}>
                <LinearProgress variant="determinate" value={loadingProgress} />
                <Typography variant="caption" sx={{ mt: 1 }}>
                  {loadingProgress}% complete
                </Typography>
              </Box>
            )}
          </Box>
        </Backdrop>
      </Container>
      
      {/* Audio player controls bar */}
      <AppBar 
        position="fixed" 
        color="default" 
        sx={{ 
          top: 'auto', 
          bottom: 0,
          boxShadow: 3
        }}
      >
        {/* ... existing AppBar content ... */}
      </AppBar>
    </Box>
  );
}

export default BookReader;
