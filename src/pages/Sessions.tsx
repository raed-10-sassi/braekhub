import { useState, useEffect } from "react";
import { Play, Square, Clock, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTables } from "@/hooks/useTables";
import { useSessions } from "@/hooks/useSessions";
import { useCustomers } from "@/hooks/useCustomers";
import { usePayments } from "@/hooks/usePayments";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function ActiveSessionTimer({ startTime }: { startTime: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = differenceInMinutes(new Date(), new Date(startTime));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return (
    <span className="font-mono text-lg font-bold">
      {hours.toString().padStart(2, "0")}:{mins.toString().padStart(2, "0")}
    </span>
  );
}

export default function Sessions() {
  const { tables } = useTables();
  const { sessions, activeSessions, startSession, endSession } = useSessions();
  const { customers, createCustomer } = useCustomers();
  const { createPayment, addCreditToCustomer } = usePayments();

  const [startSessionOpen, setStartSessionOpen] = useState(false);
  const [endSessionData, setEndSessionData] = useState<{
    sessionId: string;
    customerId: string;
    totalAmount: number;
    customerName: string;
  } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");

  const availableTables = tables.filter((t) => t.status === "available");

  const handleStartSession = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tableId = formData.get("table_id") as string;
    const table = tables.find((t) => t.id === tableId);

    startSession.mutate({
      table_id: tableId,
      customer_id: formData.get("customer_id") as string,
      hourly_rate: table?.hourly_rate || 15,
      player_count: parseInt(formData.get("player_count") as string) || 2,
    });
    setStartSessionOpen(false);
  };

  const handleEndSession = (sessionId: string) => {
    const session = activeSessions.find((s) => s.id === sessionId);
    if (!session) return;

    const minutes = differenceInMinutes(new Date(), new Date(session.start_time));
    const hours = minutes / 60;
    const totalAmount = Math.ceil(hours * session.hourly_rate * 100) / 100;

    setEndSessionData({
      sessionId,
      customerId: session.customer_id,
      totalAmount,
      customerName: session.customers.name,
    });
    setPaymentAmount(totalAmount.toFixed(2));
  };

  const handleConfirmEndSession = () => {
    if (!endSessionData) return;

    const paid = parseFloat(paymentAmount) || 0;
    const remaining = endSessionData.totalAmount - paid;

    endSession.mutate({
      sessionId: endSessionData.sessionId,
      totalAmount: endSessionData.totalAmount,
    });

    if (paid > 0) {
      createPayment.mutate({
        session_id: endSessionData.sessionId,
        customer_id: endSessionData.customerId,
        amount: paid,
      });
    }

    if (remaining > 0) {
      addCreditToCustomer.mutate({
        customerId: endSessionData.customerId,
        amount: remaining,
      });
    }

    setEndSessionData(null);
    setPaymentAmount("");
  };

  const handleQuickAddCustomer = async () => {
    if (!newCustomerName.trim()) return;
    await createCustomer.mutateAsync({
      name: newCustomerName,
      phone: null,
      email: null,
      notes: null,
    });
    setNewCustomerName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground">Manage play sessions</p>
        </div>
        <Dialog open={startSessionOpen} onOpenChange={setStartSessionOpen}>
          <DialogTrigger asChild>
            <Button disabled={availableTables.length === 0}>
              <Play className="h-4 w-4 mr-2" />
              Start Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Session</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleStartSession} className="space-y-4">
              <div className="space-y-2">
                <Label>Table</Label>
                <Select name="table_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name} - ${table.hourly_rate}/hr
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select name="customer_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Quick add customer..."
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={handleQuickAddCustomer}>
                    Add
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Number of Players</Label>
                <Select name="player_count" defaultValue="2">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Players (1v1)</SelectItem>
                    <SelectItem value="4">4 Players (2v2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={startSession.isPending}>
                Start Session
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-success" />
            Active Sessions
          </CardTitle>
          <CardDescription>{activeSessions.length} sessions in progress</CardDescription>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No active sessions</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeSessions.map((session) => (
                <Card key={session.id} className="border-success/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Table {session.tables.table_number}</CardTitle>
                      <Badge className="bg-success text-success-foreground">Active</Badge>
                    </div>
                    <CardDescription>{session.customers.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <ActiveSessionTimer startTime={session.start_time} />
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{session.player_count}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span>Rate:</span>
                      <span className="font-mono">${session.hourly_rate}/hr</span>
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleEndSession(session.id)}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      End Session
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>Recent completed sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.slice(0, 20).map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">Table {session.tables.table_number}</TableCell>
                  <TableCell>{session.customers.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {session.end_time
                      ? `${differenceInMinutes(new Date(session.end_time), new Date(session.start_time))} min`
                      : formatDistanceToNow(new Date(session.start_time))}
                  </TableCell>
                  <TableCell>{session.player_count}</TableCell>
                  <TableCell className="font-mono">${session.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={session.status === "active" ? "default" : "secondary"}
                      className={session.status === "active" ? "bg-success text-success-foreground" : ""}
                    >
                      {session.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* End Session Dialog */}
      <AlertDialog open={!!endSessionData} onOpenChange={() => setEndSessionData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Session - {endSessionData?.customerName}</AlertDialogTitle>
            <AlertDialogDescription>
              Total amount: <span className="font-bold">${endSessionData?.totalAmount.toFixed(2)}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="payment">Payment Amount</Label>
            <Input
              id="payment"
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="mt-2"
            />
            {endSessionData && parseFloat(paymentAmount) < endSessionData.totalAmount && (
              <p className="text-sm text-warning mt-2">
                Remaining ${(endSessionData.totalAmount - parseFloat(paymentAmount || "0")).toFixed(2)} will be added
                to customer credit.
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEndSession}>Confirm & End</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
