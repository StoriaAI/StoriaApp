# Music Caching System

Storia now includes a music caching system that stores generated ambient music in Supabase Storage to improve performance and reduce API usage.

## How It Works

1. **Cache Location**: Music is stored in the Supabase `music-cache` bucket with the following structure:
   ```
   music-cache/
   ├── [book_id]/
   │   ├── 1.mp3  # Music for page 1
   │   ├── 2.mp3  # Music for page 2
   │   └── ...
   ```

2. **Cache Process**:
   - When a user opens a page, the app checks if music for that book/page combination already exists in the cache
   - If found, the app immediately uses the cached music without calling the ElevenLabs API
   - If not found, the app generates new music via ElevenLabs and then stores it in the cache for future use

3. **Benefits**:
   - Significantly reduced ElevenLabs API usage (saving costs)
   - Faster music loading experience
   - Consistent music experience for the same page across sessions

## Setup Requirements

To use this feature, ensure:

1. **Supabase Storage Bucket**:
   - Create a bucket named `music-cache` in your Supabase project
   - Set appropriate permissions (public read access at minimum)

2. **Required Environment Variables**:
   - `REACT_APP_SUPABASE_URL`: Your Supabase project URL
   - `REACT_APP_SUPABASE_PUBLIC_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE`: Your Supabase service role key (used by the server to write to storage)

3. **Deployment**:
   - No additional setup needed beyond environment variables
   - Ensure the Supabase service role key is properly set in your Vercel environment variables

## Technical Implementation

The music caching system consists of:

1. **Server Side** (`api/generate-music.js`):
   - Checks if music exists in Supabase storage before generating new music
   - Saves newly generated music to Supabase storage
   - Returns a signed URL to the cached music when available

2. **Client Side** (`src/pages/BookReader.js`):
   - Displays whether music is from cache or freshly generated
   - Handles both cached and generated music URLs transparently

## Troubleshooting

If you experience issues with the music caching:

1. **Music Not Being Cached**:
   - Verify the Supabase service role key is correct
   - Check the `music-cache` bucket exists and has proper permissions
   - Look for error messages in the server logs

2. **Access Issues**:
   - Check that the signed URLs are working correctly
   - Verify your Supabase storage configuration allows appropriate access
   - Ensure the bucket has public read access

3. **Performance Issues**:
   - Signed URLs expire after 1 hour by default
   - If users have sessions longer than this, they may experience re-downloads

## Future Improvements

Potential enhancements for the music caching system:

1. Enhanced metadata storage for better organization
2. Cache invalidation strategy for outdated music
3. User-specific music preferences and variations 