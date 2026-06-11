-- Run in phpMyAdmin if you have an old users table from before Part 4 auth.
-- This drops auth-related tables and recreates them on next API startup (development).

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS sentiment_results;
DROP TABLE IF EXISTS mentions;
DROP TABLE IF EXISTS sources;
DROP TABLE IF EXISTS keywords;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;
