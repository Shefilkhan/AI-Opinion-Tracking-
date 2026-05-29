-- Run in phpMyAdmin if mentions table uses the old schema (source_id, content).
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS sentiment_results;
DROP TABLE IF EXISTS mentions;
SET FOREIGN_KEY_CHECKS = 1;
-- Restart the API to recreate tables via SQLAlchemy (development mode).
