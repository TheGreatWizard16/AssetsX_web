import { API_CONFIG } from './config.js';

// Read a cached value from sessionStorage.
// Returns null if the data doesn't exist or has been there longer than 5 minutes.
export function readCache(key) {
  const rawData = sessionStorage.getItem(key);
  const timestamp = sessionStorage.getItem(`${key}_timestamp`);

  if (!rawData || !timestamp) return null;

  const age = Date.now() - Number(timestamp);
  if (age > API_CONFIG.CACHE_DURATION) return null;

  return JSON.parse(rawData);
}

// Save a value to sessionStorage along with the current timestamp.
// The timestamp is checked by readCache to decide if the data is still fresh.
export function writeCache(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
  sessionStorage.setItem(`${key}_timestamp`, Date.now().toString());
}
