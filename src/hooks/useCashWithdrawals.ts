import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CashWithdrawal {
  id: string;
  amount: number;
  comment: string | null;
  created_by: string | null;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

export function useCashWithdrawals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cash-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_withdrawals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profile names for created_by
      const userIds = [...new Set(data.filter(w => w.created_by).map(w => w.created_by!))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        profiles?.forEach(p => { profileMap[p.id] = p.full_name || "Unknown"; });
      }
      
      return data.map(w => ({
        ...w,
        profiles: w.created_by ? { full_name: profileMap[w.created_by] || null } : null,
      })) as CashWithdrawal[];
    },
  });

  const createWithdrawal = useMutation({
    mutationFn: async ({ amount, comment }: { amount: number; comment?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("cash_withdrawals")
        .insert({ amount, comment: comment || null, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-withdrawals"] });
      toast({
        title: "Cash withdrawal recorded",
        description: "The withdrawal has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error recording withdrawal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    withdrawals: query.data || [],
    isLoading: query.isLoading,
    createWithdrawal,
  };
}
