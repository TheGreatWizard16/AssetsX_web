// All click/input event listeners for the app.
// bindInteractions() is called after the page renders so listeners attach to real elements.

import { showToast } from './utils.js';
import { auth } from './firebase.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { fetchStockCandles } from './api.js';
import { initStockChart } from './charts.js';

// Handles every button/element with a `data-action="..."` attribute.
function bindActionButtons() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button));
  });
}

// Performs the behaviour for a single data-action button click.
function handleAction(button) {
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
      showToast("Password reset link would be sent by email.");
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
      signOut(auth);
      break;
  }
}

// Lets the user click between pills inside a `.range-tabs` group
// (e.g. chart ranges, market filters, news categories), toggling which
// pill has the `.active` style. The stock page's range tabs are handled
// separately by bindStockRangeTabs so they can also reload the chart.
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

// Wires the 1D / 1M / 3M / 1Y pills on the stock detail page so each
// click fetches the appropriate candle data and redraws the chart.
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

// Makes watchlist rows and market table rows clickable, navigating to
// that symbol's stock detail page.
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

// Makes news cards clickable, navigating to the news reader view.
// Cards with a "stock-N" index also carry the current stock symbol so
// the reader can find that article in the stock's cached news list.
function bindNewsCardNavigation() {
  document.querySelectorAll(".news-card").forEach((card) => {
    const index = card.dataset.newsIndex;
    if (index === "null") return;

    card.style.cursor = 'pointer';
    card.addEventListener("click", () => {
      let url = `news.html?id=${index}`;

      if (index.startsWith('stock-')) {
        const params = new URLSearchParams(location.search);
        const symbol = params.get('symbol');
        if (symbol) url += `&symbol=${symbol}`;
      }

      location.href = url;
    });
  });
}

// Filters visible rows/cards as the user types. Pressing Enter with a
// 1–5 letter query navigates directly to that stock's detail page.
// Both the topbar .search and the inline .market-search are wired here.
function bindGlobalSearch() {
  [".search", ".market-search"].forEach(selector => {
    const searchInput = document.querySelector(selector);
    if (!searchInput) return;

    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();
      document.querySelectorAll(".watch-row, .holding-row, .news-card, .market-table tbody tr").forEach((row) => {
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

// Wires the region filter pills on the Markets page (Americas / Europe / Asia-Pacific).
// Clicking a pill hides rows whose country column doesn't match.
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

// Attaches all global event listeners. Called after the page's dynamic
// rows/cards have been rendered.
export function bindInteractions() {
  bindActionButtons();
  bindRangeTabs();
  bindStockRangeTabs();
  bindRowNavigation();
  bindNewsCardNavigation();
  bindGlobalSearch();
  bindMarketRegionFilter();
}
