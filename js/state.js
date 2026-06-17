// Shared data store — market rows, news, and user location are fetched once
// and saved here so every page can read them without making duplicate API calls.
export const appState = {
  marketRows: [],
  newsItems: [],
  userLocation: "Berlin, DE",
};
