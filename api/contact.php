<?php
/**
 * COMECIL - Contact Inquiries API
 */
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$pdo = getDbConnection();

if ($method === 'POST') {
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($ct,'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
    } else {
        $input = $_POST;
    }

    $name    = trim($input['name'] ?? '');
    $email   = trim($input['email'] ?? '');
    $subject = trim($input['subject'] ?? '');
    $message = trim($input['message'] ?? '');
    $errors  = [];

    if (mb_strlen($name) < 2 || mb_strlen($name) > 150)     $errors['name']    = 'Full name required (2–150 chars).';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL))           $errors['email']   = 'Valid email required.';
    if (mb_strlen($subject) < 3 || mb_strlen($subject) > 255) $errors['subject'] = 'Subject required (3–255 chars).';
    if (mb_strlen($message) < 10 || mb_strlen($message) > 500) $errors['message'] = 'Message must be 10–500 chars.';

    if (!empty($errors)) sendJsonError('Validation failed.', 422, $errors);

    try {
        $s = $pdo->prepare("INSERT INTO contact_inquiries (full_name,email,subject,message,status) VALUES (?,?,?,?,'unread')");
        $s->execute([$name,$email,$subject,$message]);
        sendJsonResponse(['success'=>true,'message'=>'Thank you! Your message has been sent. We will respond within 24 hours.','inquiry_id'=>(int)$pdo->lastInsertId()], 201);
    } catch (Exception $e) {
        sendJsonError('Server error: '.$e->getMessage(), 500);
    }
} elseif ($method === 'GET') {
    requireAdminAuth();
    $status = $_GET['status'] ?? 'all';
    $limit  = max(1, min(100, (int)($_GET['limit'] ?? 50)));
    $offset = max(0, (int)($_GET['offset'] ?? 0));
    $sql    = "SELECT id,full_name,email,subject,message,status,created_at FROM contact_inquiries";
    $params = [];
    if ($status !== 'all' && in_array($status,['unread','replied','archived'],true)) {
        $sql .= " WHERE status=?"; $params[] = $status;
    }
    $sql .= " ORDER BY id DESC LIMIT ? OFFSET ?";
    $params[] = $limit; $params[] = $offset;
    $s = $pdo->prepare($sql); $s->execute($params);
    sendJsonResponse(['success'=>true,'data'=>$s->fetchAll()]);
} else {
    sendJsonError('Method not allowed', 405);
}
