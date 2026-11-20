-- =====================================================================
-- COMECIL Engineering Platform — MySQL Schema and Seeder
-- Compatible with MySQL 5.7+, MySQL 8.0+, MySQL 8.4+, MySQL 9.x, MariaDB
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `comecil_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `comecil_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table (Admin Accounts)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(191) UNIQUE NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) DEFAULT 'admin',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Disciplines Table
DROP TABLE IF EXISTS `disciplines`;
CREATE TABLE `disciplines` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `slug` VARCHAR(50) UNIQUE NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `sort_order` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Services Table
DROP TABLE IF EXISTS `services`;
CREATE TABLE `services` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `discipline_id` INT NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT,
    `is_active` TINYINT(1) DEFAULT 1,
    FOREIGN KEY (`discipline_id`) REFERENCES `disciplines`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Orders Table
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_number` VARCHAR(50) UNIQUE NOT NULL,
    `client_name` VARCHAR(150) NOT NULL,
    `client_email` VARCHAR(150) NOT NULL,
    `client_phone` VARCHAR(50) NOT NULL,
    `discipline_name` VARCHAR(100) NOT NULL,
    `service_name` VARCHAR(150) NOT NULL,
    `project_title` VARCHAR(255) NOT NULL,
    `project_description` TEXT NOT NULL,
    `deadline_date` DATE NOT NULL,
    `budget_range` VARCHAR(100),
    `status` VARCHAR(50) DEFAULT 'pending',
    `admin_notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Order Attachments Table
DROP TABLE IF EXISTS `order_attachments`;
CREATE TABLE `order_attachments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `stored_filename` VARCHAR(255) NOT NULL,
    `file_size` INT NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Contact Inquiries Table
DROP TABLE IF EXISTS `contact_inquiries`;
CREATE TABLE `contact_inquiries` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(50) DEFAULT 'unread',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- Seed Initial Data
-- =====================================================================

-- Default Administrator (Password: comecil2026!)
INSERT INTO `users` (`email`, `password_hash`, `role`) VALUES
('admin@comecil.com', '$2y$10$wN9a19xG/Dq7j2eT64MsdO4qA7t4hNfxYw99rA7WkvR7u5G4O6u2K', 'admin')
ON DUPLICATE KEY UPDATE `email` = `email`;

-- Disciplines
INSERT INTO `disciplines` (`id`, `slug`, `title`, `description`, `sort_order`) VALUES
(1, 'computer', 'Computer Science', 'Software engineering, AI, web development and data analytics.', 1),
(2, 'mechanical', 'Mechanical Engineering', 'CAD modeling, FEA simulation, thermodynamics and mechanical design.', 2),
(3, 'civil', 'Civil Engineering', 'Structural engineering, architectural plans, ETABS analysis and quantity survey.', 3)
ON DUPLICATE KEY UPDATE `slug` = `slug`;

-- Services
INSERT INTO `services` (`discipline_id`, `name`, `description`) VALUES
-- Computer Science (ID 1)
(1, 'Website Development', 'Full-stack responsive websites and progressive web apps.'),
(1, 'Frontend Development', 'Modern, interactive user interfaces with React, Vue, or Vanilla JS.'),
(1, 'Backend Development', 'Scalable server architecture, APIs, and microservices.'),
(1, 'Full Stack Development', 'End-to-end software solutions with robust databases.'),
(1, 'Mobile App Development', 'Native and cross-platform Android and iOS applications.'),
(1, 'Software Development', 'Custom desktop and enterprise software suites.'),
(1, 'Artificial Intelligence Solutions', 'Custom AI integration, LLM workflows, and intelligent agents.'),
(1, 'Machine Learning Projects', 'Predictive modeling, classification, regression, and data clustering.'),
(1, 'Data Science', 'Big data analytics, ETL pipelines, and statistical modeling.'),
(1, 'Database Development', 'Relational and NoSQL database modeling, optimization, and queries.'),
(1, 'Python Programming', 'Scripts, automation tools, web scraping, and data processing.'),
(1, 'Java Programming', 'Enterprise-grade backend applications and object-oriented architectures.'),
(1, 'C++ Programming', 'High-performance algorithms, systems programming, and simulations.'),
(1, 'UI/UX Design', 'Wireframing, prototyping, and modern design systems.'),
(1, 'Cybersecurity Solutions', 'Vulnerability assessment, code auditing, and security protocols.'),
(1, 'Automation Projects', 'Workflow automation, task bots, and testing suites.'),
(1, 'Final Year Projects', 'End-to-end guidance and development for university capstone projects.'),

-- Mechanical Engineering (ID 2)
(2, 'CAD Design', 'Parametric 3D modeling and detailed 2D production drawings.'),
(2, '3D Modeling', 'Complex mechanical parts, enclosures, and surface modeling.'),
(2, 'SolidWorks Projects', 'Complete assembly design, exploded views, and bill of materials.'),
(2, 'AutoCAD Mechanical', 'Standards-compliant mechanical drafting and manufacturing blueprints.'),
(2, 'ANSYS Simulation', 'Structural, thermal, and modal finite element analysis.'),
(2, 'Machine Design', 'Gear train calculations, shaft design, and mechanism synthesis.'),
(2, 'Product Design', 'Concept ideation, prototyping, and design for manufacturing (DFM).'),
(2, 'Manufacturing Design', 'CNC machining, injection molding, and sheet metal fabrication plans.'),
(2, 'Thermal Engineering Analysis', 'Heat transfer simulations, heat exchanger design, and HVAC modeling.'),
(2, 'Fluid Mechanics Projects', 'CFD simulation and internal/external flow calculations.'),
(2, 'Mechanical Simulations', 'Kinematic and dynamic motion study simulations.'),
(2, 'Engineering Drawings', 'GD&T annotated engineering drawings and fabrication sheets.'),
(2, 'Technical Reports', 'Comprehensive mechanical engineering documentation and research analysis.'),
(2, 'Research Projects', 'Literature review, technical benchmarking, and numerical modeling.'),
(2, 'Final Year Projects', 'Full capstone project support for mechanical engineering students.'),

-- Civil Engineering (ID 3)
(3, 'Structural Design', 'Reinforced concrete and steel structure design conforming to ACI & Eurocode.'),
(3, 'AutoCAD Drawings', 'Detailed architectural, structural, and MEP engineering drawings.'),
(3, 'Building Plans', 'Residential, commercial, and industrial architectural layouts.'),
(3, 'Architectural Drawings', 'Elevation, section, plan drawings, and site master plans.'),
(3, '3D Building Models', 'Revit BIM models, SketchUp modeling, and 3D architectural renders.'),
(3, 'Quantity Estimation', 'Accurate material take-offs from architectural and structural drawings.'),
(3, 'Cost Estimation', 'Project budgeting, unit rate analysis, and financial feasibility.'),
(3, 'BOQ Preparation', 'Standard Bill of Quantities preparation for tendering and bidding.'),
(3, 'Structural Analysis', 'Load distribution, moment distribution, and frame analysis.'),
(3, 'ETABS Projects', '3D multi-storey building modeling and seismic dynamic analysis.'),
(3, 'SAFE Analysis', 'Foundation design, raft slab, and post-tensioned floor analysis.'),
(3, 'Construction Planning', 'Gantt charts, Primavera/MS Project schedules, and resource allocation.'),
(3, 'Surveying Projects', 'Topographic data analysis, contour mapping, and boundary surveys.'),
(3, 'Civil Engineering Reports', 'Geotechnical and structural integrity reporting.'),
(3, 'Final Year Projects', 'Comprehensive civil engineering capstone and thesis support.');
