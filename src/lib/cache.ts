type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  lastAccessed: number;
};

const store = new Map<string, CacheEntry<unknown>>();

// Maximum number of entries to prevent memory exhaustion
const MAX_CACHE_SIZE = 1000;
// Cleanup interval in milliseconds (5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  // Only run cleanup if enough time has passed
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  // Remove all expired entries
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(key);
    }
  }
}

function evictLeastRecentlyUsed() {
  if (store.size < MAX_CACHE_SIZE) return;

  // Find and remove the least recently accessed entry
  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  for (const [key, entry] of store) {
    if (entry.lastAccessed < oldestTime) {
      oldestTime = entry.lastAccessed;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    store.delete(oldestKey);
  }
}

export function setCache<T>(key: string, value: T, ttlMs: number) {
  cleanup();
  evictLeastRecentlyUsed();

  const now = Date.now();
  store.set(key, { value, expiresAt: now + ttlMs, lastAccessed: now });
}

export function getCache<T>(key: string): T | null {
  cleanup();

  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  const now = Date.now();
  if (now > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  // Update last accessed time for LRU tracking
  entry.lastAccessed = now;
  return entry.value;
}

export function clearCache() {
  store.clear();
}

export function getCacheSize() {
  return store.size;
}
