-- OpinionPulse: remove project-based tables, add search tables
-- Run against opinionpulse_db (backup first)

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS sentiment_results;
DROP TABLE IF EXISTS mentions;
DROP TABLE IF EXISTS keywords;
DROP TABLE IF EXISTS sources;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS projects;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS search_history (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id INT NOT NULL,
  query VARCHAR(100) NOT NULL,
  results_count INT NOT NULL DEFAULT 0,
  sentiment_positive INT NULL,
  sentiment_negative INT NULL,
  sentiment_neutral INT NULL,
  searched_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX ix_search_history_user_id (user_id),
  CONSTRAINT fk_search_history_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS saved_searches (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id INT NOT NULL,
  query VARCHAR(100) NOT NULL,
  filters_json TEXT NULL,
  alert_enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX ix_saved_searches_user_id (user_id),
  CONSTRAINT fk_saved_searches_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
