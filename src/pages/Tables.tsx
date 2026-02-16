import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTables, TableStatus } from "@/hooks/useTables";
import { useSessions } from "@/hooks/useSessions";
import { useCustomers } from "@/hooks/useCustomers";
import { usePayments } from "@/hooks/usePayments";
import { TableCard } from "@/components/tables/TableCard";
import { EditTableDialog } from "@/components/tables/EditTableDialog";
import { StartSessionDialog } from "@/components/sessions/StartSessionDialog";
import { EndSessionDialog } from "@/components/sessions/EndSessionDialog";
import { differenceInMinutes } from "date-fns";

export default function Tables() {
  const { tables, isLoading, updateTableStatus, createTable, updateTable, deleteTable } = useTables();
  const { activeSessions, startSession, pauseSession, resumeSession, endSession } = useSessions();
  const { customers } = useCustomers();
  const { createPayment, addCreditToCustomer } = usePayments();

  const [newTableOpen, setNewTableOpen] = useState(false);
  const [startSessionTableId, setStartSessionTableId] = useState<string | null>(null);
  const [endSessionData, setEndSessionData] = useState<{
    sessionId: string;
    totalAmount: number;
    playerNames: string[];
  } | null>(null);
  const [editTableId, setEditTableId] = useState<string | null>(null);
  const startSessionTable = tables.find((t) => t.id === startSessionTableId);
  const editTable = tables.find((t) => t.id === editTableId);

  const getActiveSessionForTable = (tableId: string) => {
    return activeSessions.find((s) => s.table_id === tableId);
  };

  const handleCreateTable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTable.mutate({
      name: formData.get("name") as string,
      table_number: parseInt(formData.get("table_number") as string),
      hourly_rate: parseFloat(formData.get("hourly_rate") as string),
      status: "available",
    });
    setNewTableOpen(false);
  };

  const handleStatusChange = (tableId: string, status: TableStatus) => {
    updateTableStatus.mutate({ id: tableId, status });
  };

  const handleStartSession = (playerNames: string[], playerCount: number, effectiveRate: number) => {
    if (!startSessionTable) return;
    
    const defaultCustomer = customers[0];
    
    if (!defaultCustomer) {
      return;
    }

    startSession.mutate({
      table_id: startSessionTable.id,
      customer_id: defaultCustomer.id,
      hourly_rate: effectiveRate,
      player_count: playerCount,
      player_names: playerNames,
    });
    setStartSessionTableId(null);
  };

  const handleEndSessionClick = (tableId: string) => {
    const session = getActiveSessionForTable(tableId);
    if (!session) return;

    // If currently paused, calculate paused seconds up to now
    let totalPausedSeconds = session.total_paused_seconds || 0;
    if (session.paused_at) {
      totalPausedSeconds += Math.floor(
        (new Date().getTime() - new Date(session.paused_at).getTime()) / 1000
      );
    }

    const totalSeconds = differenceInMinutes(new Date(), new Date(session.start_time)) * 60 - totalPausedSeconds;
    const hours = Math.max(0, totalSeconds) / 3600;
    const totalAmount = Math.ceil(hours * session.hourly_rate * 100) / 100;

    setEndSessionData({
      sessionId: session.id,
      totalAmount,
      playerNames: session.player_names || [],
    });
  };

  const handleConfirmEndSession = (paymentAmount: number, payerName: string, paymentMethod: string, customerId?: string) => {
    if (!endSessionData) return;

    endSession.mutate({
      sessionId: endSessionData.sessionId,
      totalAmount: endSessionData.totalAmount,
    });

    if (paymentMethod === "credits") {
      // Credits = entire amount goes to credit (debt), same as consumption orders
      if (customerId) {
        // Registered customer: add to credit balance
        addCreditToCustomer.mutate({
          customerId: customerId,
          amount: endSessionData.totalAmount,
        });
      } else {
        // Guest: create payment record to track debt in Credits page
        createPayment.mutate({
          session_id: endSessionData.sessionId,
          payer_name: payerName,
          amount: endSessionData.totalAmount,
          payment_method: "credits",
          notes: "Session credit",
        });
      }
    } else {
      // Non-credit payment methods
      const remaining = endSessionData.totalAmount - paymentAmount;

      if (paymentAmount > 0) {
        createPayment.mutate({
          session_id: endSessionData.sessionId,
          customer_id: customerId,
          payer_name: payerName,
          amount: paymentAmount,
          payment_method: paymentMethod,
        });
      }

      // Only add credit if the payer is a registered customer
      if (remaining > 0 && customerId) {
        addCreditToCustomer.mutate({
          customerId: customerId,
          amount: remaining,
        });
      }
    }

    setEndSessionData(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tables</h1>
          <p className="text-muted-foreground">Manage your pool tables</p>
        </div>
        <Dialog open={newTableOpen} onOpenChange={setNewTableOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTable} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Table Name</Label>
                <Input id="name" name="name" placeholder="VIP Table" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table_number">Table Number</Label>
                <Input id="table_number" name="table_number" type="number" min="1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input id="hourly_rate" name="hourly_rate" type="number" step="0.01" defaultValue="15.00" required />
              </div>
              <Button type="submit" className="w-full" disabled={createTable.isPending}>
                Create Table
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted" />
              <CardContent className="h-16 bg-muted/50" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              activeSession={getActiveSessionForTable(table.id)}
              onStatusChange={(status) => handleStatusChange(table.id, status)}
              onStartSession={() => setStartSessionTableId(table.id)}
              onPauseSession={() => {
                const session = getActiveSessionForTable(table.id);
                if (session) pauseSession.mutate(session.id);
              }}
              onResumeSession={() => {
                const session = getActiveSessionForTable(table.id);
                if (session) resumeSession.mutate(session.id);
              }}
              onEndSession={() => handleEndSessionClick(table.id)}
              onEditTable={() => setEditTableId(table.id)}
            />
          ))}
        </div>
      )}

      {/* Start Session Dialog */}
      {startSessionTable && (
        <StartSessionDialog
          open={!!startSessionTableId}
          onOpenChange={(open) => !open && setStartSessionTableId(null)}
          tableName={startSessionTable.name}
          tableId={startSessionTable.id}
          hourlyRate={startSessionTable.hourly_rate}
          onStart={handleStartSession}
          isPending={startSession.isPending}
        />
      )}

      {/* End Session Dialog */}
      <EndSessionDialog
        open={!!endSessionData}
        onOpenChange={(open) => !open && setEndSessionData(null)}
        totalAmount={endSessionData?.totalAmount || 0}
        playerNames={endSessionData?.playerNames || []}
        onConfirm={handleConfirmEndSession}
      />

      {/* Edit Table Dialog */}
      {editTable && (
        <EditTableDialog
          open={!!editTableId}
          onOpenChange={(open) => !open && setEditTableId(null)}
          table={editTable}
          onSave={(id, updates) => updateTable.mutate({ id, ...updates })}
          onDelete={(id) => deleteTable.mutate(id)}
          isPending={updateTable.isPending || deleteTable.isPending}
        />
      )}
    </div>
  );
}
