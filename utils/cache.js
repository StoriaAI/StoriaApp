const NodeCache = require('node-cache');
const Redis = require('redis');
require('dotenv').config();

// Environment variables
const CACHE_TTL = process.env.CACHE_TTL || 3600; // Default: 1 hour
const USE_REDIS = process.env.USE_REDIS === 'true';
const REDIS_URL = process.env.REDIS_URL;

// In-memory cache instance
const memoryCache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: 120,
  useClones: false,
});

// Redis client (initialized only if enabled)
let redisClient = null;

if (USE_REDIS && REDIS_URL) {
  try {
    redisClient = Redis.createClient({
      url: REDIS_URL
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
      redisClient = null;
    });
    
    redisClient.connect().then(() => {
      console.log('Redis connected successfully');
    }).catch(err => {
      console.error('Redis connection error:', err);
      redisClient = null;
    });
  } catch (err) {
    console.error('Failed to initialize Redis:', err);
  }
}

/**
 * Get a value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Cached value or null
 */
async function get(key) {
  try {
    // Try Redis first if available
    if (USE_REDIS && redisClient?.isReady) {
      const value = await redisClient.get(key);
      if (value) {
        return JSON.parse(value);
      }
    }
    
    // Fall back to memory cache
    return memoryCache.get(key);
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set a value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise<boolean>} - Success status
 */
async function set(key, value, ttl = CACHE_TTL) {
  try {
    // Set in Redis if available
    if (USE_REDIS && redisClient?.isReady) {
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttl
      });
    }
    
    // Always set in memory cache as backup
    memoryCache.set(key, value, ttl);
    return true;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete a value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Success status
 */
async function del(key) {
  try {
    // Delete from Redis if available
    if (USE_REDIS && redisClient?.isReady) {
      await redisClient.del(key);
    }
    
    // Always delete from memory cache
    memoryCache.del(key);
    return true;
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
}

/**
 * Clear all cache
 * @returns {Promise<boolean>} - Success status
 */
async function flush() {
  try {
    // Flush Redis if available
    if (USE_REDIS && redisClient?.isReady) {
      await redisClient.flushDb();
    }
    
    // Always flush memory cache
    memoryCache.flushAll();
    return true;
  } catch (error) {
    console.error('Cache flush error:', error);
    return false;
  }
}

/**
 * Get cache statistics
 * @returns {Object} - Cache stats
 */
function getStats() {
  return {
    memoryStats: memoryCache.getStats(),
    redisAvailable: USE_REDIS && redisClient?.isReady
  };
}

module.exports = {
  get,
  set,
  del,
  flush,
  getStats
}; 