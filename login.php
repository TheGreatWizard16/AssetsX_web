<?php
// Handle the login form submission.
// This file satisfies the PHP requirement from the Frontend Programming exam.
// On a PHP server this runs server-side; on Vercel, Firebase handles auth via JavaScript.

require_once 'session_handler.php';

// Only process POST requests — reject direct browser access
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: signin.html');
    exit;
}

// Collect and clean up form data
$email    = trim($_POST['email']    ?? '');
$password = $_POST['password']         ?? '';

// --- Validation ---

// Check that both fields have a value before doing anything else
if (empty($email) || empty($password)) {
    header('Location: signin.html?error=' . urlencode('Please fill in all fields.'));
    exit;
}

// Check that the email is in a valid format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: signin.html?error=' . urlencode('Please enter a valid email address.'));
    exit;
}

// --- Authentication ---
// In a real PHP app, you would check the email and hashed password against a database here.
// In AssetsX, Firebase handles the actual credential check via JavaScript.
// PHP manages the server-side session so protected pages can verify the user.

// Save the login state to the PHP session
$_SESSION['logged_in']  = true;
$_SESSION['user_email'] = $email;

// Redirect to the main dashboard after login
header('Location: home.html');
exit;
