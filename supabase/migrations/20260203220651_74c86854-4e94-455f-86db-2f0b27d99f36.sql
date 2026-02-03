-- Allow guest payments by making customer_id nullable and adding payer_name
ALTER TABLE public.payments 
  ALTER COLUMN customer_id DROP NOT NULL;

-- Add payer_name column to store the name of who paid (for guests and customers)
ALTER TABLE public.payments 
  ADD COLUMN payer_name text;