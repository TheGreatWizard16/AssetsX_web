// This file runs on every page. It checks which page is open and sets it up.

import { initGeolocation, fetchMarketData, fetchGeneralNews } from './api.js';
import { bindInteractions } from './events.js';
import { DEMO_METRICS, FALLBACK_MARKET_ROWS } from './config.js';
import { appState } from './state.js';
import { auth } from './firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
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

// Pages that require the user to be logged in
const PROTECTED_PAGES = ['home', 'markets', 'portfolio', 'news', 'stock', 'pro'];

// Check if the user is logged in when the page loads.
// If they are not logged in and try to open a protected page, send them to the sign-in page.
// If they are already logged in and open the sign-in page, send them to the dashboard.
function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (PROTECTED_PAGES.includes(page) && !user) {
      // User is not logged in — send them to the sign-in page
      location.href = 'signin.html';
    }
    if ((page === 'signin' || page === 'signup') && user) {
      // User is already logged in — send them to the dashboard
      location.href = 'home.html';
    }
  });
}

// Show an inline error message below the form heading
function showFormError(message) {
  const errorBox = document.getElementById('form-error');
  if (errorBox) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
  } else {
    // Fall back to toast if the error div is missing
    showToast(message);
  }
}

// Clear the inline error message
function clearFormError() {
  const errorBox = document.getElementById('form-error');
  if (errorBox) {
    errorBox.textContent = '';
    errorBox.style.display = 'none';
  }
}

// Send a password reset email when the user clicks "Forgot password?"
function bindForgotPassword() {
  const forgotButton = document.querySelector('[data-action="forgot"]');
  if (!forgotButton) return;

  forgotButton.addEventListener('click', () => {
    const emailInput = document.getElementById('email');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
      showFormError('Enter your email address first, then click Forgot password.');
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        showToast(`Password reset email sent to ${email}. Check your inbox.`);
        clearFormError();
      })
      .catch((error) => {
        showFormError(authErrorMessage(error));
      });
  });
}

// Handle the sign-in and sign-up forms.
// JavaScript takes over the submit event and uses Firebase to log the user in.
// The PHP action on the form (login.php / register.php) runs instead on a PHP server.
function bindAuthFormSubmit() {
  if (page !== 'signin' && page !== 'signup') return;

  // If PHP redirected back with an error in the URL, show it right away
  const urlParams = new URLSearchParams(location.search);
  const phpError = urlParams.get('error');
  if (phpError) showFormError(phpError);

  const form = document.querySelector(page === 'signin' ? '#loginForm' : '#signupForm');
  if (!form) return;

  form.addEventListener("submit", (event) => {
    // Stop the browser from submitting to PHP so Firebase can handle it
    event.preventDefault();
    clearFormError();

    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const submitButton = form.querySelector('button[type="submit"]');

    // Check that fields are not empty before calling Firebase
    if (!email || !password) {
      showFormError('Please fill in all fields.');
      return;
    }

    if (page === 'signup') {
      const fullname = form.querySelector('#fullname')?.value.trim() || '';
      const confirmPwd = form.querySelector('#confirm_password')?.value || '';

      if (!fullname) {
        showFormError('Please enter your full name.');
        return;
      }

      // Make sure both password fields match before creating the account
      if (password !== confirmPwd) {
        showFormError('Passwords do not match.');
        return;
      }
    }

    submitButton.disabled = true;
    submitButton.textContent = page === 'signin' ? 'Signing in...' : 'Creating account...';

    if (page === 'signin') {
      // Sign in with email and password using Firebase
      signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          location.href = "home.html";
        })
        .catch((error) => {
          showFormError(authErrorMessage(error));
          submitButton.disabled = false;
          submitButton.textContent = 'Sign In';
        });
    } else {
      // Create the account, then send a verification email to confirm their address
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          sendEmailVerification(userCredential.user).then(() => {
            showToast('Account created! Check your email to verify your account.');
          });
          location.href = "home.html";
        })
        .catch((error) => {
          showFormError(authErrorMessage(error));
          submitButton.disabled = false;
          submitButton.textContent = 'Create Account';
        });
    }
  });
}

// Turn Firebase error codes into simple messages the user can understand
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
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

// Run the correct setup function depending on which page is open
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

// Show a time-appropriate greeting using the logged-in user's name
function updateGreeting() {
  const el = document.getElementById('greeting-text');
  if (!el) return;

  const hour = new Date().getHours();
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const user = auth.currentUser;
  const name = user?.displayName || user?.email?.split('@')[0] || '';
  el.textContent = `Good ${time}${name ? `, ${name}` : ''}`;
}

// Add a currency dropdown to the top bar so the user can switch between USD, EUR, GBP, and JPY
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

// Give each API call a time limit so the page doesn't get stuck waiting forever
function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise(resolve => setTimeout(resolve, ms))]);
}

// Start the app — this runs as soon as the page loads
function initApp() {
  checkAuthState();
  bindAuthFormSubmit();
  bindForgotPassword();
  injectCurrencySelector();
  updateGreeting();

  const now = Math.floor(Date.now() / 1000);
  const monthAgo = now - 30 * SECONDS_PER_DAY;

  // Show placeholder data right away so the page isn't blank while the API loads
  appState.marketRows = FALLBACK_MARKET_ROWS;
  renderMetrics(DEMO_METRICS);
  renderCurrentPage(now, monthAgo);
  bindInteractions();

  // Fetch real data from the API, then update the page
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
