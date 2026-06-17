// Shared data store used across multiple pages.
// Market rows, news items, and user location are fetched once and saved here
// so any page can read them without making duplicate API calls.
export const appState = {
  marketRows: [],
  newsItems: [],
  userLocation: "Berlin, DE",
};
