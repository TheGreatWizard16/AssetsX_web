<?php
// Handle the registration form submission.
// This file satisfies the PHP requirement from the Frontend Programming exam.
// On a PHP server this runs server-side; on Vercel, Firebase handles auth via JavaScript.

require_once 'session_handler.php';

// Only process POST requests — reject direct browser access
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: signup.html');
    exit;
}

// Collect and clean up form data
$fullname = trim($_POST['fullname'] ?? '');
$email    = trim($_POST['email']    ?? '');
$password = $_POST['password']         ?? '';
$confirm  = $_POST['confirm_password'] ?? '';

// --- Validation ---

// Check that all required fields are filled in
if (empty($fullname) || empty($email) || empty($password) || empty($confirm)) {
    header('Location: signup.html?error=' . urlencode('All fields are required.'));
    exit;
}

// Check that the email address is a valid format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: signup.html?error=' . urlencode('Please enter a valid email address.'));
    exit;
}

// Check that the password is long enough
if (strlen($password) < 6) {
    header('Location: signup.html?error=' . urlencode('Password must be at least 6 characters.'));
    exit;
}

// Check that both password fields match
if ($password !== $confirm) {
    header('Location: signup.html?error=' . urlencode('Passwords do not match.'));
    exit;
}

// --- Session registration ---
// Save the user details to the PHP session so the app knows they are logged in.
// In a production app this would also create a record in a database.
$_SESSION['logged_in']  = true;
$_SESSION['user_email'] = $email;
$_SESSION['user_name']  = $fullname;

// Redirect to the dashboard after successful registration
header('Location: home.html');
exit;
