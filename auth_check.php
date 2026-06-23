<?php
// Check if the user is logged in before showing a protected page.
// Include this file at the top of any page that requires authentication.
// Example: <?php require_once 'auth_check.php'; requireLogin(); ?>

require_once __DIR__ . '/session_handler.php';

// Redirect to the login page if no active session is found
function requireLogin() {
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        header('Location: signin.html');
        exit;
    }
}

// Return true if the user is currently logged in
function isLoggedIn() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

// Get the logged-in user's email from the session
function getSessionEmail() {
    return $_SESSION['user_email'] ?? '';
}

// Get the logged-in user's display name from the session
function getSessionName() {
    return $_SESSION['user_name'] ?? '';
}
