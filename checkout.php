<?php
header('Content-Type: application/json');
require 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['items'])) {
    echo json_encode(['success' => false, 'message' => 'Cart is empty']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Prepare statements
    $orderStmt = $pdo->prepare("INSERT INTO orders (order_number, customer_name, delivery_address, phone, payment_method, total_amount) VALUES (?, ?, ?, ?, ?, ?)");
    $itemStmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
    $productPriceStmt = $pdo->prepare("SELECT price FROM products WHERE id = ?");

    $server_total = 0;
    $items_to_insert = [];

    // 1. Validate items and calculate total on the server to prevent tampering
    foreach ($data['items'] as $item) {
        $productId = isset($item['id']) ? $item['id'] : null;
        if (!$productId) continue;

        $productPriceStmt->execute([$productId]);
        $product = $productPriceStmt->fetch();

        if ($product) {
            $price = $product['price'];
            $server_total += $price;
            $items_to_insert[] = ['id' => $productId, 'price' => $price];
        }
    }

    // 2. Insert into Orders Table with the server-calculated total
    $order_number = 'ORD-' . time();
    $fullname = sanitize($data['fullname'] ?? '');
    $address = sanitize($data['address'] ?? '');
    $phone = sanitize($data['phone'] ?? '');
    $payment = sanitize($data['payment'] ?? '');
    
    $orderStmt->execute([$order_number, $fullname, $address, $phone, $payment, $server_total]);
    $order_id = $pdo->lastInsertId();

    // 3. Insert into Order Items Table
    // Quantity is 1 for each item based on current cart logic
    foreach ($items_to_insert as $item) {
        $itemStmt->execute([$order_id, $item['id'], 1, $item['price']]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Order placed successfully', 'orderId' => $order_number]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Failed to place order: ' . $e->getMessage()]);
}
?>