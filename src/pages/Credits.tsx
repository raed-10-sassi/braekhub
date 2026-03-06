import { useState } from "react";
import { AlertCircle, DollarSign, Phone, User, MessageSquare, Plus, Banknote, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const { createPayment } = usePayments();
  const { guestCredits } = useGuestCredits();
  const { creditNotes } = useCustomerCreditNotes();
  const { withdrawals, createWithdrawal } = useCashWithdrawals();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedGuestName, setSelectedGuestName] = useState<string | null>(null);
  const [selectedGuestMaxAmount, setSelectedGuestMaxAmount] = useState<number>(0);

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
        notes: "Guest credit payment",
      });
    } else {
      createPayment.mutate({
        customer_id: formData.get("customer_id") as string,
        amount: parseFloat(formData.get("amount") as string),
        payment_method: formData.get("payment_method") as string,
        notes: "Credit payment",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credits</h1>
          <p className="text-muted-foreground">Outstanding customer balances & cash withdrawals</p>
        </div>
        <div className="flex gap-2">
          {/* Add Cash Withdrawal Button */}
          <Dialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Cash Withdrawal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Record Cash Withdrawal
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddWithdrawal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-amount">Amount ($)</Label>
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
                  <Label htmlFor="withdrawal-comment">Comment</Label>
                  <Textarea
                    id="withdrawal-comment"
                    name="comment"
                    placeholder="Reason for withdrawal..."
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createWithdrawal.isPending}>
                  Save Withdrawal
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
                  Collect Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {isGuestPayment
                      ? `Collect from ${selectedGuestName}`
                      : "Collect Credit Payment"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePayCredit} className="space-y-4">
                  {!isGuestPayment && (
                    <div className="space-y-2">
                      <Label>Customer</Label>
                      <Select name="customer_id" defaultValue={selectedCustomer || undefined} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customersWithCredit.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} (${customer.credit_balance.toFixed(2)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {isGuestPayment && (
                    <p className="text-sm text-muted-foreground">
                      Outstanding: <span className="font-semibold text-foreground">${selectedGuestMaxAmount.toFixed(2)}</span>
                    </p>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Payment Amount ($)</Label>
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
                    <Label>Payment Method</Label>
                    <Select name="payment_method" defaultValue="cash">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="mobile">Mobile Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={createPayment.isPending}>
                    Collect Payment
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
            Total Outstanding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">${totalCredit.toFixed(2)}</div>
          <p className="text-muted-foreground mt-1">
            From {totalEntries} {totalEntries !== 1 ? "entries" : "entry"}
          </p>
        </CardContent>
      </Card>

      {/* Credits List */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Credits</CardTitle>
          <CardDescription>Customers and guests with unpaid balances</CardDescription>
        </CardHeader>
        <CardContent>
          {totalEntries === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-success/10 mb-4">
                <DollarSign className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-medium">All Clear!</h3>
              <p className="text-muted-foreground">No outstanding credits</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Since</TableHead>
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
                      <Badge variant="outline">Customer</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="font-mono text-base">
                        ${customer.credit_balance.toFixed(2)}
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
                      {format(new Date(customer.updated_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPaymentForCustomer(customer.id)}
                      >
                        Collect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {guestCredits.map((guest) => (
                  <TableRow key={`guest-${guest.customer_name}`}>
                    <TableCell>
                      <div className="font-medium">{guest.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {guest.order_count} order{guest.order_count !== 1 ? "s" : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <User className="h-3 w-3" />
                        Guest
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="font-mono text-base">
                        ${guest.total_owed.toFixed(2)}
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
                      {format(new Date(guest.latest_order), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPaymentForGuest(guest.customer_name, guest.total_owed)}
                      >
                        Collect
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
            Cash Withdrawal History
          </CardTitle>
          <CardDescription>Manual cash withdrawals from the register</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No cash withdrawals recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(w.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="font-mono">
                        ${w.amount.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {w.comment || <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
