// All click and input event listeners for the app.
// bindInteractions() is called after the page renders so listeners attach to real elements.

import { showToast } from './utils.js';
import { auth } from './firebase.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { fetchStockCandles } from './api.js';
import { initStockChart } from './charts.js';

// Handle every button that has a data-action attribute
function bindActionButtons() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", (e) => handleAction(button, e));
  });
}

// Decide what happens when a data-action button is clicked
function handleAction(button, e) {
  const action = button.dataset.action;

  switch (action) {
    case "trade": {
      const symbol = button.dataset.symbol || 'AAPL';
      location.href = `stock.html?symbol=${symbol}`;
      break;
    }

    case "buy":
      showToast("Demo buy order prepared.");
      break;

    case "sell":
      showToast("Demo sell order prepared.");
      break;

    case "forgot":
      // Handled in main.js by bindForgotPassword() which calls Firebase sendPasswordResetEmail
      break;

    case "social-google":
      showToast("Google sign in is a demo button.");
      break;

    case "social-apple":
      showToast("Apple sign in is a demo button.");
      break;

    case "pro-trial":
    case "upgrade":
      showToast("AssetsX Pro trial selected.");
      break;

    case "compare":
      showToast("Free and Pro plan comparison highlighted.");
      break;

    case "logout":
      // Stop the link from navigating right away so signOut can finish first
      if (e) e.preventDefault();
      signOut(auth).then(() => {
        location.href = 'signin.html';
      });
      break;
  }
}

// Make pill tabs inside any .range-tabs group switch the active state when clicked.
// The stock chart tabs are handled separately because they also reload chart data.
function bindRangeTabs() {
  document.querySelectorAll(".range-tabs:not(#stockRangeTabs)").forEach((group) => {
    group.querySelectorAll(".pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        group.querySelectorAll(".pill").forEach((item) => item.classList.remove("active"));
        pill.classList.add("active");
      });
    });
  });
}

// Wire the 1D / 1M / 3M / 1Y range tabs on the stock detail page.
// Each click calculates the correct date range and redraws the chart.
function bindStockRangeTabs() {
  const container = document.getElementById('stockRangeTabs');
  if (!container) return;

  const symbol = new URLSearchParams(location.search).get('symbol') || 'AAPL';

  container.querySelectorAll('.pill').forEach((pill) => {
    pill.addEventListener('click', async () => {
      container.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      const now = Math.floor(Date.now() / 1000);
      const SECONDS = { D: 86400, W: 604800 };
      let from, resolution;

      switch (pill.dataset.range) {
        case '1D':
          from = now - 7  * SECONDS.D;  resolution = 'D'; break;
        case '3M':
          from = now - 90 * SECONDS.D;  resolution = 'D'; break;
        case '1Y':
          from = now - 365 * SECONDS.D; resolution = 'W'; break;
        default: // 1M
          from = now - 30 * SECONDS.D;  resolution = 'D';
      }

      const data = await fetchStockCandles(symbol, resolution, from, now);
      initStockChart('stockChart', data);
    });
  });
}

// Make watchlist rows and market table rows clickable, navigating to the stock detail page
function bindRowNavigation() {
  document.querySelectorAll(".watch-row, .market-table tbody tr").forEach((row) => {
    const symbol = row.dataset.symbol;
    if (!symbol) return;

    row.style.cursor = 'pointer';
    row.addEventListener("click", () => {
      location.href = `stock.html?symbol=${symbol}`;
    });
  });
}

// Open the source article URL in a new tab when a news card is clicked.
// No internal reader page — go straight to the original story.
function bindNewsCardNavigation() {
  document.querySelectorAll(".news-card").forEach((card) => {
    const url = card.dataset.url;
    if (!url) return;

    card.style.cursor = 'pointer';
    card.addEventListener("click", () => {
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  });
}

// Filter visible rows and cards as the user types into the search box.
// Pressing Enter with a stock symbol (1-5 letters) navigates directly to that stock.
function bindGlobalSearch() {
  [".search", ".market-search"].forEach(selector => {
    const searchInput = document.querySelector(selector);
    // Guard against double-binding when bindInteractions() is called a second time after API load
    if (!searchInput || searchInput.dataset.bound) return;
    searchInput.dataset.bound = 'true';

    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();
      document.querySelectorAll(".watch-row, .holdings-row, .news-card, .market-table tbody tr").forEach((row) => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none";
      });
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const query = searchInput.value.trim().toUpperCase();
      if (query.length >= 1 && query.length <= 5 && /^[A-Z]+$/.test(query)) {
        location.href = `stock.html?symbol=${query}`;
      }
    });
  });
}

// Wire the region filter pills on the Markets page so they filter the table by country.
// Country name is read from the third column (index 2) of each table row.
function bindMarketRegionFilter() {
  const tabs = document.getElementById('market-region-tabs');
  if (!tabs) return;

  const REGIONS = {
    americas: ['united states', 'canada', 'brazil', 'mexico'],
    europe:   ['germany', 'united kingdom', 'france', 'netherlands', 'sweden'],
    asia:     ['japan', 'china', 'south korea', 'india', 'hong kong'],
  };

  tabs.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const region = pill.dataset.region || 'all';
      document.querySelectorAll('.market-table tbody tr').forEach(row => {
        if (region === 'all') {
          row.style.display = '';
          return;
        }
        const country = (row.cells[2]?.textContent || '').toLowerCase();
        row.style.display = REGIONS[region].some(c => country.includes(c)) ? '' : 'none';
      });
    });
  });
}

// Filter news cards by category when the tabs on the news page are clicked.
// The category keywords are matched against the tag text on each news card.
function bindNewsCategoryTabs() {
  const tabs = document.getElementById('news-category-tabs');
  if (!tabs) return;

  const CATEGORY_KEYWORDS = {
    macro: ['economy', 'macro', 'federal', 'rate', 'inflation', 'gdp', 'market'],
    tech:  ['tech', 'software', 'apple', 'google', 'microsoft', 'nvidia', 'amazon'],
    crypto: ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'defi', 'nft', 'coin'],
  };

  tabs.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      tabs.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const category = pill.dataset.category;
      const cards = document.querySelectorAll('#news-grid .news-card');

      cards.forEach(card => {
        if (category === 'all') {
          card.style.display = '';
          return;
        }
        const text = card.textContent.toLowerCase();
        const keywords = CATEGORY_KEYWORDS[category] || [];
        card.style.display = keywords.some(kw => text.includes(kw)) ? '' : 'none';
      });
    });
  });
}

// Attach all event listeners. Called after the page's dynamic content has been rendered.
export function bindInteractions() {
  bindActionButtons();
  bindRangeTabs();
  bindStockRangeTabs();
  bindRowNavigation();
  bindNewsCardNavigation();
  bindGlobalSearch();
  bindMarketRegionFilter();
  bindNewsCategoryTabs();
}
