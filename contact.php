<?php
header('Content-Type: application/json');
require 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

$name = sanitize($data['name']);
$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
$message = sanitize($data['message']);

$stmt = $pdo->prepare("INSERT INTO messages (name, email, message) VALUES (?, ?, ?)");
if ($stmt->execute([$name, $email, $message])) {
    echo json_encode(['success' => true, 'message' => 'Message sent successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to send message']);
}
?>