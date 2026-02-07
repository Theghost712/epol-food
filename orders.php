<?php
header('Content-Type: application/json');
require 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Read: Pata oda zote
    $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'PUT') {
    // Update: Badilisha status ya oda (mfano: Pending -> Completed)
    $data = json_decode(file_get_contents('php://input'), true);
    $status = sanitize($data['status']);
    $stmt = $pdo->prepare("UPDATE orders SET status=? WHERE id=?");
    if ($stmt->execute([$status, $data['id']])) {
        echo json_encode(['success' => true, 'message' => 'Order updated']);
    }

} elseif ($method === 'DELETE') {
    // Delete: Futa oda
    $data = json_decode(file_get_contents('php://input'), true);
    // Futa items kwanza (kama foreign key haijawekwa CASCADE)
    $pdo->prepare("DELETE FROM order_items WHERE order_id=?")->execute([$data['id']]);
    
    $stmt = $pdo->prepare("DELETE FROM orders WHERE id=?");
    if ($stmt->execute([$data['id']])) {
        echo json_encode(['success' => true, 'message' => 'Order deleted']);
    }
}
?>