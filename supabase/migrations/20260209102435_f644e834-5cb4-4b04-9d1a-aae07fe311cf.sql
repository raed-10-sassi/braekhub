-- Add customer_id to orders for linking to existing customers (nullable for guest orders)
ALTER TABLE public.orders ADD COLUMN customer_id uuid REFERENCES public.customers(id);
