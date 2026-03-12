import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  credit_balance: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCustomers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Customer[];
    },
  });

  const createCustomer = useMutation({
    mutationFn: async (customer: Omit<Customer, "id" | "created_at" | "updated_at" | "credit_balance">) => {
      const { data, error } = await supabase
        .from("customers")
        .insert({ ...customer, credit_balance: 0 })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Customer created",
        description: "New customer has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating customer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Client mis à jour",
        description: "Les informations du client ont été mises à jour.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur lors de la mise à jour",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Client supprimé",
        description: "Le client a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur lors de la suppression",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const customersWithCredit = customersQuery.data?.filter((c) => c.credit_balance > 0) || [];

  return {
    customers: customersQuery.data || [],
    customersWithCredit,
    isLoading: customersQuery.isLoading,
    error: customersQuery.error,
    createCustomer,
    updateCustomer,
    refetch: customersQuery.refetch,
  };
}
