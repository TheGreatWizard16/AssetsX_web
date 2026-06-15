/*
 * main.js
 * -------
 * Entry point loaded by every page (`<script type="module" src="js/main.js">`).
 *
 * Page initialization works like this:
 *   1. Read which page we're on from `document.body.dataset.page`
 *      (set via `data-page="..."` on the <body> tag).
 *   2. Bind the sign in / sign up form submit handlers immediately, so
 *      the forms work even before data has finished loading.
 *   3. Show placeholder metric cards immediately for a fast first paint.
 *   4. Load shared data (location, market quotes, news) in parallel.
 *   5. Once that data is ready, render the current page's content and
 *      attach all click/search interactions.
 */

import { initGeolocation, fetchMarketData, fetchGeneralNews } from './api.js';
import { bindInteractions } from './events.js';
import { DEMO_METRICS } from './config.js';
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { showToast } from './utils.js';
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

// Main app startup.
function initApp() {
  bindAuthFormSubmit();

  // Show demo metrics right away so the dashboard isn't empty while
  // real data loads.
  renderMetrics(DEMO_METRICS);

  Promise.all([initGeolocation(), fetchMarketData(), fetchGeneralNews()]).then(() => {
    const now = Math.floor(Date.now() / 1000);
    const monthAgo = now - 30 * SECONDS_PER_DAY;

    renderCurrentPage(now, monthAgo);

    // Bind interactions AFTER the DOM has been populated with dynamic rows.
    bindInteractions();
  });
}

initApp();
