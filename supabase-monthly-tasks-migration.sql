-- Monthly Tasks: add columns to tasks table
ALTER TABLE tasks ADD COLUMN is_monthly BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN monthly_source_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN monthly_month TEXT; -- e.g. '2026-02' to track which month this instance is for

-- Index for efficient monthly task queries
CREATE INDEX idx_tasks_is_monthly ON tasks(is_monthly) WHERE is_monthly = true;
CREATE INDEX idx_tasks_monthly_source_id ON tasks(monthly_source_id) WHERE monthly_source_id IS NOT NULL;
