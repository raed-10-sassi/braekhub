import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SessionStatus = "active" | "completed" | "cancelled";

export interface Session {
  id: string;
  table_id: string;
  customer_id: string;
  start_time: string;
  end_time: string | null;
  player_count: number;
  status: SessionStatus;
  hourly_rate: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  player_names: string[];
  paused_at: string | null;
  total_paused_seconds: number;
}

export interface SessionWithRelations extends Session {
  tables: { name: string; table_number: number };
  customers: { name: string; phone: string | null };
}

export function useSessions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          tables (name, table_number),
          customers (name, phone)
        `)
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data as SessionWithRelations[];
    },
  });

  const activeSessionsQuery = useQuery({
    queryKey: ["sessions", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          tables (name, table_number),
          customers (name, phone)
        `)
        .eq("status", "active")
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data as SessionWithRelations[];
    },
  });

  const startSession = useMutation({
    mutationFn: async (session: {
      table_id: string;
      customer_id: string;
      hourly_rate: number;
      player_count: number;
      player_names: string[];
      notes?: string;
    }) => {
      // First update table status
      await supabase
        .from("tables")
        .update({ status: "occupied" })
        .eq("id", session.table_id);

      const { data, error } = await supabase
        .from("sessions")
        .insert({
          ...session,
          status: "active",
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast({
        title: "Session started",
        description: "Play session has been started.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error starting session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pauseSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("sessions")
        .update({ paused_at: new Date().toISOString() })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({ title: "Session paused", description: "Timer has been paused." });
    },
    onError: (error) => {
      toast({ title: "Error pausing session", description: error.message, variant: "destructive" });
    },
  });

  const resumeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      // Get the session to calculate paused duration
      const { data: session } = await supabase
        .from("sessions")
        .select("paused_at, total_paused_seconds")
        .eq("id", sessionId)
        .single();

      if (!session?.paused_at) throw new Error("Session is not paused");

      const pausedSeconds = Math.floor(
        (new Date().getTime() - new Date(session.paused_at).getTime()) / 1000
      );

      const { error } = await supabase
        .from("sessions")
        .update({
          paused_at: null,
          total_paused_seconds: (session.total_paused_seconds || 0) + pausedSeconds,
        })
        .eq("id", sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({ title: "Session resumed", description: "Timer has been resumed." });
    },
    onError: (error) => {
      toast({ title: "Error resuming session", description: error.message, variant: "destructive" });
    },
  });

  const endSession = useMutation({
    mutationFn: async ({ sessionId, totalAmount }: { sessionId: string; totalAmount: number }) => {
      // Get session to update table
      const { data: session } = await supabase
        .from("sessions")
        .select("table_id")
        .eq("id", sessionId)
        .single();

      if (session) {
        await supabase
          .from("tables")
          .update({ status: "available" })
          .eq("id", session.table_id);
      }

      const { error } = await supabase
        .from("sessions")
        .update({
          status: "completed",
          end_time: new Date().toISOString(),
          total_amount: totalAmount,
          paused_at: null,
        })
        .eq("id", sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast({
        title: "Session ended",
        description: "Play session has been completed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error ending session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const todaySessions = sessionsQuery.data?.filter((s) => {
    const today = new Date();
    const sessionDate = new Date(s.start_time);
    return (
      sessionDate.getDate() === today.getDate() &&
      sessionDate.getMonth() === today.getMonth() &&
      sessionDate.getFullYear() === today.getFullYear()
    );
  }) || [];

  return {
    sessions: sessionsQuery.data || [],
    activeSessions: activeSessionsQuery.data || [],
    todaySessions,
    isLoading: sessionsQuery.isLoading,
    error: sessionsQuery.error,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    refetch: sessionsQuery.refetch,
  };
}
