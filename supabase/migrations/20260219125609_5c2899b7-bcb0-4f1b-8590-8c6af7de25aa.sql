
-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON public.profiles (username);

-- Allow staff to view all profiles (needed for admin user management)
CREATE POLICY "Staff can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

-- Allow admins to update any profile
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
