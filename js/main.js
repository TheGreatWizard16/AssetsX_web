// App entry point — loaded by every page via <script type="module">.
// Reads data-page from <body>, loads shared data, then renders the right page.

import { initGeolocation, fetchMarketData, fetchGeneralNews } from './api.js';
import { bindInteractions } from './events.js';
import { DEMO_METRICS, FALLBACK_MARKET_ROWS } from './config.js';
import { appState } from './state.js';
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { showToast } from './utils.js';
import { getCurrency, setCurrency, CURRENCY_CODES } from './currency.js';
import {
  renderMetrics,
  renderHomePage,
  renderMarketsPage,
  renderStockPage,
  renderPortfolioPage,
  renderNewsPage,
  renderAuthPage,
} from './pages.js';

const page = document.body.dataset.page;

const SECONDS_PER_DAY = 24 * 60 * 60;

// On the sign in / sign up pages, submitting the form authenticates with
// Firebase and then redirects to the dashboard.
function bindAuthFormSubmit() {
  if (page !== 'signin' && page !== 'signup') return;

  const form = document.querySelector(page === 'signin' ? '#loginForm' : '#signupForm');
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const submitButton = form.querySelector('button[type="submit"]');

    submitButton.disabled = true;

    const authPromise = page === 'signin'
      ? signInWithEmailAndPassword(auth, email, password)
      : createUserWithEmailAndPassword(auth, email, password);

    authPromise
      .then(() => {
        location.href = "home.html";
      })
      .catch((error) => {
        showToast(authErrorMessage(error));
        submitButton.disabled = false;
      });
  });
}

// Converts a Firebase Auth error code into a short, user-friendly message.
function authErrorMessage(error) {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

// Renders the dynamic content for whichever page is currently loaded.
// `now` and `monthAgo` are Unix timestamps (seconds) used for the
// "last 30 days" price charts.
function renderCurrentPage(now, monthAgo) {
  switch (page) {
    case 'home':
      renderHomePage(now, monthAgo);
      break;
    case 'markets':
      renderMarketsPage();
      break;
    case 'stock':
      renderStockPage(now, monthAgo);
      break;
    case 'portfolio':
      renderPortfolioPage();
      break;
    case 'news':
      renderNewsPage();
      break;
    case 'signin':
    case 'signup':
      renderAuthPage();
      break;
  }
}

// Sets a time-aware greeting on the home page using the signed-in user's name.
function updateGreeting() {
  const el = document.getElementById('greeting-text');
  if (!el) return;

  const hour = new Date().getHours();
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const user = auth.currentUser;
  const name = user?.displayName || user?.email?.split('@')[0] || '';
  el.textContent = `Good ${time}${name ? `, ${name}` : ''}`;
}

// Injects a currency selector into .top-actions on every app page.
// Changing the selection saves the choice and reloads so all prices update.
function injectCurrencySelector() {
  const actions = document.querySelector('.top-actions');
  if (!actions) return;

  const current = getCurrency().code;
  const select = document.createElement('select');
  select.className = 'currency-select';
  select.innerHTML = CURRENCY_CODES.map(code =>
    `<option value="${code}" ${code === current ? 'selected' : ''}>${code}</option>`
  ).join('');

  select.addEventListener('change', () => {
    setCurrency(select.value);
    location.reload();
  });

  actions.prepend(select);
}

// Race a promise against a timeout so a slow mobile network can't block
// rendering indefinitely. Resolves (never rejects) after `ms` milliseconds.
function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise(resolve => setTimeout(resolve, ms))]);
}

// Main app startup.
function initApp() {
  bindAuthFormSubmit();
  injectCurrencySelector();
  updateGreeting();

  const now = Math.floor(Date.now() / 1000);
  const monthAgo = now - 30 * SECONDS_PER_DAY;

  // Seed with fallback data and render immediately so mobile users always
  // see content — API calls can take 5-10 s on slow connections.
  appState.marketRows = FALLBACK_MARKET_ROWS;
  renderMetrics(DEMO_METRICS);
  renderCurrentPage(now, monthAgo);
  bindInteractions();

  // Fetch real data in the background, then re-render to replace fallback.
  // withTimeout caps each call so a hanging fetch never blocks this step.
  Promise.all([
    withTimeout(initGeolocation(), 6000),
    withTimeout(fetchMarketData(), 8000),
    withTimeout(fetchGeneralNews(), 8000),
  ]).then(() => {
    renderCurrentPage(now, monthAgo);
    bindInteractions();
  });
}

initApp();
