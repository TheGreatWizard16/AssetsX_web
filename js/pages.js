// Functions that fill in the dynamic content for each page.
// Each renderXxxPage() maps to a data-page value on the <body> tag.

import { appState } from './state.js';
import { fetchStockDetails, fetchStockCandles } from './api.js';
import { initStockChart } from './charts.js';
import { sparkline, isTrendUp, formatTimeAgo } from './utils.js';
import { DEMO_HOLDINGS, DEMO_PORTFOLIO_SUMMARY, DEMO_ALLOCATION } from './config.js';
import { formatWithCurrency, getCurrency } from './currency.js';

// Fills the metrics grid (Home + Portfolio) with summary cards.
// `metrics` is an array of [label, value, detail, isPositive] tuples.
export function renderMetrics(metrics) {
  const container = document.getElementById('metrics-container');
  if (!container) return;

  container.innerHTML = metrics.map(([label, value, detail, isPositive]) => `
    <article class="card metric-card">
      <div class="label">${label}</div>
      <span class="value">${value}</span>
      <small class="${isPositive ? "up" : "down"} mono">${detail}</small>
    </article>
  `).join("");
}

// Builds the HTML for a single news card. `index` is stored on the card
// as a data attribute so events.js can work out which article was
// clicked. `isLarge` switches between the small (3-up) and large (2-up)
// card styles.
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

// ── Home page ────────────────────────────────────────────────────────────────

function renderWatchlist() {
  const container = document.getElementById('watchlist-container');
  if (!container) return;

  container.innerHTML = appState.marketRows.map(([symbol, name, price, change]) => `
    <div class="watch-row" data-symbol="${symbol}">
      <span class="watch-symbol">${symbol}</span><span class="watch-name">${name}</span>
      ${sparkline(isTrendUp(change))}<span class="price">${convertPriceString(price)}<small class="${isTrendUp(change) ? 'up' : 'down'}">${change}</small></span>
    </div>`).join("");
}

function renderHomeNewsFeed() {
  const container = document.getElementById('news-container');
  if (!container) return;

  container.innerHTML = appState.newsItems.slice(0, 3).map(([tag, title, copy, img, time], idx) =>
    renderNewsCard(tag, title, copy, img, false, time, idx)).join("");
}

// Looks up a symbol's current price (e.g. "$291.58" -> 291.58) from the
// already-loaded market rows, so charts can be anchored to it.
function getMarketPrice(symbol) {
  const row = appState.marketRows.find(([rowSymbol]) => rowSymbol === symbol);
  if (!row) return undefined;
  return Number(row[2].replace(/[^0-9.-]/g, ''));
}

// Renders the watchlist, recent news, and the AAPL performance chart.
export function renderHomePage(now, monthAgo) {
  renderWatchlist();
  renderHomeNewsFeed();

  const aaplPrice = getMarketPrice('AAPL');
  fetchStockCandles('AAPL', 'D', monthAgo, now, aaplPrice).then(data => initStockChart('homeChart', data));
}

// ── Markets page ─────────────────────────────────────────────────────────────

// Converts a "$173.50" USD price string to the selected currency.
function convertPriceString(priceStr) {
  const usd = parseFloat(priceStr.replace(/[$,]/g, ''));
  return isNaN(usd) ? priceStr : formatWithCurrency(usd);
}

// Fills the live market price table.
export function renderMarketsPage() {
  const tbody = document.getElementById('market-table-body');
  if (!tbody) return;

  tbody.innerHTML = appState.marketRows.map(([symbol, name, price, change, volume]) => `
    <tr data-symbol="${symbol}">
      <td class="mono strong">${symbol}</td><td>${name}</td>
      <td class="mono">${convertPriceString(price)}</td>
      <td class="mono ${isTrendUp(change) ? 'up' : 'down'}">${change}</td>
      <td class="mono muted">${volume}</td>
      <td>${sparkline(isTrendUp(change))}</td>
      <td><button class="table-action" data-action="trade">Trade</button></td>
    </tr>`).join("");
}

// ── Stock detail page ─────────────────────────────────────────────────────────

// Formatting helpers for the stock detail page. Each returns 'N/A' when
// the underlying Finnhub field is missing (common on free-tier API keys).
function formatPrice(value) {
  return formatWithCurrency(value);
}

function formatNumber(value) {
  return typeof value === 'number' ? value.toFixed(2) : 'N/A';
}

function formatPercent(value) {
  return typeof value === 'number' ? `${value.toFixed(2)}%` : 'N/A';
}

// Finnhub reports market cap and trading volume in millions.
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

function renderStockTitle(symbol) {
  const title = document.getElementById('stock-title');
  if (title) title.textContent = `${symbol} Details`;
}

function renderStockHero(symbol, details) {
  const hero = document.getElementById('stock-hero');
  if (!hero) return;

  const { profile, quote } = details;
  const isUp = quote.d >= 0;
  const sign = isUp ? '+' : '';

  // Trim the full Finnhub exchange string ("NASDAQ NMS - GLOBAL MARKET" → "NASDAQ NMS")
  const exchange = (profile.exchange || 'N/A').split(' - ')[0];

  const logo = profile.logo
    ? `<img class="stock-logo" src="${profile.logo}" alt="${symbol} logo" loading="lazy" onerror="this.outerHTML='<div class=&quot;stock-logo stock-logo-fallback&quot;>${symbol[0]}</div>'">`
    : `<div class="stock-logo stock-logo-fallback">${symbol[0]}</div>`;

  // Price block and Sell/Buy buttons are grouped on the right so the hero
  // always renders as two columns: identity left, price+actions right.
  hero.innerHTML = `
    <div class="stock-identity">
      ${logo}
      <div>
        <div class="stock-tags">
          <span class="pill active">${exchange}</span>
          ${profile.finnhubIndustry ? `<span class="pill">${profile.finnhubIndustry}</span>` : ''}
        </div>
        <h2>${symbol}</h2>
        <p>${profile.name || ''}</p>
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

// Fills the "today's range" row above the chart with the quote's
// open/high/low/previous close, plus market cap and average volume.
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

// Fills the "About" card with company profile details.
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

function renderStockNews(details) {
  const grid = document.getElementById('stock-news-container');
  if (!grid || !details.news) return;

  // Only show 3 articles so the page doesn't become too long
  grid.innerHTML = details.news.slice(0, 3).map(([tag, title, copy, img, time], idx) =>
    renderNewsCard(tag, title, copy, img, true, time, `stock-${idx}`)).join("");
}

// Looks up the symbol from the URL (defaults to AAPL), fetches its
// details, and fills in the hero, stats, news, and price chart.
export function renderStockPage(now, monthAgo) {
  const params = new URLSearchParams(location.search);
  const symbol = params.get('symbol') || 'AAPL';

  fetchStockDetails(symbol).then((details) => {
    if (!details) return;

    renderStockTitle(symbol);
    renderStockHero(symbol, details);
    renderStockQuickStats(details);
    renderStockStats(details);
    renderStockAbout(details);
    renderStockNews(details);

    fetchStockCandles(symbol, 'D', monthAgo, now, details.quote.c).then(data => initStockChart('stockChart', data));
  });
}

// ── Portfolio page ────────────────────────────────────────────────────────────

// Fills the top-line summary card (total value, today's change, total gain).
function renderPortfolioSummary() {
  const summary = document.getElementById('portfolio-summary');
  if (!summary) return;

  const s = DEMO_PORTFOLIO_SUMMARY;
  summary.innerHTML = `
    <div class="portfolio-balance">
      <p class="eyebrow">TOTAL PORTFOLIO VALUE</p>
      <h2 class="mono">${s.totalValue}</h2>
      <span class="price-change mono ${isTrendUp(s.todayChange) ? 'up' : 'down'}">${s.todayChange} today</span>
    </div>
    <div class="portfolio-summary-stats">
      <div><span>Invested</span><strong class="mono">${s.invested}</strong></div>
      <div><span>Total Gain</span><strong class="mono ${isTrendUp(s.totalGain) ? 'up' : 'down'}">${s.totalGain}</strong></div>
      <div><span>Holdings</span><strong class="mono">${DEMO_HOLDINGS.length} assets</strong></div>
    </div>`;
}

// Fills the asset allocation stacked bar and its legend.
function renderPortfolioAllocation() {
  const bar = document.getElementById('allocation-bar');
  const legend = document.getElementById('allocation-legend');
  if (!bar || !legend) return;

  bar.innerHTML = DEMO_ALLOCATION.map(({ pct, color }) =>
    `<span style="width: ${pct}%; background: ${color};"></span>`).join("");

  legend.innerHTML = DEMO_ALLOCATION.map(({ label, value, pct, color }) => `
    <div class="allocation-legend-row">
      <span class="allocation-dot" style="background: ${color};"></span>
      <span class="name">${label}</span>
      <span class="pct mono">${pct.toFixed(1)}%</span>
      <span class="value mono">${value}</span>
    </div>`).join("");
}

// Fills the holdings table with demo portfolio positions.
export function renderPortfolioPage() {
  renderPortfolioSummary();
  renderPortfolioAllocation();

  const container = document.getElementById('holdings-container');
  if (!container) return;

  container.innerHTML = DEMO_HOLDINGS.map(({ symbol, name, shares, avgCost, price, value, totalGain }) => `
    <div class="holdings-row">
      <div class="asset-name">
        <span class="ticker-avatar">${symbol[0]}</span>
        <div><strong>${symbol}</strong><small>${name} • ${shares}</small></div>
      </div>
      <span class="col mono">${avgCost}</span>
      <span class="col mono">${price}</span>
      <span class="col mono">${value}</span>
      <span class="col mono ${isTrendUp(totalGain) ? 'up' : 'down'}">${totalGain}</span>
    </div>`).join("");
}

// ── News page ─────────────────────────────────────────────────────────────────

// Looks up a single article by its `id` query parameter. IDs starting
// with "stock-" refer to a company-specific article cached alongside
// that stock's details; plain numeric IDs refer to the general news list.
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

// Renders the full-article "reader" view for a single news item.
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

// Renders the grid of all general news articles.
function renderNewsGrid(grid) {
  grid.innerHTML = appState.newsItems.map(([tag, title, copy, img, time], idx) =>
    renderNewsCard(tag, title, copy, img, true, time, idx)).join("");
}

// Shows either a single article (if `?id=` is present and found) or the
// full news grid.
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

// Draws the small demo chart shown next to the auth forms.
export function renderAuthPage() {
  initStockChart('miniChart', { labels: [1, 2, 3, 4, 5], prices: [10, 15, 8, 20, 18] });
}
