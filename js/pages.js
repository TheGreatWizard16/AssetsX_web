// Functions that fill in the dynamic content for each page.
// Each renderXxxPage() matches a data-page value on the <body> tag.

import { appState } from './state.js';
import { fetchStockDetails, fetchStockCandles } from './api.js';
import { initStockChart, initDoughnutChart } from './charts.js';
import { sparkline, isTrendUp, formatTimeAgo } from './utils.js';
import { DEMO_HOLDINGS, DEMO_PORTFOLIO_SUMMARY, DEMO_ALLOCATION, DEMO_PORTFOLIO_CHART } from './config.js';
import { formatWithCurrency, getCurrency } from './currency.js';

// Fill the metrics grid with summary cards.
// Each metric is an array: [label, value, detail, isPositive]
export function renderMetrics(metrics) {
  const container = document.getElementById('metrics-container');
  if (!container) return;

  container.innerHTML = metrics.map(([label, value, detail, isPositive]) => `
    <article class="card metric-card ${isPositive ? 'metric-up' : 'metric-down'}">
      <div class="label">${label}</div>
      <span class="value">${value}</span>
      <small class="${isPositive ? "up" : "down"} mono">${detail}</small>
    </article>
  `).join("");
}

// Build the HTML for a single news card.
// `index` is stored as a data attribute so the click handler knows which article was clicked.
export function renderNewsCard(tag, title, copy, img, isLarge = false, timestamp = null, index = null) {
  const maxLength = 110;
  const truncatedCopy = copy && copy.length > maxLength ? `${copy.substring(0, maxLength)}...` : (copy || "");
  const timeLabel = timestamp ? formatTimeAgo(timestamp) : '2h ago';

  return `
    <article class="card news-card ${isLarge ? 'large' : ''}" data-news-index="${index}">
      ${img ? `<img src="${img}" class="news-preview-image" alt="${title}" loading="lazy">` : ''}
      <div class="news-content">
        <div class="news-meta">
          <span class="pill active">${tag}</span>
          <small class="mono">${timeLabel}</small>
        </div>
        <h4>${title}</h4>
        <p>${truncatedCopy}</p>
      </div>
    </article>
  `;
}


// ── Home page ─────────────────────────────────────────────────────────────────

// Render the watchlist sidebar with live price data from appState
function renderWatchlist() {
  const container = document.getElementById('watchlist-container');
  if (!container) return;

  container.innerHTML = appState.marketRows.map(([symbol, name, price, change, , country]) => {
    const up = isTrendUp(change);
    return `
    <div class="watch-row" data-symbol="${symbol}">
      <span class="watch-symbol">${symbol}</span>
      <span class="watch-name">${name}</span>
      ${sparkline(up)}
      <span class="price">
        ${convertPriceString(price)}
        <small><span class="change-badge ${up ? 'badge-up' : 'badge-down'}">${change}</span></small>
      </span>
      <span style="display:none">${country || ''}</span>
    </div>`;
  }).join("");
}

// Render the three most recent news articles on the home page
function renderHomeNewsFeed() {
  const container = document.getElementById('news-container');
  if (!container) return;

  container.innerHTML = appState.newsItems.slice(0, 3).map(([tag, title, copy, img, time], idx) =>
    renderNewsCard(tag, title, copy, img, false, time, idx)).join("");
}

// Look up a stock's current price from appState so the chart can start at the right value
function getMarketPrice(symbol) {
  const row = appState.marketRows.find(([rowSymbol]) => rowSymbol === symbol);
  if (!row) return undefined;
  return Number(row[2].replace(/[^0-9.-]/g, ''));
}

// Render the home page: watchlist, news feed, and portfolio performance chart
export function renderHomePage(now, monthAgo) {
  renderWatchlist();
  renderHomeNewsFeed();

  const aaplPrice = getMarketPrice('AAPL');
  fetchStockCandles('AAPL', 'D', monthAgo, now, aaplPrice).then(data => initStockChart('homeChart', data));
}


// ── Markets page ──────────────────────────────────────────────────────────────

// Convert a "$173.50" USD price string to the currently selected currency
function convertPriceString(priceStr) {
  const usd = parseFloat(priceStr.replace(/[$,]/g, ''));
  return isNaN(usd) ? priceStr : formatWithCurrency(usd);
}

// Render the live market price table with all watchlist stocks
export function renderMarketsPage() {
  const tbody = document.getElementById('market-table-body');
  if (!tbody) return;

  tbody.innerHTML = appState.marketRows.map(([symbol, name, price, change, volume, country]) => {
    const up = isTrendUp(change);
    return `
    <tr data-symbol="${symbol}">
      <td class="mono strong">${symbol}</td>
      <td>${name}</td>
      <td class="muted">${country || ''}</td>
      <td class="mono">${convertPriceString(price)}</td>
      <td><span class="change-badge ${up ? 'badge-up' : 'badge-down'}">${change}</span></td>
      <td class="mono muted">${volume}</td>
      <td>${sparkline(up)}</td>
      <td><button class="table-action" data-action="trade" data-symbol="${symbol}">Trade</button></td>
    </tr>`;
  }).join("");
}


// ── Stock detail page ─────────────────────────────────────────────────────────

// Formatting helpers — each returns 'N/A' when the Finnhub field is missing
function formatPrice(value) {
  return formatWithCurrency(value);
}

function formatNumber(value) {
  return typeof value === 'number' ? value.toFixed(2) : 'N/A';
}

function formatPercent(value) {
  return typeof value === 'number' ? `${value.toFixed(2)}%` : 'N/A';
}

// Finnhub reports market cap and volume in millions, so we convert to B/T as needed
function formatMarketCap(valueInMillions) {
  if (typeof valueInMillions !== 'number') return 'N/A';
  const { symbol, rate } = getCurrency();
  const converted = valueInMillions * rate;
  if (converted >= 1_000_000) return `${symbol}${(converted / 1_000_000).toFixed(2)}T`;
  if (converted >= 1_000) return `${symbol}${(converted / 1_000).toFixed(2)}B`;
  return `${symbol}${converted.toFixed(2)}M`;
}

function formatShares(valueInMillions) {
  return typeof valueInMillions === 'number' ? `${valueInMillions.toFixed(2)}M` : 'N/A';
}

// Update the page title in the topbar to show the stock symbol
function renderStockTitle(symbol) {
  const title = document.getElementById('stock-title');
  if (title) title.textContent = `${symbol} Details`;
}

// Render the hero card at the top of the stock detail page.
// Shows the logo, company name, current price, and buy/sell buttons.
function renderStockHero(symbol, details) {
  const hero = document.getElementById('stock-hero');
  if (!hero) return;

  const { profile, quote } = details;
  const isUp = quote.d >= 0;
  const sign = isUp ? '+' : '';

  // Trim the long Finnhub exchange string down to the exchange name only
  const exchange = (profile.exchange || 'N/A').split(' - ')[0];

  const logo = profile.logo
    ? `<img class="stock-logo" src="${profile.logo}" alt="${symbol} logo" loading="lazy" onerror="this.outerHTML='<div class=&quot;stock-logo stock-logo-fallback&quot;>${symbol[0]}</div>'">`
    : `<div class="stock-logo stock-logo-fallback">${symbol[0]}</div>`;

  // Add a green or red border/glow to the hero card based on price direction
  hero.classList.add(isUp ? 'trend-up' : 'trend-down');

  hero.innerHTML = `
    <div class="stock-identity">
      ${logo}
      <div>
        <h2>${symbol}</h2>
        <p>${profile.name || ''}</p>
        <div class="stock-tags">
          <span class="pill active">${exchange}</span>
          ${profile.finnhubIndustry ? `<span class="pill">${profile.finnhubIndustry}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="stock-price-block">
      <strong class="mono">${formatPrice(quote.c)}</strong>
      <span class="price-change mono ${isUp ? 'up' : 'down'}">${sign}${quote.d.toFixed(2)} (${sign}${quote.dp.toFixed(2)}%)</span>
      <div class="stock-actions">
        <button class="btn" data-action="sell">Sell</button>
        <button class="btn primary" data-action="buy">Buy</button>
      </div>
    </div>`;
}

// Render the quick stats row above the chart: open, high, low, prev close, market cap, volume
function renderStockQuickStats(details) {
  const container = document.getElementById('stock-quick-stats');
  if (!container) return;

  const { quote, metrics } = details;
  const stats = [
    ['OPEN', formatPrice(quote.o)],
    ['HIGH', formatPrice(quote.h)],
    ['LOW', formatPrice(quote.l)],
    ['PREV CLOSE', formatPrice(quote.pc)],
    ['MARKET CAP', formatMarketCap(metrics?.marketCapitalization)],
    ['AVG VOLUME', formatShares(metrics?.['10DayAverageTradingVolume'])],
  ];

  container.innerHTML = stats.map(([label, value]) => `
    <article class="card quick-stat">
      <div class="label">${label}</div>
      <span class="value">${value}</span>
    </article>`).join("");
}

// Render the key statistics sidebar on the stock detail page
function renderStockStats(details) {
  const rows = document.getElementById('stat-rows');
  if (!rows) return;

  const m = details.metrics || {};
  const stats = [
    ['MARKET CAP', formatMarketCap(m.marketCapitalization)],
    ['52W HIGH', formatPrice(m['52WeekHigh'])],
    ['52W LOW', formatPrice(m['52WeekLow'])],
    ['P/E (TTM)', formatNumber(m.peTTM)],
    ['EPS (TTM)', formatNumber(m.epsTTM)],
    ['BETA', formatNumber(m.beta)],
    ['DIV YIELD', formatPercent(m.dividendYieldIndicatedAnnual)],
  ];

  rows.innerHTML = stats.map(([label, value]) => `
    <div class="stat-row"><span>${label}</span><strong class="mono">${value}</strong></div>`).join("");
}

// Render the About card with company profile information
function renderStockAbout(details) {
  const grid = document.getElementById('stock-about');
  if (!grid) return;

  const p = details.profile;
  const rows = [
    ['Industry', p.finnhubIndustry || 'N/A'],
    ['Country', p.country || 'N/A'],
    ['IPO Date', p.ipo || 'N/A'],
    ['Shares Outstanding', formatShares(p.shareOutstanding)],
    ['Currency', p.currency || 'N/A'],
    ['Website', p.weburl
      ? `<a href="${p.weburl}" target="_blank" rel="noopener">${p.weburl.replace(/^https?:\/\//, '')}</a>`
      : 'N/A'],
  ];

  grid.innerHTML = rows.map(([label, value]) => `
    <div class="about-row"><span>${label}</span><strong>${value}</strong></div>`).join("");
}

// Show the three most recent news articles related to the stock
function renderStockNews(details) {
  const grid = document.getElementById('stock-news-container');
  if (!grid || !details.news) return;

  grid.innerHTML = details.news.slice(0, 3).map(([tag, title, copy, img, time], idx) =>
    renderNewsCard(tag, title, copy, img, true, time, `stock-${idx}`)).join("");
}

// Render the 52-week range bar showing where the current price sits between the low and high.
// The fill percentage is calculated as: (current - low) / (high - low) * 100
function renderStockRange(details) {
  const container = document.getElementById('stock-range');
  if (!container) return;

  const m = details.metrics || {};
  const low  = m['52WeekLow'];
  const high = m['52WeekHigh'];
  const cur  = details.quote.c;

  if (!low || !high || low >= high) { container.style.display = 'none'; return; }

  const pct = Math.min(100, Math.max(0, ((cur - low) / (high - low)) * 100)).toFixed(1);

  container.innerHTML = `
    <div class="range-header">
      <span class="label">52-WEEK RANGE</span>
      <span class="mono muted">${formatPrice(cur)} current</span>
    </div>
    <div class="range-track">
      <div class="range-fill" style="width: ${pct}%"></div>
      <div class="range-thumb" style="left: ${pct}%"></div>
    </div>
    <div class="range-extremes">
      <span>${formatPrice(low)} low</span>
      <span>${formatPrice(high)} high</span>
    </div>`;
}

// Render the full stock detail page: hero, stats, chart, news, and range bar.
// The symbol comes from the URL query string (?symbol=AAPL).
export function renderStockPage(now, monthAgo) {
  const params = new URLSearchParams(location.search);
  const symbol = params.get('symbol') || 'AAPL';

  fetchStockDetails(symbol).then((details) => {
    if (!details) return;

    renderStockTitle(symbol);
    renderStockHero(symbol, details);
    renderStockQuickStats(details);
    renderStockRange(details);
    renderStockStats(details);
    renderStockAbout(details);
    renderStockNews(details);

    fetchStockCandles(symbol, 'D', monthAgo, now, details.quote.c).then(data => initStockChart('stockChart', data));
  });
}


// ── Portfolio page ────────────────────────────────────────────────────────────

// Render the portfolio summary card — left side has balance + stat tiles, right has a performance chart
function renderPortfolioSummary() {
  const summary = document.getElementById('portfolio-summary');
  if (!summary) return;

  const s = DEMO_PORTFOLIO_SUMMARY;
  summary.innerHTML = `
    <div class="portfolio-summary-left">
      <div class="portfolio-balance">
        <p class="eyebrow">TOTAL PORTFOLIO VALUE</p>
        <h2 class="mono">${s.totalValue}</h2>
        <span class="price-change mono ${isTrendUp(s.todayChange) ? 'up' : 'down'}">${s.todayChange} today</span>
      </div>
      <div class="portfolio-stat-tiles">
        <div class="portfolio-stat-tile">
          <span>Invested</span>
          <strong class="mono">${s.invested}</strong>
        </div>
        <div class="portfolio-stat-tile">
          <span>Total Gain</span>
          <strong class="mono ${isTrendUp(s.totalGain) ? 'up' : 'down'}">${s.totalGain}</strong>
        </div>
        <div class="portfolio-stat-tile">
          <span>Holdings</span>
          <strong class="mono">${DEMO_HOLDINGS.length} assets</strong>
        </div>
      </div>
    </div>
    <div class="portfolio-summary-right">
      <div class="range-tabs">
        <span class="pill active">1M</span>
        <span class="pill">3M</span>
        <span class="pill">1Y</span>
      </div>
      <div class="portfolio-mini-chart">
        <canvas id="portfolioChart" class="chart"></canvas>
      </div>
    </div>
  `;
}

// Render the donut chart and legend for asset allocation
function renderPortfolioAllocation() {
  const legend = document.getElementById('allocation-legend');
  if (!legend) return;

  initDoughnutChart('allocationChart', {
    labels: DEMO_ALLOCATION.map(a => a.label),
    values: DEMO_ALLOCATION.map(a => a.pct),
    colors: DEMO_ALLOCATION.map(a => a.color),
  });

  legend.innerHTML = DEMO_ALLOCATION.map(({ label, value, pct, color }) => `
    <div class="allocation-legend-row">
      <span class="allocation-dot" style="background: ${color};"></span>
      <span class="name">${label}</span>
      <span class="pct mono">${pct.toFixed(1)}%</span>
      <span class="value mono">${value}</span>
    </div>`).join("");
}

// Render the portfolio page: summary card with chart, donut allocation, and holdings with sparklines
export function renderPortfolioPage() {
  renderPortfolioSummary();
  // Chart canvas is now in the DOM after renderPortfolioSummary injects it
  initStockChart('portfolioChart', DEMO_PORTFOLIO_CHART);
  renderPortfolioAllocation();

  const container = document.getElementById('holdings-container');
  if (!container) return;

  container.innerHTML = DEMO_HOLDINGS.map(({ symbol, name, shares, avgCost, price, value, totalGain }) => {
    const up = isTrendUp(totalGain);
    return `
    <div class="holdings-row">
      <div class="asset-name">
        <span class="ticker-avatar">${symbol[0]}</span>
        <div><strong>${symbol}</strong><small>${name} • ${shares}</small></div>
      </div>
      <span class="col mono">${avgCost}</span>
      <span class="col mono">${price}</span>
      <span class="col mono">${value}</span>
      <span class="col sparkline-col">${sparkline(up)}</span>
      <span class="col mono ${up ? 'up' : 'down'}">${totalGain}</span>
    </div>`;
  }).join("");
}


// ── News page ─────────────────────────────────────────────────────────────────

// Find a news article by its ID from the URL.
// IDs starting with "stock-" look in the cached stock news; plain numbers look in the general news list.
function findNewsArticle(newsId) {
  if (!newsId) return null;

  if (newsId.startsWith('stock-')) {
    const params = new URLSearchParams(location.search);
    const symbol = params.get('symbol');
    const stockData = JSON.parse(sessionStorage.getItem(`assetsx_stock_details_${symbol}`));
    return stockData?.news[newsId.split('-')[1]];
  }

  return appState.newsItems[newsId];
}

// Render a full article reader view for a single news item
function renderNewsArticle(grid, article) {
  const [tag, title, summary, img, time, url] = article;

  grid.style.gridTemplateColumns = '1fr';
  grid.innerHTML = `
    <div class="card" style="padding: 32px; max-width: 800px; margin: 0 auto;">
      <button class="btn" onclick="history.back()" style="margin-bottom: 24px;">← Back</button>
      <div class="news-meta"><span class="pill active">${tag}</span><small class="mono">${formatTimeAgo(time)}</small></div>
      <h1 style="margin: 16px 0 24px;">${title}</h1>
      ${img ? `<img src="${img}" style="width:100%; border-radius:12px; margin-bottom:24px; max-height:400px; object-fit:cover;">` : ''}
      <p style="font-size: 18px; line-height: 1.6; color: var(--muted);">${summary}</p>
      <a href="${url}" target="_blank" class="btn primary" style="display:inline-block; margin-top:32px;">Read Full Story on ${tag} ↗</a>
    </div>
  `;
}

// Render the full news grid
function renderNewsGrid(grid) {
  grid.innerHTML = appState.newsItems.map(([tag, title, copy, img, time], idx) =>
    renderNewsCard(tag, title, copy, img, true, time, idx)).join("");
}

// Show a single article if ?id= is in the URL, otherwise show the full news grid
export function renderNewsPage() {
  const params = new URLSearchParams(location.search);
  const newsId = params.get('id');
  const grid = document.getElementById('news-grid');
  if (!grid) return;

  const article = findNewsArticle(newsId);

  if (article) {
    renderNewsArticle(grid, article);
  } else {
    renderNewsGrid(grid);
  }
}


// ── Auth pages ────────────────────────────────────────────────────────────────

// Draw the preview chart on the auth page left panel
export function renderAuthPage() {
  initStockChart('miniChart', {
    labels: Array.from({ length: 20 }, (_, i) => i + 1),
    prices: [18, 22, 19, 25, 23, 28, 26, 30, 27, 32, 31, 35, 33, 38, 36, 40, 38, 43, 41, 45],
  });
}
