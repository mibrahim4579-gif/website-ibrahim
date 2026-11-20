<?php
/**
 * COMECIL - Database Initializer & Seeder
 * Creates schema tables and seeds default admin, disciplines, and services.
 * Run via CLI: php api/db_init.php
 */

require_once __DIR__ . '/config.php';

function initDatabase(bool $silent = false): void {
    $pdo = getDbConnection();
    $driver = DB_DRIVER;

    if (!$silent && php_sapi_name() === 'cli') {
        echo "[*] Initializing COMECIL Database ($driver)...\n";
    }

    if ($driver === 'sqlite') {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS disciplines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                sort_order INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                discipline_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                is_active INTEGER DEFAULT 1,
                FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT UNIQUE NOT NULL,
                client_name TEXT NOT NULL,
                client_email TEXT NOT NULL,
                client_phone TEXT NOT NULL,
                discipline_name TEXT NOT NULL,
                service_name TEXT NOT NULL,
                project_title TEXT NOT NULL,
                project_description TEXT NOT NULL,
                deadline_date TEXT NOT NULL,
                budget_range TEXT,
                status TEXT DEFAULT 'pending',
                admin_notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS order_attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                original_name TEXT NOT NULL,
                stored_filename TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                mime_type TEXT NOT NULL,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS contact_inquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT DEFAULT 'unread',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        ");
    } else {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(191) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            CREATE TABLE IF NOT EXISTS disciplines (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slug VARCHAR(50) UNIQUE NOT NULL,
                title VARCHAR(100) NOT NULL,
                description TEXT,
                sort_order INT DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            CREATE TABLE IF NOT EXISTS services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                discipline_id INT NOT NULL,
                name VARCHAR(150) NOT NULL,
                description TEXT,
                is_active TINYINT(1) DEFAULT 1,
                FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                client_name VARCHAR(150) NOT NULL,
                client_email VARCHAR(150) NOT NULL,
                client_phone VARCHAR(50) NOT NULL,
                discipline_name VARCHAR(100) NOT NULL,
                service_name VARCHAR(150) NOT NULL,
                project_title VARCHAR(255) NOT NULL,
                project_description TEXT NOT NULL,
                deadline_date DATE NOT NULL,
                budget_range VARCHAR(100),
                status VARCHAR(50) DEFAULT 'pending',
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            CREATE TABLE IF NOT EXISTS order_attachments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                stored_filename VARCHAR(255) NOT NULL,
                file_size INT NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            CREATE TABLE IF NOT EXISTS contact_inquiries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(150) NOT NULL,
                email VARCHAR(150) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'unread',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
    }

    // Seed admin
    $adminEmail = 'admin@comecil.com';
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$adminEmail]);
    if (!$stmt->fetch()) {
        $hash = password_hash('comecil2026!', PASSWORD_BCRYPT);
        $pdo->prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'admin')")->execute([$adminEmail, $hash]);
        if (!$silent && php_sapi_name() === 'cli') echo "  [+] Admin seeded: $adminEmail\n";
    }

    // Seed disciplines
    $disciplines = [
        ['computer',  'Computer Science',       'Software engineering, AI, web development and data analytics.',                                         1],
        ['mechanical','Mechanical Engineering', 'CAD modeling, FEA simulation, thermodynamics and mechanical design.',                                   2],
        ['civil',     'Civil Engineering',      'Structural engineering, architectural plans, ETABS analysis and quantity survey.',                      3],
    ];
    foreach ($disciplines as [$slug, $title, $desc, $order]) {
        $c = $pdo->prepare("SELECT id FROM disciplines WHERE slug = ?"); $c->execute([$slug]);
        if (!$c->fetch()) {
            $pdo->prepare("INSERT INTO disciplines (slug,title,description,sort_order) VALUES (?,?,?,?)")->execute([$slug,$title,$desc,$order]);
        }
    }

    // Seed services
    $svcs = [
        'Computer Science' => [
            "Website Development","Frontend Development","Backend Development","Full Stack Development",
            "Mobile App Development","Software Development","Artificial Intelligence Solutions",
            "Machine Learning Projects","Data Science","Database Development","Python Programming",
            "Java Programming","C++ Programming","UI/UX Design","Cybersecurity Solutions",
            "Automation Projects","Final Year Projects"
        ],
        'Mechanical Engineering' => [
            "CAD Design","3D Modeling","SolidWorks Projects","AutoCAD Mechanical","ANSYS Simulation",
            "Machine Design","Product Design","Manufacturing Design","Thermal Engineering Analysis",
            "Fluid Mechanics Projects","Mechanical Simulations","Engineering Drawings",
            "Technical Reports","Research Projects","Final Year Projects"
        ],
        'Civil Engineering' => [
            "Structural Design","AutoCAD Drawings","Building Plans","Architectural Drawings",
            "3D Building Models","Quantity Estimation","Cost Estimation","BOQ Preparation",
            "Structural Analysis","ETABS Projects","SAFE Analysis","Construction Planning",
            "Surveying Projects","Civil Engineering Reports","Final Year Projects"
        ],
    ];
    foreach ($svcs as $discTitle => $names) {
        $d = $pdo->prepare("SELECT id FROM disciplines WHERE title = ?"); $d->execute([$discTitle]);
        $row = $d->fetch(); if (!$row) continue;
        $did = (int)$row['id'];
        foreach ($names as $name) {
            $sc = $pdo->prepare("SELECT id FROM services WHERE discipline_id=? AND name=?"); $sc->execute([$did,$name]);
            if (!$sc->fetch()) {
                $pdo->prepare("INSERT INTO services (discipline_id,name,description) VALUES (?,?,?)")
                    ->execute([$did, $name, "Professional, industry-standard ".strtolower($name)." tailored to client specifications."]);
            }
        }
    }

    if (!$silent && php_sapi_name() === 'cli') echo "[✓] Database initialized successfully.\n";
}

if (php_sapi_name() === 'cli' && realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    initDatabase();
}
