-- Part 7: Sentiment analysis (VADER) — reset sentiment_results with new schema
-- Run in phpMyAdmin against opinionpulse_db if auto-migrate does not apply.

USE opinionpulse_db;

DROP TABLE IF EXISTS sentiment_results;

CREATE TABLE sentiment_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mention_id INT NOT NULL UNIQUE,
    sentiment_label VARCHAR(20) NOT NULL,
    sentiment_score FLOAT NOT NULL,
    confidence FLOAT NOT NULL,
    model_name VARCHAR(50) NOT NULL DEFAULT 'vader',
    analyzed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sentiment_mention
        FOREIGN KEY (mention_id) REFERENCES mentions(id) ON DELETE CASCADE,
    INDEX idx_sentiment_mention (mention_id),
    INDEX idx_sentiment_label (sentiment_label)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
