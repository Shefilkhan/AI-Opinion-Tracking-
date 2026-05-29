-- Run in phpMyAdmin if projects/keywords/sources tables exist from an older schema.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS tracking_frequency VARCHAR(20) NOT NULL DEFAULT 'daily';

ALTER TABLE keywords
  ADD COLUMN IF NOT EXISTS keyword_type VARCHAR(50) NOT NULL DEFAULT 'topic';

-- MariaDB 10.5+ supports IF NOT EXISTS on ADD COLUMN; otherwise run manually.

-- Rename source_type to source_name if needed:
-- ALTER TABLE sources CHANGE source_type source_name VARCHAR(50) NOT NULL;
