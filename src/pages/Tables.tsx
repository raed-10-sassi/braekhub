import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Gamepad2 } from "lucide-react";
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
import { StartVideoGameSessionDialog } from "@/components/sessions/StartVideoGameSessionDialog";
import { EndSessionDialog } from "@/components/sessions/EndSessionDialog";
import { differenceInMinutes } from "date-fns";

export default function Tables() {
  const { isAdmin } = useAuth();
  const { tables, isLoading, updateTableStatus, createTable, updateTable, deleteTable } = useTables();
  const { activeSessions, startSession, pauseSession, resumeSession, endSession } = useSessions();
  const { customers } = useCustomers();
  const { createPayment, addCreditToCustomer } = usePayments();

  const [newTableOpen, setNewTableOpen] = useState(false);
  const [newVideoGameOpen, setNewVideoGameOpen] = useState(false);
  const [startSessionTableId, setStartSessionTableId] = useState<string | null>(null);
  const [startVideoGameSessionId, setStartVideoGameSessionId] = useState<string | null>(null);
  const [endSessionData, setEndSessionData] = useState<{
    sessionId: string;
    totalAmount: number;
    playerNames: string[];
  } | null>(null);
  const [editTableId, setEditTableId] = useState<string | null>(null);

  const poolTables = tables.filter((t) => t.type === "pool_table");
  const videoGames = tables.filter((t) => t.type === "video_game");

  const startSessionTable = tables.find((t) => t.id === startSessionTableId);
  const startVideoGame = tables.find((t) => t.id === startVideoGameSessionId);
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
      type: "pool_table",
    });
    setNewTableOpen(false);
  };

  const handleCreateVideoGame = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const existingNumbers = tables.map((t) => t.table_number);
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 100;
    createTable.mutate({
      name: formData.get("name") as string,
      table_number: nextNumber,
      hourly_rate: parseFloat(formData.get("hourly_rate") as string),
      status: "available",
      type: "video_game",
    });
    setNewVideoGameOpen(false);
  };

  const handleStatusChange = (tableId: string, status: TableStatus) => {
    updateTableStatus.mutate({ id: tableId, status });
  };

  const handleStartSession = (playerNames: string[], playerCount: number, effectiveRate: number) => {
    if (!startSessionTable) return;
    const defaultCustomer = customers[0];
    if (!defaultCustomer) return;

    startSession.mutate({
      table_id: startSessionTable.id,
      customer_id: defaultCustomer.id,
      hourly_rate: effectiveRate,
      player_count: playerCount,
      player_names: playerNames,
    });
    setStartSessionTableId(null);
  };

  const handleStartVideoGameSession = (playerNames: string[], playerCount: number, effectiveRate: number) => {
    if (!startVideoGame) return;
    const defaultCustomer = customers[0];
    if (!defaultCustomer) return;

    startSession.mutate({
      table_id: startVideoGame.id,
      customer_id: defaultCustomer.id,
      hourly_rate: effectiveRate,
      player_count: playerCount,
      player_names: playerNames,
    });
    setStartVideoGameSessionId(null);
  };

  const handleEndSessionClick = (tableId: string) => {
    const session = getActiveSessionForTable(tableId);
    if (!session) return;

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

  const handleConfirmEndSession = (paymentAmount: number, payerName: string, paymentMethod: string, customerId?: string, notes?: string) => {
    if (!endSessionData) return;

    endSession.mutate({
      sessionId: endSessionData.sessionId,
      totalAmount: endSessionData.totalAmount,
    });

    if (paymentMethod === "credits") {
      if (customerId) {
        addCreditToCustomer.mutate({ customerId, amount: endSessionData.totalAmount });
        createPayment.mutate({
          session_id: endSessionData.sessionId,
          customer_id: customerId,
          payer_name: payerName,
          amount: endSessionData.totalAmount,
          payment_method: "credits",
          notes: notes || "Crédit de session",
        });
      } else {
        createPayment.mutate({
          session_id: endSessionData.sessionId,
          payer_name: payerName,
          amount: endSessionData.totalAmount,
          payment_method: "credits",
          notes: notes || "Crédit de session",
        });
      }
    } else {
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
      if (remaining > 0) {
        if (customerId) {
          addCreditToCustomer.mutate({ customerId, amount: remaining });
          createPayment.mutate({
            session_id: endSessionData.sessionId,
            customer_id: customerId,
            payer_name: payerName,
            amount: remaining,
            payment_method: "credits",
            notes: notes || "Reste impayé de session",
          });
        } else {
          // Guest: record as credit payment so it shows in Credits page
          createPayment.mutate({
            session_id: endSessionData.sessionId,
            payer_name: payerName,
            amount: remaining,
            payment_method: "credits",
            notes: notes || "Reste impayé de session",
          });
        }
      }
    }

    setEndSessionData(null);
  };

  const renderGrid = (items: typeof tables, onStartSession: (id: string) => void) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          activeSession={getActiveSessionForTable(table.id)}
          onStatusChange={(status) => handleStatusChange(table.id, status)}
          onStartSession={() => onStartSession(table.id)}
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
  );

  return (
    <div className="space-y-6">
      {/* Pool Tables Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tables</h1>
          <p className="text-muted-foreground">Gérer vos tables de billard</p>
        </div>
        <Dialog open={newTableOpen} onOpenChange={setNewTableOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle table</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTable} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la table</Label>
                <Input id="name" name="name" placeholder="Table VIP" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table_number">Numéro de table</Label>
                <Input id="table_number" name="table_number" type="number" min="1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Tarif horaire (DT)</Label>
                <Input id="hourly_rate" name="hourly_rate" type="number" step="0.01" defaultValue="15.00" required />
              </div>
              <Button type="submit" className="w-full" disabled={createTable.isPending}>
                Créer la table
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
        renderGrid(poolTables, setStartSessionTableId)
      )}

      {/* Video Games Section */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gamepad2 className="h-6 w-6" />
            Jeux Vidéo
          </h2>
          <p className="text-muted-foreground">Gérer vos stations de jeux vidéo</p>
        </div>
        <Dialog open={newVideoGameOpen} onOpenChange={setNewVideoGameOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un jeu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau jeu vidéo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateVideoGame} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vg-name">Nom du jeu</Label>
                <Input id="vg-name" name="name" placeholder="Station PS5" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vg-hourly_rate">Tarif horaire (DT)</Label>
                <Input id="vg-hourly_rate" name="hourly_rate" type="number" step="0.01" defaultValue="10.00" required />
              </div>
              <Button type="submit" className="w-full" disabled={createTable.isPending}>
                Créer le jeu vidéo
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!isLoading && renderGrid(videoGames, setStartVideoGameSessionId)}

      {/* Start Pool Table Session Dialog */}
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

      {/* Start Video Game Session Dialog */}
      {startVideoGame && (
        <StartVideoGameSessionDialog
          open={!!startVideoGameSessionId}
          onOpenChange={(open) => !open && setStartVideoGameSessionId(null)}
          gameName={startVideoGame.name}
          hourlyRate={startVideoGame.hourly_rate}
          onStart={handleStartVideoGameSession}
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
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
