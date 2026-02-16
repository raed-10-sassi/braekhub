import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type TableStatus = "available" | "occupied" | "maintenance";

export interface PoolTable {
  id: string;
  name: string;
  table_number: number;
  status: TableStatus;
  hourly_rate: number;
  created_at: string;
  updated_at: string;
}

export function useTables() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tablesQuery = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .order("table_number");

      if (error) throw error;
      return data as PoolTable[];
    },
  });

  const updateTableStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TableStatus }) => {
      const { error } = await supabase
        .from("tables")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating table",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createTable = useMutation({
    mutationFn: async (table: Omit<PoolTable, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("tables")
        .insert(table)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast({
        title: "Table created",
        description: "New table has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating table",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTable = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; hourly_rate?: number }) => {
      const { error } = await supabase
        .from("tables")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast({
        title: "Table updated",
        description: "Table has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating table",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tables")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast({
        title: "Table deleted",
        description: "Table has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting table",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    tables: tablesQuery.data || [],
    isLoading: tablesQuery.isLoading,
    error: tablesQuery.error,
    updateTableStatus,
    createTable,
    updateTable,
    deleteTable,
    refetch: tablesQuery.refetch,
  };
}
