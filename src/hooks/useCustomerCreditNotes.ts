import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCustomerCreditNotes() {
  const query = useQuery({
    queryKey: ["customer-credit-notes"],
    queryFn: async () => {
      // Get the latest credit payment note per customer
      const { data, error } = await supabase
        .from("payments")
        .select("customer_id, notes, created_at")
        .eq("payment_method", "credits")
        .not("customer_id", "is", null)
        .not("notes", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by customer_id, keep latest note that isn't just "Session credit"
      const notesByCustomer: Record<string, string> = {};
      for (const p of data || []) {
        if (!p.customer_id || !p.notes) continue;
        if (notesByCustomer[p.customer_id]) continue; // already have latest
        if (p.notes !== "Session credit") {
          notesByCustomer[p.customer_id] = p.notes;
        }
      }
      return notesByCustomer;
    },
  });

  return {
    creditNotes: query.data || {},
  };
}

