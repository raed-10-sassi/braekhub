import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Payment {
  id: string;
  session_id: string | null;
  customer_id: string | null;
  payer_name: string | null;
  amount: number;
  payment_method: string;
  notes: string | null;
  created_at: string;
}

export interface PaymentWithRelations extends Payment {
  customers: { name: string } | null;
  sessions: { id: string; total_amount: number } | null;
}

export function usePayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          customers!left (name),
          sessions (id, total_amount),
          profiles:created_by (full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PaymentWithRelations[];
    },
  });

  const createPayment = useMutation({
    mutationFn: async (payment: {
      session_id?: string;
      customer_id?: string;
      payer_name?: string;
      amount: number;
      payment_method?: string;
      notes?: string;
      updateCredit?: boolean;
    }) => {
      const { updateCredit, ...paymentData } = payment;

      const { data, error } = await supabase
        .from("payments")
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;

      // If updating credit balance
      if (updateCredit && payment.amount > 0) {
        const { data: customer } = await supabase
          .from("customers")
          .select("credit_balance")
          .eq("id", payment.customer_id)
          .single();

        if (customer) {
          const newBalance = Math.max(0, customer.credit_balance - payment.amount);
          await supabase
            .from("customers")
            .update({ credit_balance: newBalance })
            .eq("id", payment.customer_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["guest-credits"] });
      toast({
        title: "Payment recorded",
        description: "Payment has been recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error recording payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addCreditToCustomer = useMutation({
    mutationFn: async ({ customerId, amount }: { customerId: string; amount: number }) => {
      const { data: customer } = await supabase
        .from("customers")
        .select("credit_balance")
        .eq("id", customerId)
        .single();

      if (!customer) throw new Error("Customer not found");

      const newBalance = customer.credit_balance + amount;

      const { error } = await supabase
        .from("customers")
        .update({ credit_balance: newBalance })
        .eq("id", customerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Credit added",
        description: "Credit has been added to customer balance.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding credit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const todayPayments = paymentsQuery.data?.filter((p) => {
    if (p.payment_method === "credits") return false;
    const today = new Date();
    const paymentDate = new Date(p.created_at);
    return (
      paymentDate.getDate() === today.getDate() &&
      paymentDate.getMonth() === today.getMonth() &&
      paymentDate.getFullYear() === today.getFullYear()
    );
  }) || [];

  const todayTotal = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  return {
    payments: paymentsQuery.data || [],
    todayPayments,
    todayTotal,
    isLoading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
    createPayment,
    addCreditToCustomer,
    refetch: paymentsQuery.refetch,
  };
}
