-- Rename 'rank' column to 'sort_order' to avoid conflict with PostgreSQL rank() function

-- For goals table
ALTER TABLE goals RENAME COLUMN rank TO sort_order;

-- For tasks table
ALTER TABLE tasks RENAME COLUMN rank TO sort_order;
