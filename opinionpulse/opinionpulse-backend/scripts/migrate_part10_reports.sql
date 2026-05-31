-- Part 10B: Project reports — reports table
-- Run in phpMyAdmin against opinionpulse_db if the table is missing.

USE opinionpulse_db;

CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    report_type VARCHAR(20) NOT NULL DEFAULT 'custom',
    summary TEXT NOT NULL,
    report_json TEXT NULL,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_reports_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
