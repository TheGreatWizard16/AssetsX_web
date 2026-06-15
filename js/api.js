/*
 * api.js
 * ------
 * All network requests to external services live here:
 *   - Finnhub: market quotes, company news, company profile/metrics, candles
 *   - ipapi.co: rough user location for the dashboard header
 *
 * Every function follows the same pattern:
 *   1. Check sessionStorage for a recent cached result (see cache.js).
 *   2. If nothing usable is cached, fetch fresh data from the API.
 *   3. Store the fresh result in the cache for next time.
 *   4. Fall back to demo data if the request fails.
 *
 * Results are written into `appState` (see state.js) so the page-render
 * functions in pages.js can read them.
 */

import { API_CONFIG, WATCHLIST_SYMBOLS, SYMBOL_NAMES, FALLBACK_MARKET_ROWS, FALLBACK_QUOTE } from './config.js';
import { readCache, writeCache } from './cache.js';
import { appState } from './state.js';
import { showToast } from './utils.js';

/* ----------------------------------------------------------------------
 * Market data (Home + Markets pages)
 * ------------------------------------------------------------------- */

// Fetches a single quote for one symbol, falling back to demo numbers
// if Finnhub returns an error for that symbol.
function fetchQuote(symbol) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_CONFIG.FINNHUB_KEY}`;

  return fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error("API Limit");
      return response.json();
    })
    .then((data) => ({ symbol, ...data }))
    .catch(() => ({ symbol, ...FALLBACK_QUOTE }));
}

// Converts a raw Finnhub quote into the [symbol, name, price, change, volume]
// row format used by the Home and Markets tables.
function buildMarketRow(quote) {
  const price = typeof quote.c === 'number' ? quote.c : FALLBACK_QUOTE.c;
  const change = typeof quote.d === 'number' ? quote.d : 0;
  const changePercent = typeof quote.dp === 'number' ? quote.dp : 0;

  return [
    quote.symbol,
    SYMBOL_NAMES[quote.symbol] || "Company",
    `$${price.toFixed(2)}`,
    `${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
    "N/A",
  ];
}

// Fetches quotes for the watchlist symbols and stores them in
// appState.marketRows. Uses a 5 minute sessionStorage cache, and falls
// back to fully static demo rows if the API is unreachable.
export async function fetchMarketData() {
  try {
    const cachedRows = readCache('assetsx_market_data');
    if (cachedRows) {
      console.log("AssetsX: Using cached market data.");
      appState.marketRows = cachedRows;
      return;
    }

    console.log("Fetching fresh market data from API...");
    const quotes = await Promise.all(WATCHLIST_SYMBOLS.map(fetchQuote));
    appState.marketRows = quotes.map(buildMarketRow);

    writeCache('assetsx_market_data', appState.marketRows);
  } catch (error) {
    console.warn("Finnhub API Error:", error);
    appState.marketRows = FALLBACK_MARKET_ROWS;
    showToast("Using static data (Market API limited).");
  }
}

/* ----------------------------------------------------------------------
 * General market news (Home + News pages)
 * ------------------------------------------------------------------- */

// Converts a raw Finnhub news article into the
// [tag, title, summary, image, timestamp, url] row format used by
// renderNewsCard().
function buildGeneralNewsRow(article) {
  return [
    article.category.toUpperCase(),
    article.headline.replace(/&amp;/g, '&'),
    article.summary,
    article.image || 'https://images.unsplash.com/photo-1611974714851-48206138d731?auto=format&fit=crop&q=80&w=400',
    article.datetime,
    article.url,
  ];
}

// Fetches the latest general market news (up to 12 articles) and stores
// them in appState.newsItems. Uses a 5 minute sessionStorage cache.
export async function fetchGeneralNews() {
  try {
    const cachedNews = readCache('assetsx_market_news');
    if (cachedNews) {
      appState.newsItems = cachedNews;
      return;
    }

    const url = `https://finnhub.io/api/v1/news?category=general&token=${API_CONFIG.FINNHUB_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (Array.isArray(data)) {
      appState.newsItems = data.slice(0, 12).map(buildGeneralNewsRow);
      writeCache('assetsx_market_news', appState.newsItems);
    }
  } catch (error) {
    console.error("Error fetching general news:", error);
  }
}

/* ----------------------------------------------------------------------
 * Single stock details (Stock page)
 * ------------------------------------------------------------------- */

// Converts a raw Finnhub company-news article into the row format used
// by renderNewsCard(). Stock news uses a different fallback image and
// does not need the &amp; clean-up that general news headlines do.
function buildStockNewsRow(article) {
  // Finnhub's company-news `url` is a redirect link (finnhub.io/api/news?id=...)
  // that just bounces back to Finnhub's homepage on this API plan instead of
  // the real article, so fall back to a search link for the headline instead.
  const articleUrl = article.url && !article.url.includes('finnhub.io')
    ? article.url
    : `https://www.google.com/search?q=${encodeURIComponent(`${article.source} ${article.headline}`)}`;

  return [
    article.source,
    article.headline,
    article.summary,
    article.image || 'https://via.placeholder.com/400x200/131315/e4e2e4?text=News',
    article.datetime,
    articleUrl,
  ];
}

// Fetches everything needed for the stock detail page: company profile,
// current quote, key metrics, and recent company news. Returns null if
// the data can't be loaded (and shows a toast explaining why).
export async function fetchStockDetails(symbol) {
  try {
    const cacheKey = `assetsx_stock_details_${symbol}`;
    const cachedDetails = readCache(cacheKey);
    if (cachedDetails && cachedDetails.profile && cachedDetails.quote) {
      console.log(`AssetsX: Using cached details for ${symbol}.`);
      return cachedDetails;
    }

    const today = new Date().toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [profile, quote, metrics, news] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${API_CONFIG.FINNHUB_KEY}`).then(r => r.json()),
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_CONFIG.FINNHUB_KEY}`).then(r => r.json()),
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metricType=all&token=${API_CONFIG.FINNHUB_KEY}`).then(r => r.json()), // Note: Free tier might not have all metrics
      fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${monthAgo}&to=${today}&token=${API_CONFIG.FINNHUB_KEY}`).then(r => r.json()),
    ]);

    if (!profile || !profile.name || !quote || !quote.c) {
      console.error(`Finnhub API returned incomplete data for ${symbol}. Profile:`, profile, "Quote:", quote);
      showToast(`Error: Could not get full details for ${symbol}. API limit?`);
      return null;
    }

    const details = {
      profile,
      quote,
      metrics: metrics.metric,
      news: news.slice(0, 6).map(buildStockNewsRow),
    };

    writeCache(cacheKey, details);
    return details;
  } catch (error) {
    console.error(`Error fetching details for ${symbol}:`, error);
    return null;
  }
}

/* ----------------------------------------------------------------------
 * Price history for charts (Home + Stock pages)
 * ------------------------------------------------------------------- */

const CHART_DEMO_DAYS = 30;

// Turns a stock symbol into a stable "seed" price between $50 and $350,
// so a symbol without a known current price still gets a consistent
// looking demo chart.
function seedPriceFromSymbol(symbol) {
  let total = 0;
  for (const char of symbol) total += char.charCodeAt(0);
  return 50 + (total % 300);
}

// Generates a demo price history ending at `referencePrice` (or a
// symbol-based seed price if none is given). Used as a fallback when
// Finnhub's candle endpoint is unavailable, so the price chart always has
// something to draw. The walk is built backwards from today so the most
// recent point lines up with the price shown elsewhere on the page.
function generateFallbackCandles(symbol, referencePrice) {
  const endPrice = referencePrice || seedPriceFromSymbol(symbol);
  const labels = new Array(CHART_DEMO_DAYS + 1);
  const prices = new Array(CHART_DEMO_DAYS + 1);

  let price = endPrice;
  for (let daysAgo = 0; daysAgo <= CHART_DEMO_DAYS; daysAgo++) {
    const index = CHART_DEMO_DAYS - daysAgo;
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    labels[index] = date.toLocaleDateString();
    prices[index] = Number(price.toFixed(2));

    // Step backwards in time with a small random change.
    price -= (Math.random() - 0.5) * (endPrice * 0.02);
  }

  return { labels, prices };
}

// Fetches daily candle (price history) data for a symbol so it can be
// drawn with Chart.js. Returns { labels, prices }. If Finnhub's candle
// endpoint is unavailable (free-tier accounts don't have access to it),
// demo price history is generated instead so the chart still renders.
export async function fetchStockCandles(symbol, resolution, from, to, referencePrice) {
  try {
    const cacheKey = `assetsx_stock_candles_${symbol}_${resolution}`;
    const cachedCandles = readCache(cacheKey);
    if (cachedCandles && cachedCandles.labels && cachedCandles.prices) {
      console.log(`AssetsX: Using cached candles for ${symbol}.`);
      return cachedCandles;
    }

    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${API_CONFIG.FINNHUB_KEY}`;
    const response = await fetch(url);

    if (response.status === 429) {
      showToast("Finnhub rate limit reached. Wait 60s.");
      return null;
    }

    const data = await response.json();

    if (data.s === 'ok' && data.t && data.c) {
      const chartData = {
        labels: data.t.map(ts => new Date(ts * 1000).toLocaleDateString()),
        prices: data.c,
      };
      writeCache(cacheKey, chartData);
      return chartData;
    }

    const reason = data.s === 'no_data' ? 'Market closed/No data' : 'API Error';
    console.warn(`Finnhub: ${symbol} - ${reason}. Showing demo chart data instead.`);

    const fallbackChart = generateFallbackCandles(symbol, referencePrice);
    writeCache(cacheKey, fallbackChart);
    return fallbackChart;
  } catch (error) {
    console.error(`Error fetching candles for ${symbol}:`, error);
    return generateFallbackCandles(symbol, referencePrice);
  }
}

/* ----------------------------------------------------------------------
 * User location (dashboard header subtitle)
 * ------------------------------------------------------------------- */

// Updates the "City, Country • Market open • Date" text in the topbar.
function updateHeaderSubtitle() {
  const subtitle = document.getElementById('header-subtitle');
  if (subtitle) {
    subtitle.textContent = `${appState.userLocation} • Market open • ${new Date().toLocaleDateString()}`;
  }
}

// Detects the user's city via ipapi.co and stores it in
// appState.userLocation, then updates the header subtitle. The location
// is cached in sessionStorage indefinitely (for the browser session)
// once it has been detected once.
export async function initGeolocation() {
  try {
    const cachedLocation = sessionStorage.getItem('assetsx_user_location');
    if (cachedLocation) {
      appState.userLocation = cachedLocation;
      updateHeaderSubtitle();
      return;
    }

    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    if (data.city) {
      appState.userLocation = `${data.city}, ${data.country_code}`;
      sessionStorage.setItem('assetsx_user_location', appState.userLocation);
    }

    updateHeaderSubtitle();
  } catch (error) {
    console.error("Geolocation Error:", error);
    // Still update the subtitle (using the default location) so it
    // doesn't stay stuck on "Loading market context..." forever.
    updateHeaderSubtitle();
  }
}
