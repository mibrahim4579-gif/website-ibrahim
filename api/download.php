<?php
/**
 * COMECIL - Secure File Download Handler (Admin only)
 */
require_once __DIR__ . '/config.php';
requireAdminAuth();

$id  = (int)($_GET['id'] ?? 0);
if ($id <= 0) { http_response_code(400); die('Invalid attachment ID'); }

$pdo = getDbConnection();
$s   = $pdo->prepare("SELECT * FROM order_attachments WHERE id=?"); $s->execute([$id]);
$att = $s->fetch();
if (!$att) { http_response_code(404); die('Attachment not found'); }

$path = UPLOAD_DIR . $att['stored_filename'];
if (!file_exists($path)) { http_response_code(404); die('File missing from storage'); }

if (ob_get_level()) ob_end_clean();

$mime = $att['mime_type'] ?: 'application/octet-stream';
header('Content-Description: File Transfer');
header('Content-Type: ' . $mime);
header('Content-Disposition: attachment; filename="' . addcslashes(basename($att['original_name']),'"\\') . '"');
header('Content-Transfer-Encoding: binary');
header('Content-Length: ' . filesize($path));
header('Cache-Control: must-revalidate');
header('Pragma: public');
readfile($path);
exit;
