import { supabase } from './supabase';

const MUSIC_BUCKET = 'music-cache';

/**
 * Check if a music file already exists in Supabase storage
 * @param {string} bookId - Book ID
 * @param {string} pageId - Page number
 * @returns {Promise<string|null>} - URL of the music file if it exists, null otherwise
 */
export const checkMusicExists = async (bookId, pageId) => {
  try {
    if (!bookId || pageId === undefined) {
      console.error('Invalid parameters for checkMusicExists', { bookId, pageId });
      return null;
    }

    const filePath = `${bookId}/${pageId}.mp3`;
    
    // Get the URL for the file if it exists
    const { data } = await supabase
      .storage
      .from(MUSIC_BUCKET)
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    // If data exists, the file exists
    return data?.signedUrl || null;
  } catch (error) {
    // If the error is because the file doesn't exist, just return null
    console.error('Error checking if music exists:', error);
    return null;
  }
};

/**
 * Save music data to Supabase storage
 * @param {string} bookId - Book ID
 * @param {string} pageId - Page number
 * @param {Blob|ArrayBuffer} musicData - Music data as blob or array buffer
 * @returns {Promise<string|null>} - URL of the saved music file, or null on error
 */
export const saveMusicToStorage = async (bookId, pageId, musicData) => {
  try {
    if (!bookId || pageId === undefined || !musicData) {
      console.error('Invalid parameters for saveMusicToStorage', { bookId, pageId });
      return null;
    }

    const filePath = `${bookId}/${pageId}.mp3`;
    
    // Convert ArrayBuffer to Blob if needed
    const musicBlob = musicData instanceof Blob 
      ? musicData 
      : new Blob([musicData], { type: 'audio/mpeg' });
    
    // Upload the file
    const { error: uploadError } = await supabase
      .storage
      .from(MUSIC_BUCKET)
      .upload(filePath, musicBlob, {
        contentType: 'audio/mpeg',
        upsert: true // Overwrite if exists
      });
    
    if (uploadError) {
      console.error('Error uploading music file:', uploadError);
      return null;
    }
    
    // Get the public URL
    const { data } = await supabase
      .storage
      .from(MUSIC_BUCKET)
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error saving music to storage:', error);
    return null;
  }
};

/**
 * Convert a data URL to a Blob
 * @param {string} dataUrl - Data URL to convert
 * @returns {Blob} - Converted Blob
 */
export const dataUrlToBlob = (dataUrl) => {
  const [meta, base64Data] = dataUrl.split(',');
  const contentType = meta.split(':')[1].split(';')[0];
  const binaryData = atob(base64Data);
  
  // Convert base64 to array buffer
  const arrayBuffer = new ArrayBuffer(binaryData.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < binaryData.length; i++) {
    uint8Array[i] = binaryData.charCodeAt(i);
  }
  
  return new Blob([arrayBuffer], { type: contentType });
};

/**
 * Convert a data URL to an ArrayBuffer
 * @param {string} dataUrl - Data URL to convert
 * @returns {ArrayBuffer} - Converted ArrayBuffer
 */
export const dataUrlToArrayBuffer = (dataUrl) => {
  const [, base64Data] = dataUrl.split(',');
  const binaryData = atob(base64Data);
  
  // Convert base64 to array buffer
  const arrayBuffer = new ArrayBuffer(binaryData.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < binaryData.length; i++) {
    uint8Array[i] = binaryData.charCodeAt(i);
  }
  
  return arrayBuffer;
}; 