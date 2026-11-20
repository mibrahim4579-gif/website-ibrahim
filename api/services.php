<?php
/**
 * COMECIL - Services Catalog API (Public)
 */
require_once __DIR__ . '/config.php';

try {
    $pdo = getDbConnection();
    $discs = $pdo->query("SELECT id,slug,title,description FROM disciplines ORDER BY sort_order ASC")->fetchAll();
    $srvs  = $pdo->query("SELECT id,discipline_id,name FROM services WHERE is_active=1 ORDER BY id ASC")->fetchAll();

    $byDisc = [];
    foreach ($discs as $d) $byDisc[$d['title']] = [];
    foreach ($srvs as $s) {
        foreach ($discs as $d) {
            if ($s['discipline_id'] == $d['id']) { $byDisc[$d['title']][] = $s['name']; break; }
        }
    }
    sendJsonResponse(['success'=>true,'disciplines'=>$discs,'services_by_discipline'=>$byDisc,'total_services'=>count($srvs)]);
} catch (Exception $e) {
    sendJsonError('Failed to fetch services: '.$e->getMessage(), 500);
}
