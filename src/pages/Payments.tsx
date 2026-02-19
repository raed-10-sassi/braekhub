import { useMemo, useState } from "react";
import { DollarSign, Plus, CreditCard, Banknote, Smartphone, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { usePayments } from "@/hooks/usePayments";
import { useCustomers } from "@/hooks/useCustomers";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const paymentMethodIcons: Record<string, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  mobile: Smartphone,
};

export default function Payments() {
  const { payments, todayPayments, todayTotal, createPayment } = usePayments();
  const { customers, customersWithCredit } = useCustomers();
  const [newPaymentOpen, setNewPaymentOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  const filteredPayments = useMemo(() => {
    if (!filterDate) return payments;
    return payments.filter((p) => isSameDay(new Date(p.created_at), filterDate));
  }, [payments, filterDate]);

  const filteredTotal = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  const handleCreatePayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerId = formData.get("customer_id") as string;
    const isCredit = formData.get("is_credit") === "true";

    createPayment.mutate({
      customer_id: customerId,
      amount: parseFloat(formData.get("amount") as string),
      payment_method: formData.get("payment_method") as string,
      notes: (formData.get("notes") as string) || undefined,
      updateCredit: isCredit,
    });
    setNewPaymentOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Track and record payments</p>
        </div>
        <Dialog open={newPaymentOpen} onOpenChange={setNewPaymentOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePayment} className="space-y-4">
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
                        {customer.credit_balance > 0 && ` (Credit: $${customer.credit_balance.toFixed(2)})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
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
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select name="is_credit" defaultValue="false">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">New Payment</SelectItem>
                    <SelectItem value="true">Credit Payment (reduces balance)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Optional notes..." />
              </div>
              <Button type="submit" className="w-full" disabled={createPayment.isPending}>
                Record Payment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">${todayTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{todayPayments.length} payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              ${customersWithCredit.reduce((sum, c) => sum + c.credit_balance, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{customersWithCredit.length} customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                {filterDate
                  ? `Payments on ${format(filterDate, "MMM d, yyyy")} — Total: $${filteredTotal.toFixed(2)}`
                  : "All recorded payments"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !filterDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDate ? format(filterDate, "PPP") : "Filter by date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={filterDate}
                    onSelect={setFilterDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {filterDate && (
                <Button variant="ghost" size="sm" onClick={() => setFilterDate(undefined)}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {filterDate ? "No payments on this date" : "No payments recorded yet"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const Icon = paymentMethodIcons[payment.payment_method] || DollarSign;
                  const displayName = payment.customers?.name || payment.payer_name || "Unknown";
                  const isGuest = !payment.customers;
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(payment.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {displayName}
                        {isGuest && (
                          <Badge variant="outline" className="ml-2 text-xs">Guest</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono bg-success/10 text-success">
                          <DollarSign className="h-3 w-3" />
                          {payment.amount.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{payment.payment_method}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {payment.notes || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
