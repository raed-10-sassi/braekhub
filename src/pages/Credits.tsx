import { useState } from "react";
import { AlertCircle, DollarSign, Phone, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomers } from "@/hooks/useCustomers";
import { usePayments } from "@/hooks/usePayments";
import { useGuestCredits } from "@/hooks/useGuestCredits";
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
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const customerCreditTotal = customersWithCredit.reduce((sum, c) => sum + c.credit_balance, 0);
  const guestCreditTotal = guestCredits.reduce((sum, g) => sum + g.total_owed, 0);
  const totalCredit = customerCreditTotal + guestCreditTotal;
  const totalEntries = customersWithCredit.length + guestCredits.length;

  const handlePayCredit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createPayment.mutate({
      customer_id: formData.get("customer_id") as string,
      amount: parseFloat(formData.get("amount") as string),
      payment_method: formData.get("payment_method") as string,
      notes: "Credit payment",
      updateCredit: true,
    });
    setPaymentOpen(false);
    setSelectedCustomer(null);
  };

  const openPaymentForCustomer = (customerId: string) => {
    setSelectedCustomer(customerId);
    setPaymentOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credits</h1>
          <p className="text-muted-foreground">Outstanding customer balances</p>
        </div>
        {customersWithCredit.length > 0 && (
          <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
            <DialogTrigger asChild>
              <Button>
                <DollarSign className="h-4 w-4 mr-2" />
                Collect Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Collect Credit Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePayCredit} className="space-y-4">
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
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount ($)</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
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
                      {format(new Date(guest.latest_order), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs text-muted-foreground">—</span>
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
