<?php
/**
 * COMECIL - Core Configuration & Database Connection
 * Supports PDO SQLite (default local setup) and PDO MySQL.
 */

// Start session securely if not already active
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    session_start();
}

// ═══════════════════════════════════════════════════════════════
// DATABASE DRIVER
// Local development : 'auto'  (tries MySQL, falls back to SQLite)
// Hostinger / Live  : 'mysql' (always use MySQL)
// ═══════════════════════════════════════════════════════════════
define('DB_DRIVER', 'auto');           // ← change to 'mysql' on Hostinger
define('ALLOW_SQLITE_FALLBACK', true); // ← change to false  on Hostinger

// SQLite Path (local fallback only – not used on Hostinger)
define('SQLITE_DB_PATH', __DIR__ . '/../data/comecil.db');

// ═══════════════════════════════════════════════════════════════
// MYSQL CONFIGURATION
// Fill these in AFTER creating your database on Hostinger cPanel.
// All four values come from: cPanel → MySQL Databases
// ═══════════════════════════════════════════════════════════════
define('MYSQL_HOST', 'localhost');                     // always 'localhost' on Hostinger
define('MYSQL_PORT', '3306');                          // default MySQL port
define('MYSQL_DB',   'u123456789_comecil_db');         // ← REPLACE with your full DB name
define('MYSQL_USER', 'u123456789_comecil_user');       // ← REPLACE with your full DB username
define('MYSQL_PASS', 'YourStrongPassword123!');

// Tracks active database connection info
$GLOBALS['ACTIVE_DB_INFO'] = [
    'driver'       => 'sqlite',
    'database'     => 'comecil.db',
    'host'         => 'local',
    'is_fallback'  => false,
    'mysql_error'  => null
];

// File upload configuration
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_FILE_SIZE_BYTES', 10 * 1024 * 1024); // 10 MB per file
define('ALLOWED_EXTENSIONS', ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']);
define('ALLOWED_MIME_TYPES', [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
]);

/**
 * Returns active PDO Database connection instance
 * @return PDO
 */
function getDbConnection(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    // Ensure data directory exists
    $dataDir = dirname(SQLITE_DB_PATH);
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0755, true);
    }

    // Ensure uploads directory exists
    if (!is_dir(UPLOAD_DIR)) {
        @mkdir(UPLOAD_DIR, 0755, true);
    }

    $mysqlAttempted = false;
    $mysqlErr = null;

    // Attempt MySQL if DB_DRIVER is 'auto' or 'mysql'
    if (DB_DRIVER === 'mysql' || DB_DRIVER === 'auto') {
        $mysqlAttempted = true;
        try {
            // Quick socket probe to avoid 20-second TCP timeouts if MySQL is offline
            $sock = @fsockopen(MYSQL_HOST, (int)MYSQL_PORT, $errno, $errstr, 0.8);
            if (!$sock) {
                throw new Exception("MySQL service is not running on " . MYSQL_HOST . ":" . MYSQL_PORT . ".");
            }
            fclose($sock);

            // Connect to server root first to ensure database exists
            try {
                $baseDsn = sprintf('mysql:host=%s;port=%s;charset=utf8mb4', MYSQL_HOST, MYSQL_PORT);
                $rootPdo = new PDO($baseDsn, MYSQL_USER, MYSQL_PASS, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_TIMEOUT => 2
                ]);
                $rootPdo->exec("CREATE DATABASE IF NOT EXISTS `" . MYSQL_DB . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                unset($rootPdo);
            } catch (Exception $e) {
                // Ignore if root privileges are restricted; database-specific connect below will try
            }

            // Connect to MySQL database
            $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', MYSQL_HOST, MYSQL_PORT, MYSQL_DB);
            $pdo = new PDO($dsn, MYSQL_USER, MYSQL_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);

            // Auto-seed schema and data if tables do not exist yet
            try {
                $check = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '" . MYSQL_DB . "' AND table_name = 'users'")->fetchColumn();
                if (!$check && file_exists(__DIR__ . '/db_init.php')) {
                    require_once __DIR__ . '/db_init.php';
                    if (function_exists('initDatabase')) {
                        initDatabase(true);
                    }
                }
            } catch (Exception $e) {
                // Table check non-fatal
            }

            $GLOBALS['ACTIVE_DB_INFO'] = [
                'driver'      => 'mysql',
                'database'    => MYSQL_DB,
                'host'        => MYSQL_HOST . ':' . MYSQL_PORT,
                'is_fallback' => false,
                'mysql_error' => null
            ];

            return $pdo;

        } catch (Exception $e) {
            $mysqlErr = $e->getMessage();
            if (DB_DRIVER === 'mysql' && !ALLOW_SQLITE_FALLBACK) {
                sendJsonError('Database connection error: ' . $mysqlErr, 500);
                exit;
            }
        }
    }

    // SQLite Connection (primary or resilient fallback)
    try {
        $dbExisted = file_exists(SQLITE_DB_PATH) && filesize(SQLITE_DB_PATH) > 0;
        $dsn = 'sqlite:' . SQLITE_DB_PATH;
        $pdo = new PDO($dsn, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA foreign_keys = ON;');

        if (!$dbExisted && file_exists(__DIR__ . '/db_init.php')) {
            @include_once __DIR__ . '/db_init.php';
        }

        $GLOBALS['ACTIVE_DB_INFO'] = [
            'driver'      => 'sqlite',
            'database'    => 'comecil.db',
            'host'        => 'local',
            'is_fallback' => $mysqlAttempted,
            'mysql_error' => $mysqlErr
        ];

        return $pdo;

    } catch (PDOException $e) {
        sendJsonError('Database connection error (SQLite): ' . $e->getMessage(), 500);
        exit;
    }
}

/**
 * Send a JSON response with status code
 */
function sendJsonResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Send a structured JSON error response
 */
function sendJsonError(string $message, int $statusCode = 400, array $errors = []): void {
    $payload = [
        'success' => false,
        'message' => $message,
    ];
    if (!empty($errors)) {
        $payload['errors'] = $errors;
    }
    sendJsonResponse($payload, $statusCode);
}

/**
 * Check if current session belongs to an authenticated administrator
 */
function isAdminLoggedIn(): bool {
    return isset($_SESSION['admin_user']) && !empty($_SESSION['admin_user']['id']);
}

/**
 * Enforce admin authentication
 */
function requireAdminAuth(): void {
    if (!isAdminLoggedIn()) {
        sendJsonError('Unauthorized: Admin login required', 401);
    }
}

/**
 * Generate official business order number (e.g. COM-2026-0001)
 */
function generateOrderNumber(PDO $pdo): string {
    $year = date('Y');
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM orders");
    $row = $stmt->fetch();
    $nextSeq = ($row ? (int)$row['total'] : 0) + 1;
    return sprintf('COM-%s-%04d', $year, $nextSeq);
}

/**
 * Sanitize basic string input
 */
function sanitizeInput(?string $data): string {
    if ($data === null) return '';
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

/**
 * Robust JSON / Form Input Parser
 */
function getRequestData(): array {
    $data = $_POST;
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        // Strip UTF-8 BOM if present
        $raw = preg_replace('/^\xEF\xBB\xBF/', '', trim($raw));
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $data = array_merge($data, $decoded);
        }
    }
    return $data;
}
