/*
 * state.js
 * --------
 * Small shared "in-memory" store for data that is fetched once and then
 * used by several different functions/pages (market rows, news items,
 * the user's detected location).
 *
 * This replaces the old top-level `let marketRows = []` style globals in
 * app.js. Other modules import `appState` and read/write its properties,
 * so there is a single, clearly-named source of truth.
 */

export const appState = {
  marketRows: [],
  newsItems: [],
  userLocation: "Berlin, DE",
};
