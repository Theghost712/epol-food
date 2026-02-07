<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'epol-cafteria'); // The database name from database.sql
define('DB_USER', 'root'); // Your database username
define('DB_PASS', ''); // Default XAMPP password is empty

$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Basic sanitization function
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}