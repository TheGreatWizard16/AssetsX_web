/*
 * events.js
 * ---------
 * Wires up all click/input interactions for the page. This is called
 * once, after the page's dynamic content (rows, cards, etc.) has been
 * rendered, so the listeners attach to the final elements.
 *
 * Each `bind...` function below handles one group of related elements:
 *   - bindActionButtons: any element with a `data-action` attribute
 *   - bindRangeTabs: the small pill-shaped range/category tabs
 *   - bindRowNavigation: clicking a watchlist or market table row
 *   - bindNewsCardNavigation: clicking a news card
 *   - bindGlobalSearch: the topbar search input
 */

import { showToast } from './utils.js';
import { auth } from './firebase.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';

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
// pill has the `.active` style.
function bindRangeTabs() {
  document.querySelectorAll(".range-tabs").forEach((group) => {
    group.querySelectorAll(".pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        group.querySelectorAll(".pill").forEach((item) => item.classList.remove("active"));
        pill.classList.add("active");
      });
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

// Filters watchlist rows, holdings, news cards, and market table rows
// as the user types in the topbar search box.
function bindGlobalSearch() {
  const searchInput = document.querySelector(".search");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    document.querySelectorAll(".watch-row, .holding-row, .news-card, .market-table tbody tr").forEach((row) => {
      row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none";
    });
  });
}

// Attaches all global event listeners. Called after the page's dynamic
// rows/cards have been rendered.
export function bindInteractions() {
  bindActionButtons();
  bindRangeTabs();
  bindRowNavigation();
  bindNewsCardNavigation();
  bindGlobalSearch();
}
