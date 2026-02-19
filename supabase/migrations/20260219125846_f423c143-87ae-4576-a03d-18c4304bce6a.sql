
-- Allow anonymous lookup of email by username for login
CREATE POLICY "Anyone can lookup email by username"
ON public.profiles
FOR SELECT
TO anon
USING (username IS NOT NULL);
