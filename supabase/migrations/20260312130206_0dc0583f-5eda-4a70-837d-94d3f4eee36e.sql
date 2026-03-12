-- Delete all order items first (foreign key constraint)
DELETE FROM public.order_items;
-- Delete all orders
DELETE FROM public.orders;
-- Delete all payments
DELETE FROM public.payments;