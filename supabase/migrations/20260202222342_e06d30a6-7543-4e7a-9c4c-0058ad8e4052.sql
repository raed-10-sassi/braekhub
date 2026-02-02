-- Fix is_staff function to properly return FALSE for anonymous users (NULL user_id)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN _user_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role IN ('admin', 'hall_owner')
    )
  END
$$;

-- Fix has_role function to properly return FALSE for anonymous users (NULL user_id)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN _user_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
  END
$$;

-- Drop existing profiles SELECT policies and create a unified one requiring authentication
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;

-- Single policy: Authenticated users can view their own profile OR staff can view all
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = id OR 
    is_staff(auth.uid())
  )
);

-- Drop and recreate customers policy with explicit auth check
DROP POLICY IF EXISTS "Staff can manage customers" ON public.customers;

CREATE POLICY "Staff can manage customers" 
ON public.customers 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND is_staff(auth.uid())
);

-- Drop and recreate payments policy with explicit auth check
DROP POLICY IF EXISTS "Staff can manage payments" ON public.payments;

CREATE POLICY "Staff can manage payments" 
ON public.payments 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND is_staff(auth.uid())
);

-- Drop and recreate sessions policy with explicit auth check
DROP POLICY IF EXISTS "Staff can manage sessions" ON public.sessions;

CREATE POLICY "Staff can manage sessions" 
ON public.sessions 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND is_staff(auth.uid())
);