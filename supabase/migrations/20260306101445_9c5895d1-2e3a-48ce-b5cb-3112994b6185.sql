
CREATE TABLE public.cash_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL,
  comment TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage cash withdrawals"
  ON public.cash_withdrawals
  FOR ALL
  TO authenticated
  USING (is_staff(auth.uid()));
