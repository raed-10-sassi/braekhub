
-- Add type column to tables to distinguish pool tables from video games
ALTER TABLE public.tables ADD COLUMN type text NOT NULL DEFAULT 'pool_table';

-- Update existing tables to be pool_table type
UPDATE public.tables SET type = 'pool_table' WHERE type = 'pool_table';
