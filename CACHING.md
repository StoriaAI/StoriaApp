# Caching System

StoriaApp implements a comprehensive multi-level caching system to improve performance, particularly for API calls to the Project Gutenberg API which can be slow at times.

## Cache Levels

1. **Server-side API Caching**
   - Uses either Redis (when enabled) or in-memory NodeCache
   - Caches Gutenberg API responses to reduce external API calls
   - Configurable TTL (Time to Live) for different types of data

2. **Client-side Browser Caching**
   - Uses localStorage to cache book data, search results, and category data
   - Implements stale-while-revalidate pattern to show cached data immediately while refreshing in the background
   - Prevents unnecessary loading states and improves perceived performance

## Cache Configuration

The following environment variables can be configured in the `.env` file:

```
# Cache Configuration
CACHE_TTL=3600                # Default cache TTL in seconds (1 hour)
SEARCH_CACHE_TTL=1800         # Search results cache TTL in seconds (30 minutes)
BOOK_CACHE_TTL=86400          # Book data cache TTL in seconds (24 hours)
USE_REDIS=false               # Set to true to use Redis for caching instead of in-memory cache
REDIS_URL=redis://localhost:6379  # Redis connection URL (only needed if USE_REDIS=true)
```

## Client-side Cache Implementation

The application implements client-side caching in three main areas:

1. **Home Page**: Caches book categories for 1 hour
2. **Search Page**: Caches search results for 30 minutes
3. **Trending Page**: Caches genre-based book lists for 1 hour

Each implementation follows these best practices:
- Cache keys include relevant query parameters
- Cache entries include a timestamp for TTL validation
- Background refresh of stale data without blocking the UI
- Fallback to network requests when cache is invalid or expired

## Server-side Cache Implementation

The server implements API-level caching for all Gutenberg API requests:

1. **Book Search Results**: Cached for 30 minutes (configurable via `SEARCH_CACHE_TTL`)
2. **Book Details**: Cached for 24 hours (configurable via `BOOK_CACHE_TTL`)

The cache system is designed to work either with:
- **In-memory cache**: Default option, suitable for single-instance deployments
- **Redis**: For multi-instance deployments that need a shared cache

## Benefits

- **Reduced API Load**: Minimizes calls to external Gutenberg API
- **Faster Page Loads**: Immediate data presentation from cache
- **Better User Experience**: Eliminates loading states for cached data
- **Resilience**: Can still work with previously cached data if the API is down

## Implementation Details

The cache system uses:
- `utils/cache.js`: Server-side caching utility
- localStorage with appropriate key prefixes for client-side caching
- Background refresh techniques to keep cache fresh without blocking UI 