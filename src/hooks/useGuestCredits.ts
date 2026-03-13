import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GuestCredit {
  customer_name: string;
  total_owed: number;
  order_count: number;
  latest_order: string;
  latest_note: string | null;
}

export function useGuestCredits() {
  const guestCreditsQuery = useQuery({
    queryKey: ["guest-credits"],
    queryFn: async () => {
      // Get all credit orders that are NOT linked to a customer (guest orders)
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("customer_name, total_amount, created_at")
        .eq("payment_method", "credits")
        .is("customer_id", null)
        .not("customer_name", "is", null);

      if (ordersError) throw ordersError;

      // Get session credit debts (payments with payment_method "credits" and notes starting with "Session credit")
      const { data: sessionCredits, error: sessionError } = await supabase
        .from("payments")
        .select("payer_name, amount, created_at, notes")
        .eq("payment_method", "credits")
        .is("customer_id", null)
        .not("payer_name", "is", null)
        .or("notes.like.Session credit%,notes.like.Crédit de session%,notes.like.Reste impayé%");

      if (sessionError) throw sessionError;

      // Get all guest payments (payments with payer_name, no customer_id)
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("payer_name, amount")
        .is("customer_id", null)
        .not("payer_name", "is", null)
        .in("notes", ["Guest credit payment", "Paiement crédit invité"]);

      if (paymentsError) throw paymentsError;

      // Aggregate payments by payer_name
      const paidByName: Record<string, number> = {};
      for (const payment of payments || []) {
        const name = payment.payer_name!;
        paidByName[name] = (paidByName[name] || 0) + Number(payment.amount);
      }

      // Aggregate orders by customer_name
      const grouped: Record<string, GuestCredit> = {};
      for (const order of orders) {
        const name = order.customer_name!;
        if (!grouped[name]) {
          grouped[name] = {
            customer_name: name,
            total_owed: 0,
            order_count: 0,
            latest_order: order.created_at,
            latest_note: null,
          };
        }
        grouped[name].total_owed += Number(order.total_amount);
        grouped[name].order_count += 1;
        if (order.created_at > grouped[name].latest_order) {
          grouped[name].latest_order = order.created_at;
        }
      }

      // Add session credit debts
      for (const credit of sessionCredits || []) {
        const name = credit.payer_name!;
        if (!grouped[name]) {
          grouped[name] = {
            customer_name: name,
            total_owed: 0,
            order_count: 0,
            latest_order: credit.created_at,
            latest_note: null,
          };
        }
        grouped[name].total_owed += Number(credit.amount);
        grouped[name].order_count += 1;
        if (credit.created_at > grouped[name].latest_order) {
          grouped[name].latest_order = credit.created_at;
        }
        // Keep the latest note
        if (credit.notes && credit.notes !== "Session credit") {
          grouped[name].latest_note = credit.notes;
        }
      }

      // Subtract payments already made
      for (const name of Object.keys(grouped)) {
        if (paidByName[name]) {
          grouped[name].total_owed -= paidByName[name];
        }
      }

      return Object.values(grouped).filter((g) => g.total_owed > 0.01);
    },
  });

  return {
    guestCredits: guestCreditsQuery.data || [],
    isLoading: guestCreditsQuery.isLoading,
  };
}
