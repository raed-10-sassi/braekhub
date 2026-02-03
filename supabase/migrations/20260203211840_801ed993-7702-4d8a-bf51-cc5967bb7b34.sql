-- Add player_names column to store multiple player names per session
-- This allows tracking 2 or 4 players who are playing (could be customers or guests)
ALTER TABLE public.sessions 
ADD COLUMN player_names text[] DEFAULT '{}' NOT NULL;