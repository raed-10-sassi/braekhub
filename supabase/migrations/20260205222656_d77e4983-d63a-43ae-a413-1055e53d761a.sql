
-- Add pause tracking columns to sessions
ALTER TABLE public.sessions ADD COLUMN paused_at timestamp with time zone DEFAULT NULL;
ALTER TABLE public.sessions ADD COLUMN total_paused_seconds integer NOT NULL DEFAULT 0;
