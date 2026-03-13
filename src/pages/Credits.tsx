import { useState } from "react";
import { AlertCircle, DollarSign, Phone, User, MessageSquare, Plus, Banknote, History, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCustomers } from "@/hooks/useCustomers";
import { usePayments } from "@/hooks/usePayments";
import { useGuestCredits } from "@/hooks/useGuestCredits";
import { useCustomerCreditNotes } from "@/hooks/useCustomerCreditNotes";
import { useCashWithdrawals } from "@/hooks/useCashWithdrawals";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Credits() {
  const { customersWithCredit, customers } = useCustomers();
  const { createPayment, addCreditToCustomer } = usePayments();
  const { guestCredits } = useGuestCredits();
  const { creditNotes } = useCustomerCreditNotes();
  const { withdrawals, createWithdrawal, deleteWithdrawal } = useCashWithdrawals();
  const { isAdmin } = useAuth();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [newCreditOpen, setNewCreditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedGuestName, setSelectedGuestName] = useState<string | null>(null);
  const [selectedGuestMaxAmount, setSelectedGuestMaxAmount] = useState<number>(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newCreditType, setNewCreditType] = useState<"guest" | "customer">("guest");

  const customerCreditTotal = customersWithCredit.reduce((sum, c) => sum + c.credit_balance, 0);
  const guestCreditTotal = guestCredits.reduce((sum, g) => sum + g.total_owed, 0);
  const totalCredit = customerCreditTotal + guestCreditTotal;
  const totalEntries = customersWithCredit.length + guestCredits.length;

  const isGuestPayment = !!selectedGuestName;

  const handlePayCredit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (isGuestPayment) {
      createPayment.mutate({
        payer_name: selectedGuestName,
        amount: parseFloat(formData.get("amount") as string),
        payment_method: formData.get("payment_method") as string,
        notes: "Paiement crédit invité",
      });
    } else {
      createPayment.mutate({
        customer_id: formData.get("customer_id") as string,
        amount: parseFloat(formData.get("amount") as string),
        payment_method: formData.get("payment_method") as string,
        notes: "Paiement crédit",
        updateCredit: true,
      });
    }
    setPaymentOpen(false);
    setSelectedCustomer(null);
    setSelectedGuestName(null);
  };

  const handleAddWithdrawal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createWithdrawal.mutate({
      amount: parseFloat(formData.get("amount") as string),
      comment: (formData.get("comment") as string) || undefined,
    });
    setWithdrawalOpen(false);
  };

  const openPaymentForCustomer = (customerId: string) => {
    setSelectedCustomer(customerId);
    setSelectedGuestName(null);
    setPaymentOpen(true);
  };

  const openPaymentForGuest = (guestName: string, maxAmount: number) => {
    setSelectedGuestName(guestName);
    setSelectedGuestMaxAmount(maxAmount);
    setSelectedCustomer(null);
    setPaymentOpen(true);
  };

  const handleNewCredit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("credit_amount") as string);
    const notes = (formData.get("credit_notes") as string) || "Crédit manuel";

    if (newCreditType === "customer") {
      const customerId = formData.get("credit_customer_id") as string;
      addCreditToCustomer.mutate({ customerId, amount });
      createPayment.mutate({
        customer_id: customerId,
        amount,
        payment_method: "credits",
        notes,
      });
    } else {
      const name = formData.get("credit_name") as string;
      createPayment.mutate({
        payer_name: name,
        amount,
        payment_method: "credits",
        notes,
      });
    }
    setNewCreditOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crédits</h1>
          <p className="text-muted-foreground">Soldes clients impayés & retraits de caisse</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* New Credit Button */}
          <Dialog open={newCreditOpen} onOpenChange={(open) => {
            setNewCreditOpen(open);
            if (!open) setNewCreditType("guest");
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau crédit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Ajouter un crédit manuel
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleNewCredit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newCreditType} onValueChange={(v) => setNewCreditType(v as "guest" | "customer")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">Invité (nom libre)</SelectItem>
                      <SelectItem value="customer">Client existant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newCreditType === "guest" ? (
                  <div className="space-y-2">
                    <Label htmlFor="credit_name">Nom</Label>
                    <Input id="credit_name" name="credit_name" placeholder="Nom de la personne" required />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Select name="credit_customer_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="credit_amount">Montant (DT)</Label>
                  <Input id="credit_amount" name="credit_amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_notes">Commentaire</Label>
                  <Textarea id="credit_notes" name="credit_notes" placeholder="Raison du crédit..." rows={2} />
                </div>
                <Button type="submit" className="w-full" disabled={createPayment.isPending}>
                  Ajouter le crédit
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          {/* Add Cash Withdrawal Button */}
          <Dialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Retrait de caisse
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Enregistrer un retrait de caisse
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddWithdrawal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-amount">Montant (DT)</Label>
                  <Input
                    id="withdrawal-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-comment">Commentaire</Label>
                  <Textarea
                    id="withdrawal-comment"
                    name="comment"
                    placeholder="Raison du retrait..."
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createWithdrawal.isPending}>
                  Enregistrer le retrait
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Collect Payment Button */}
          {(customersWithCredit.length > 0 || guestCredits.length > 0) && (
            <Dialog open={paymentOpen} onOpenChange={(open) => {
              setPaymentOpen(open);
              if (!open) { setSelectedCustomer(null); setSelectedGuestName(null); }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Encaisser
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {isGuestPayment
                      ? `Encaisser de ${selectedGuestName}`
                      : "Encaisser un paiement crédit"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePayCredit} className="space-y-4">
                  {!isGuestPayment && (
                    <div className="space-y-2">
                      <Label>Client</Label>
                      <Select name="customer_id" defaultValue={selectedCustomer || undefined} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                        <SelectContent>
                          {customersWithCredit.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} ({customer.credit_balance.toFixed(2)} DT)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {isGuestPayment && (
                    <p className="text-sm text-muted-foreground">
                      En cours : <span className="font-semibold text-foreground">{selectedGuestMaxAmount.toFixed(2)} DT</span>
                    </p>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Montant du paiement (DT)</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={isGuestPayment ? selectedGuestMaxAmount : undefined}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mode de paiement</Label>
                    <Select name="payment_method" defaultValue="cash">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Espèces</SelectItem>
                        <SelectItem value="card">Carte</SelectItem>
                        <SelectItem value="mobile">Paiement mobile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={createPayment.isPending}>
                    Encaisser
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Summary */}
      <Card className="border-warning/50 bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertCircle className="h-5 w-5" />
            Total en cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{totalCredit.toFixed(2)} DT</div>
          <p className="text-muted-foreground mt-1">
            De {totalEntries} {totalEntries !== 1 ? "entrées" : "entrée"}
          </p>
        </CardContent>
      </Card>

      {/* Credits List */}
      <Card>
        <CardHeader>
          <CardTitle>Crédits en cours</CardTitle>
          <CardDescription>Clients et invités avec des soldes impayés</CardDescription>
        </CardHeader>
        <CardContent>
          {totalEntries === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-success/10 mb-4">
                <DollarSign className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-medium">Tout est réglé !</h3>
              <p className="text-muted-foreground">Aucun crédit en cours</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Solde</TableHead>
                  <TableHead>Commentaire</TableHead>
                  <TableHead>Depuis</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customersWithCredit.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Client</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="font-mono text-base">
                        {customer.credit_balance.toFixed(2)} DT
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {creditNotes[customer.id] ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 cursor-help">
                                <MessageSquare className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{creditNotes[customer.id]}</span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{creditNotes[customer.id]}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(customer.updated_at), "d MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPaymentForCustomer(customer.id)}
                      >
                        Encaisser
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {guestCredits.map((guest) => (
                  <TableRow key={`guest-${guest.customer_name}`}>
                    <TableCell>
                      <div className="font-medium">{guest.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {guest.order_count} commande{guest.order_count !== 1 ? "s" : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <User className="h-3 w-3" />
                        Invité
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="font-mono text-base">
                        {guest.total_owed.toFixed(2)} DT
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {guest.latest_note ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 cursor-help">
                                <MessageSquare className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{guest.latest_note}</span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{guest.latest_note}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(guest.latest_order), "d MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPaymentForGuest(guest.customer_name, guest.total_owed)}
                      >
                        Encaisser
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cash Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des retraits de caisse
          </CardTitle>
          <CardDescription>Retraits manuels de la caisse</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucun retrait enregistré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Commentaire</TableHead>
                  {isAdmin && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(w.created_at), "d MMM yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="font-mono">
                        {w.amount.toFixed(2)} DT
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {w.comment || <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(w.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Voulez-vous vraiment supprimer cet enregistrement ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteWithdrawal.mutate(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
