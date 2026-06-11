-- Part 10C: Project alerts — alerts table
-- Run in phpMyAdmin against opinionpulse_db if the table is missing.

USE opinionpulse_db;

CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    condition_text VARCHAR(512) NOT NULL,
    threshold_value FLOAT NOT NULL,
    keyword VARCHAR(255) NULL,
    source VARCHAR(50) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_triggered_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alert_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_alerts_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
