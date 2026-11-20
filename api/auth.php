<?php
/**
 * COMECIL - Admin Authentication API
 */
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$pdo    = getDbConnection();
$input  = getRequestData();
if (empty($action) && isset($input['action'])) {
    $action = $input['action'];
}

// Session check
if ($action === 'check' || ($method === 'GET' && empty($action))) {
    $dbInfo = $GLOBALS['ACTIVE_DB_INFO'] ?? [
        'driver'   => 'sqlite',
        'database' => 'comecil.db',
        'host'     => 'local'
    ];
    if (isAdminLoggedIn()) {
        sendJsonResponse(['success'=>true,'authenticated'=>true,'user'=>$_SESSION['admin_user'],'db'=>$dbInfo]);
    }
    sendJsonResponse(['success'=>true,'authenticated'=>false,'db'=>$dbInfo]);
}

// Logout
if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(),'',time()-42000,$p['path'],$p['domain'],$p['secure'],$p['httponly']);
    }
    session_destroy();
    sendJsonResponse(['success'=>true,'message'=>'Logged out.']);
}

// Login
if ($method === 'POST' || $action === 'login') {
    $email    = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    if (empty($email) || empty($password)) sendJsonError('Email and password required.', 400);

    $s = $pdo->prepare("SELECT id,email,password_hash,role FROM users WHERE email=?");
    $s->execute([$email]);
    $user = $s->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        usleep(250000);
        sendJsonError('Invalid email or password.', 401);
    }
    session_regenerate_id(true);
    $_SESSION['admin_user'] = ['id'=>(int)$user['id'],'email'=>$user['email'],'role'=>$user['role']];
    sendJsonResponse(['success'=>true,'message'=>'Authentication successful.','user'=>$_SESSION['admin_user']]);
}

sendJsonError('Invalid request.', 400);
