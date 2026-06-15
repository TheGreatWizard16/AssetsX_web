/*
 * cache.js
 * --------
 * Small helpers around sessionStorage used to avoid re-fetching the same
 * data from Finnhub too often.
 *
 * Every cached value is stored as two sessionStorage entries:
 *   - `<key>`            -> the JSON-encoded data
 *   - `<key>_timestamp`  -> the Date.now() value when it was stored
 *
 * `readCache` returns the parsed data only if it still exists AND is
 * younger than API_CONFIG.CACHE_DURATION. Otherwise it returns null,
 * which tells the caller it needs to fetch fresh data.
 */

import { API_CONFIG } from './config.js';

// Reads a cached value. Returns null if missing or expired.
export function readCache(key) {
  const rawData = sessionStorage.getItem(key);
  const timestamp = sessionStorage.getItem(`${key}_timestamp`);

  if (!rawData || !timestamp) {
    return null;
  }

  const age = Date.now() - Number(timestamp);
  if (age > API_CONFIG.CACHE_DURATION) {
    return null;
  }

  return JSON.parse(rawData);
}

// Stores a value (any JSON-serialisable data) along with the current time.
export function writeCache(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
  sessionStorage.setItem(`${key}_timestamp`, Date.now().toString());
}
