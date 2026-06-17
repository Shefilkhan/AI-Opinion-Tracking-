-- OpinionPulse subscription plans and usage tracking (Stripe-ready)
-- Run against opinionpulse_db when not using SQLAlchemy create_all

CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price_monthly_cents INT NOT NULL,
  searches_per_month INT NOT NULL,
  data_sources_json JSON NOT NULL,
  search_history_days INT NOT NULL,
  csv_export_max_rows INT NOT NULL,
  ai_opinion_summary TINYINT(1) DEFAULT 0,
  ai_debate_analysis TINYINT(1) DEFAULT 0,
  ai_trend_prediction TINYINT(1) DEFAULT 0,
  realtime_alerts_max INT DEFAULT 0,
  chat_messages_per_day INT NOT NULL,
  chat_history_days INT NOT NULL,
  api_access TINYINT(1) DEFAULT 0,
  team_members_max INT DEFAULT 1,
  sso_enabled TINYINT(1) DEFAULT 0,
  support_tier VARCHAR(30) DEFAULT 'email',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO plans (
  id, name, price_monthly_cents, searches_per_month,
  data_sources_json, search_history_days, csv_export_max_rows,
  ai_opinion_summary, ai_debate_analysis, ai_trend_prediction,
  realtime_alerts_max, chat_messages_per_day, chat_history_days,
  api_access, team_members_max, sso_enabled, support_tier
) VALUES
('starter', 'Starter', 0, 100,
  '["reddit","hackernews","devto","newsapi","guardian","bluesky","mastodon"]', 7, 100,
  0, 0, 0, 0, 5, 7, 0, 1, 0, 'email'),
('pro', 'Pro', 2900, -1,
  '"all"', 30, -1,
  1, 1, 1, 5, 100, 30, 0, 1, 0, 'priority_email'),
('enterprise', 'Enterprise', 9900, -1,
  '"all"', 365, -1,
  1, 1, 1, -1, -1, 365, 1, 10, 1, 'dedicated_slack')
ON DUPLICATE KEY UPDATE name = VALUES(name);

CREATE TABLE IF NOT EXISTS usage_tracking (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  searches_used INT DEFAULT 0,
  chat_messages_used_today INT DEFAULT 0,
  chat_messages_today_date DATE NULL,
  csv_exports_used INT DEFAULT 0,
  ai_summary_calls INT DEFAULT 0,
  ai_debate_calls INT DEFAULT 0,
  ai_trend_calls INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_period (user_id, period_start),
  CONSTRAINT fk_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Subscription columns on users (run once; ignore errors if columns exist)
ALTER TABLE users ADD COLUMN plan_id VARCHAR(20) DEFAULT 'starter';
ALTER TABLE users ADD COLUMN plan_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN plan_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN plan_renews_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255) NULL;

-- Add FK after plans exist (may fail if already present)
ALTER TABLE users ADD CONSTRAINT fk_users_plan FOREIGN KEY (plan_id) REFERENCES plans(id);
