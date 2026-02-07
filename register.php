<?php
header('Content-Type: application/json');
require 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

// Basic validation
if (empty($data['fullname']) || empty($data['email']) || empty($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Please fill all fields.']);
    exit;
}

$name = sanitize($data['fullname']);
$email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
$password = $data['password'];

if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
    exit;
}

$hashed_password = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
if ($stmt->execute([$name, $email, $hashed_password])) {
    echo json_encode(['success' => true, 'message' => 'Registration successful!']);
} else {
    // This could fail if the email is already taken due to UNIQUE constraint
    echo json_encode(['success' => false, 'message' => 'Registration failed. Email may already be in use.']);
}
?>