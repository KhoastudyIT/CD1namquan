class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get cached item by key
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check expiration (TTL)
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  /**
   * Set cache item
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlMs Time to live in milliseconds (default 5 minutes)
   */
  set(key, value, ttlMs = 300000) {
    const expiry = ttlMs ? Date.now() + ttlMs : null;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Delete specific key
   * @param {string} key 
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Delete keys that start with a specific pattern (e.g., 'products:')
   * @param {string} pattern 
   */
  deletePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const dbCache = new MemoryCache();
