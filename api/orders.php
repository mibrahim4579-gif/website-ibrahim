<?php
/**
 * COMECIL - Project Orders API
 */
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$pdo = getDbConnection();

if ($method === 'POST') {
    $clientName   = trim($_POST['name'] ?? '');
    $clientEmail  = trim($_POST['email'] ?? '');
    $clientPhone  = trim($_POST['phone'] ?? '');
    $discipline   = trim($_POST['category'] ?? '');
    $service      = trim($_POST['service'] ?? '');
    $title        = trim($_POST['title'] ?? '');
    $desc         = trim($_POST['description'] ?? '');
    $deadline     = trim($_POST['deadline'] ?? '');
    $budget       = trim($_POST['budget'] ?? 'Standard');
    $errors = [];

    if (mb_strlen($clientName) < 2)                          $errors['name']        = 'Full name required (min 2 chars).';
    if (!filter_var($clientEmail, FILTER_VALIDATE_EMAIL))    $errors['email']       = 'Valid email required.';
    if (!preg_match('/^[0-9+\-\s()]{7,25}$/', $clientPhone)) $errors['phone']       = 'Valid phone required.';
    if (empty($discipline))                                   $errors['category']    = 'Please select an engineering field.';
    if (empty($service))                                      $errors['service']     = 'Please select a specific service.';
    if (mb_strlen($title) < 3)                               $errors['title']       = 'Project title required (min 3 chars).';
    if (mb_strlen($desc) < 20)                               $errors['description'] = 'Description required (min 20 chars).';
    $today = date('Y-m-d');
    $d = DateTime::createFromFormat('Y-m-d', $deadline);
    if (!$d || $d->format('Y-m-d') !== $deadline || $deadline < $today) $errors['deadline'] = 'Choose a valid future deadline.';

    // Normalise files
    $normalizedFiles = [];
    foreach (['files','file','attachments'] as $key) {
        if (!isset($_FILES[$key])) continue;
        $fe = $_FILES[$key];
        if (is_array($fe['name'])) {
            for ($i=0;$i<count($fe['name']);$i++) {
                if (!empty($fe['name'][$i])) $normalizedFiles[] = ['name'=>$fe['name'][$i],'type'=>$fe['type'][$i],'tmp_name'=>$fe['tmp_name'][$i],'error'=>$fe['error'][$i],'size'=>$fe['size'][$i]];
            }
        } elseif (!empty($fe['name'])) {
            $normalizedFiles[] = $fe;
        }
    }

    $finfo = function_exists('finfo_open') ? finfo_open(FILEINFO_MIME_TYPE) : null;
    $valid = [];
    foreach ($normalizedFiles as $i => $f) {
        if ($f['error'] === UPLOAD_ERR_NO_FILE) continue;
        if ($f['error'] !== UPLOAD_ERR_OK)      { $errors["file_$i"] = "Upload error for '{$f['name']}'."; continue; }
        if ($f['size'] > MAX_FILE_SIZE_BYTES)   { $errors["file_$i"] = "'{$f['name']}' exceeds 10 MB."; continue; }
        $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ALLOWED_EXTENSIONS, true)) { $errors["file_$i"] = "'{$f['name']}' has unsupported format."; continue; }
        $mime = 'application/octet-stream';
        if ($finfo && file_exists($f['tmp_name'])) { $m = finfo_file($finfo,$f['tmp_name']); if ($m) $mime=$m; }
        $valid[] = ['original_name'=>basename($f['name']),'tmp_name'=>$f['tmp_name'],'ext'=>$ext,'size'=>(int)$f['size'],'mime_type'=>$mime];
    }
    if ($finfo) finfo_close($finfo);

    if (!empty($errors)) sendJsonError('Validation failed.', 422, $errors);

    try {
        $pdo->beginTransaction();
        $orderNum = generateOrderNumber($pdo);
        $s = $pdo->prepare("INSERT INTO orders (order_number,client_name,client_email,client_phone,discipline_name,service_name,project_title,project_description,deadline_date,budget_range,status) VALUES (?,?,?,?,?,?,?,?,?,?,'pending')");
        $s->execute([$orderNum,$clientName,$clientEmail,$clientPhone,$discipline,$service,$title,$desc,$deadline,$budget]);
        $orderId = (int)$pdo->lastInsertId();

        $as = $pdo->prepare("INSERT INTO order_attachments (order_id,original_name,stored_filename,file_size,mime_type) VALUES (?,?,?,?,?)");
        foreach ($valid as $u) {
            $stored = sprintf('com_%d_%s.%s', $orderId, bin2hex(random_bytes(16)), $u['ext']);
            $target = UPLOAD_DIR . $stored;
            if (!move_uploaded_file($u['tmp_name'], $target)) @copy($u['tmp_name'], $target);
            $as->execute([$orderId,$u['original_name'],$stored,$u['size'],$u['mime_type']]);
        }
        $pdo->commit();
        sendJsonResponse(['success'=>true,'message'=>'Your project request has been submitted successfully!','order_number'=>$orderNum,'order_id'=>$orderId,'attachments_count'=>count($valid)], 201);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        sendJsonError('Server error: '.$e->getMessage(), 500);
    }

} elseif ($method === 'GET') {
    if (isset($_GET['order_number'])) {
        $s = $pdo->prepare("SELECT order_number,discipline_name,service_name,project_title,deadline_date,status,created_at FROM orders WHERE order_number=?");
        $s->execute([trim($_GET['order_number'])]);
        $row = $s->fetch();
        if (!$row) sendJsonError('Order not found', 404);
        sendJsonResponse(['success'=>true,'data'=>$row]);
    }
    requireAdminAuth();
    $status     = $_GET['status'] ?? 'all';
    $discipline = $_GET['discipline'] ?? 'all';
    $search     = trim($_GET['search'] ?? '');
    $limit      = max(1, min(100,(int)($_GET['limit'] ?? 50)));
    $offset     = max(0,(int)($_GET['offset'] ?? 0));
    $where = []; $params = [];
    if ($status !== 'all')     { $where[] = "o.status=?";          $params[] = $status; }
    if ($discipline !== 'all') { $where[] = "o.discipline_name=?"; $params[] = $discipline; }
    if ($search !== '') {
        $where[] = "(o.order_number LIKE ? OR o.client_name LIKE ? OR o.client_email LIKE ? OR o.project_title LIKE ?)";
        $t = "%$search%"; $params[] = $t; $params[] = $t; $params[] = $t; $params[] = $t;
    }
    $wc = $where ? ' WHERE '.implode(' AND ',$where) : '';
    $sql = "SELECT o.*,COUNT(a.id) as attachment_count FROM orders o LEFT JOIN order_attachments a ON o.id=a.order_id $wc GROUP BY o.id ORDER BY o.id DESC LIMIT ? OFFSET ?";
    $s = $pdo->prepare($sql); $s->execute(array_merge($params,[$limit,$offset]));
    $cs = $pdo->prepare("SELECT COUNT(*) as total FROM orders o $wc"); $cs->execute($params);
    sendJsonResponse(['success'=>true,'data'=>$s->fetchAll(),'total'=>(int)$cs->fetch()['total']]);
} else {
    sendJsonError('Method not allowed', 405);
}
