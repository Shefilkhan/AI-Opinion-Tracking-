-- Fix signup error: Unknown column 'users.name' / legacy auth schema
-- Run in phpMyAdmin on database opinionpulse_db (or restart backend in dev — auto-sync runs)

USE opinionpulse_db;

ALTER TABLE users ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT '' AFTER id;
UPDATE users SET name = full_name WHERE (name = '' OR name IS NULL) AND full_name IS NOT NULL;
UPDATE users SET name = 'User' WHERE name = '' OR name IS NULL;

ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '' AFTER email;
UPDATE users SET password_hash = hashed_password WHERE (password_hash = '' OR password_hash IS NULL) AND hashed_password IS NOT NULL;

ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user' AFTER password_hash;
