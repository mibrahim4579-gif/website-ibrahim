<?php
/**
 * COMECIL - Admin Dashboard API
 */
require_once __DIR__ . '/config.php';
requireAdminAuth();

$pdo    = getDbConnection();
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$input  = getRequestData();
if (empty($action) && isset($input['action'])) {
    $action = $input['action'];
}

// Dashboard stats
if ($action === 'stats') {
    $os = $pdo->query("SELECT COUNT(*) total,
        SUM(CASE WHEN status='pending'     THEN 1 ELSE 0 END) pending,
        SUM(CASE WHEN status='in_review'   THEN 1 ELSE 0 END) in_review,
        SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) in_progress,
        SUM(CASE WHEN status='completed'   THEN 1 ELSE 0 END) completed,
        SUM(CASE WHEN status='cancelled'   THEN 1 ELSE 0 END) cancelled
        FROM orders")->fetch();
    $is = $pdo->query("SELECT COUNT(*) total, SUM(CASE WHEN status='unread' THEN 1 ELSE 0 END) unread FROM contact_inquiries")->fetch();
    $ro = $pdo->query("SELECT id,order_number,client_name,service_name,deadline_date,status,created_at FROM orders ORDER BY id DESC LIMIT 5")->fetchAll();
    sendJsonResponse(['success'=>true,'stats'=>[
        'total_orders'=>(int)$os['total'],'pending_orders'=>(int)$os['pending'],'in_review_orders'=>(int)$os['in_review'],
        'in_progress_orders'=>(int)$os['in_progress'],'completed_orders'=>(int)$os['completed'],'cancelled_orders'=>(int)$os['cancelled'],
        'total_inquiries'=>(int)$is['total'],'unread_inquiries'=>(int)$is['unread']
    ],'recent_orders'=>$ro]);
}

// Order detail
if ($action === 'order_detail') {
    $id = (int)($_GET['id'] ?? $input['id'] ?? 0);
    if ($id<=0) sendJsonError('Invalid order ID.', 400);
    $s  = $pdo->prepare("SELECT * FROM orders WHERE id=?"); $s->execute([$id]);
    $o  = $s->fetch(); if (!$o) sendJsonError('Order not found.', 404);
    $as = $pdo->prepare("SELECT id,original_name,file_size,mime_type,uploaded_at FROM order_attachments WHERE order_id=? ORDER BY id");
    $as->execute([$id]);
    $o['attachments'] = $as->fetchAll();
    sendJsonResponse(['success'=>true,'data'=>$o]);
}

// Update order status
if ($action === 'update_order_status') {
    $id     = (int)($input['id'] ?? $input['order_id'] ?? 0);
    $status = trim($input['status'] ?? '');
    $notes  = isset($input['admin_notes']) ? trim($input['admin_notes']) : null;
    $allowed = ['pending','in_review','in_progress','completed','cancelled'];
    if (!in_array($status,$allowed,true)) sendJsonError('Invalid status.', 400);
    if ($notes !== null) {
        $pdo->prepare("UPDATE orders SET status=?,admin_notes=? WHERE id=?")->execute([$status,$notes,$id]);
    } else {
        $pdo->prepare("UPDATE orders SET status=? WHERE id=?")->execute([$status,$id]);
    }
    sendJsonResponse(['success'=>true,'message'=>"Order #$id updated to '$status'.",'order_id'=>$id,'status'=>$status]);
}

// Update inquiry status
if ($action === 'update_inquiry_status') {
    $id     = (int)($input['id'] ?? $input['inquiry_id'] ?? 0);
    $status = trim($input['status'] ?? '');
    if (!in_array($status,['unread','replied','archived'],true)) sendJsonError('Invalid status.', 400);
    $pdo->prepare("UPDATE contact_inquiries SET status=? WHERE id=?")->execute([$status,$id]);
    sendJsonResponse(['success'=>true,'message'=>"Inquiry #$id updated to '$status'."]);
}

// List inquiries
if ($action === 'inquiries') {
    $status = $_GET['status'] ?? 'all';
    $limit  = max(1,min(100,(int)($_GET['limit']??50)));
    $offset = max(0,(int)($_GET['offset']??0));
    $sql = "SELECT id,full_name,email,subject,message,status,created_at FROM contact_inquiries";
    $p   = [];
    if ($status!=='all' && in_array($status,['unread','replied','archived'],true)) { $sql.=" WHERE status=?"; $p[]=$status; }
    $sql.=" ORDER BY id DESC LIMIT ? OFFSET ?"; $p[]=$limit; $p[]=$offset;
    $s = $pdo->prepare($sql); $s->execute($p);
    sendJsonResponse(['success'=>true,'data'=>$s->fetchAll()]);
}

// Test MySQL connection from admin console
if ($action === 'test_mysql') {
    $host = trim($input['host'] ?? '127.0.0.1');
    $port = (int)($input['port'] ?? 3306);
    $user = trim($input['user'] ?? 'root');
    $pass = $input['password'] ?? '';
    $sock = @fsockopen($host, $port, $errno, $errstr, 1.2);
    if (!$sock) {
        sendJsonError("Could not reach MySQL on $host:$port. Make sure your MySQL service (e.g. Laragon or MySQL97) is started.", 400);
    }
    fclose($sock);
    try {
        $testPdo = new PDO("mysql:host=$host;port=$port", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 2
        ]);
        sendJsonResponse([
            'success' => true,
            'message' => "Connection successful! MySQL is running on $host:$port and accepted user '$user'."
        ]);
    } catch (PDOException $e) {
        sendJsonError("MySQL authentication failed: " . $e->getMessage(), 401);
    }
}

sendJsonError('Invalid admin action.', 400);
