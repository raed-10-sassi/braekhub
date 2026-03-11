
ALTER TABLE public.payments ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT NULL;
