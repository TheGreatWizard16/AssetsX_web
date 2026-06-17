import { API_CONFIG, WATCHLIST_SYMBOLS, SYMBOL_NAMES, SYMBOL_COUNTRIES, FALLBACK_MARKET_ROWS, FALLBACK_QUOTE } from './config.js';
import { readCache, writeCache } from './cache.js';
import { appState } from './state.js';
import { showToast } from './utils.js';


// ── Market data ──────────────────────────────────────────────────────────────

// Get a single stock quote from Finnhub.
// Falls back to demo numbers if the request fails so the page still renders.
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

// Convert a raw Finnhub quote object into a display row for the market table.
// Row format: [symbol, name, price, change%, volume, country]
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
    SYMBOL_COUNTRIES[quote.symbol] || "Global",
  ];
}

// Load live prices for all watchlist stocks and save them to appState.
// Results are cached for 5 minutes to avoid hitting the API on every page load.
export async function fetchMarketData() {
  try {
    const cachedRows = readCache('assetsx_market_data');
    if (cachedRows) {
      appState.marketRows = cachedRows;
      return;
    }

    const quotes = await Promise.all(WATCHLIST_SYMBOLS.map(fetchQuote));
    appState.marketRows = quotes.map(buildMarketRow);
    writeCache('assetsx_market_data', appState.marketRows);
  } catch (error) {
    console.warn("Market data fetch failed:", error);
    appState.marketRows = FALLBACK_MARKET_ROWS;
    showToast("Using static data (Market API limited).");
  }
}


// ── General news ─────────────────────────────────────────────────────────────

// Convert a raw Finnhub news article into the format news cards expect:
// [category, headline, summary, image, timestamp, url]
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

// Fetch the latest market news and save it to appState.
// We only keep 12 articles so the news page doesn't get too long.
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
    console.error("News fetch failed:", error);
  }
}


// ── Stock detail page ─────────────────────────────────────────────────────────

// Convert a company-specific news article into the format news cards expect.
// Finnhub article URLs sometimes redirect to their homepage on the free plan,
// so we fall back to a Google search link for the headline.
function buildStockNewsRow(article) {
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

// Fetch everything needed for the stock detail page in one go:
// company profile, current quote, key metrics, and recent news.
export async function fetchStockDetails(symbol) {
  try {
    const cacheKey = `assetsx_stock_details_${symbol}`;
    const cachedDetails = readCache(cacheKey);
    if (cachedDetails && cachedDetails.profile && cachedDetails.quote) {
      return cachedDetails;
    }

    const today = new Date().toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [profile, quote, metrics, news] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${API_CONFIG.FINNHUB_KEY}`).then(r => r.json()),
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_CONFIG.FINNHUB_KEY}`).then(r => r.json()),
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metricType=all&token=${API_CONFIG.FINNHUB_KEY}`).then(r => r.json()),
      fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${monthAgo}&to=${today}&token=${API_CONFIG.FINNHUB_KEY}`).then(r => r.json()),
    ]);

    // If the API returned incomplete data (e.g. rate limit hit), stop here
    if (!profile || !profile.name || !quote || !quote.c) {
      showToast(`Could not load details for ${symbol}. API limit?`);
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
    console.error(`Details fetch failed for ${symbol}:`, error);
    return null;
  }
}


// ── Price history charts ──────────────────────────────────────────────────────

const CHART_DEMO_DAYS = 30;

// Generate a consistent starting price from a stock symbol's letters.
// This keeps demo charts stable across page refreshes rather than random.
function seedPriceFromSymbol(symbol) {
  let total = 0;
  for (const char of symbol) total += char.charCodeAt(0);
  return 50 + (total % 300);
}

// Build a fake price history ending at referencePrice.
// Used when the Finnhub candle endpoint is unavailable on the free plan.
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

    // Walk backwards with small random movements to simulate a real price history
    price -= (Math.random() - 0.5) * (endPrice * 0.02);
  }

  return { labels, prices };
}

// Fetch OHLC candle data for the stock price chart.
// The cache key includes the `from` timestamp so different date ranges
// (1D, 1M, 3M, 1Y) don't overwrite each other in the cache.
export async function fetchStockCandles(symbol, resolution, from, to, referencePrice) {
  try {
    const cacheKey = `assetsx_stock_candles_${symbol}_${resolution}_${from}`;
    const cachedCandles = readCache(cacheKey);
    if (cachedCandles && cachedCandles.labels && cachedCandles.prices) {
      return cachedCandles;
    }

    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${API_CONFIG.FINNHUB_KEY}`;
    const response = await fetch(url);

    if (response.status === 429) {
      showToast("API rate limit reached. Try again in 60 seconds.");
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

    // No candle data available, so use generated demo data
    const fallbackChart = generateFallbackCandles(symbol, referencePrice);
    writeCache(cacheKey, fallbackChart);
    return fallbackChart;
  } catch (error) {
    console.error(`Candle fetch failed for ${symbol}:`, error);
    return generateFallbackCandles(symbol, referencePrice);
  }
}


// ── User location ─────────────────────────────────────────────────────────────

// Update the location and date text shown in the page header
function updateHeaderSubtitle() {
  const subtitle = document.getElementById('header-subtitle');
  if (subtitle) {
    subtitle.textContent = `${appState.userLocation} • Market open • ${new Date().toLocaleDateString()}`;
  }
}

// Detect the user's city from their IP address and update the header.
// Result is cached in sessionStorage so we only call the API once per session.
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
    console.error("Geolocation failed:", error);
    updateHeaderSubtitle();
  }
}
