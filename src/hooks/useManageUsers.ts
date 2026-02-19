import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppUser {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string;
  role: string | null;
  created_at: string;
}

async function callManageUsers(action: string, method: string, body?: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.supabase.co/functions/v1/manage-users?action=${action}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function useManageUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const usersQuery = useQuery<AppUser[]>({
    queryKey: ["managed-users"],
    queryFn: () => callManageUsers("list", "GET"),
  });

  const createUser = useMutation({
    mutationFn: (data: { username: string; full_name: string; email: string; password: string; role: string }) =>
      callManageUsers("create", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      toast({ title: "Utilisateur créé avec succès" });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const updateUser = useMutation({
    mutationFn: (data: { user_id: string; username?: string; full_name?: string; password?: string; role?: string }) =>
      callManageUsers("update", "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      toast({ title: "Utilisateur mis à jour" });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (user_id: string) => callManageUsers("delete", "DELETE", { user_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      toast({ title: "Utilisateur supprimé" });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  return { users: usersQuery.data || [], isLoading: usersQuery.isLoading, createUser, updateUser, deleteUser };
}
