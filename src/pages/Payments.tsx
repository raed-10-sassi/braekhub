import { useMemo, useState } from "react";
import { DollarSign, Plus, CreditCard, Banknote, Smartphone, CalendarIcon, Download, ShoppingCart, ArrowDownCircle } from "lucide-react";
import * as XLSX from "xlsx";
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
import { useOrders } from "@/hooks/useOrders";
import { useCashWithdrawals } from "@/hooks/useCashWithdrawals";
import { format, isWithinInterval } from "date-fns";
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

interface UnifiedEntry {
  id: string;
  type: "payment" | "order" | "withdrawal";
  date: string;
  name: string;
  amount: number;
  paymentMethod: string;
  notes: string;
  isGuest: boolean;
  createdBy: string | null;
}

export default function Payments() {
  const { payments, createPayment } = usePayments();
  const { customers, customersWithCredit } = useCustomers();
  const { orders } = useOrders();
  const { withdrawals } = useCashWithdrawals();
  const [newPaymentOpen, setNewPaymentOpen] = useState(false);
  const [filterFrom, setFilterFrom] = useState<Date | undefined>(undefined);
  const [filterTo, setFilterTo] = useState<Date | undefined>(undefined);
  const [filterFromTime, setFilterFromTime] = useState("00:00");
  const [filterToTime, setFilterToTime] = useState("23:59");

  const buildDateWithTime = (date: Date, time: string) => {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
  };

  // Build unified list
  const unifiedEntries = useMemo<UnifiedEntry[]>(() => {
    const entries: UnifiedEntry[] = [];

    // Payments
    payments.forEach((p) => {
      entries.push({
        id: p.id,
        type: "payment",
        date: p.created_at,
        name: p.customers?.name || p.payer_name || "Unknown",
        amount: p.amount,
        paymentMethod: p.payment_method,
        notes: p.notes || "",
        isGuest: !p.customers,
      });
    });

    // Consumption orders
    orders.forEach((o) => {
      entries.push({
        id: o.id,
        type: "order",
        date: o.created_at,
        name: o.customer_name || "Unknown",
        amount: o.total_amount,
        paymentMethod: o.payment_method,
        notes: "Consumption order",
        isGuest: false,
      });
    });

    // Cash withdrawals
    withdrawals.forEach((w) => {
      entries.push({
        id: w.id,
        type: "withdrawal",
        date: w.created_at,
        name: "Cash Withdrawal",
        amount: w.amount,
        paymentMethod: "cash",
        notes: w.comment || "",
        isGuest: false,
      });
    });

    // Sort by date descending
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return entries;
  }, [payments, orders, withdrawals]);

  // Apply date filter
  const filteredEntries = useMemo(() => {
    if (!filterFrom && !filterTo) return unifiedEntries;
    return unifiedEntries.filter((e) => {
      const d = new Date(e.date);
      const start = filterFrom ? buildDateWithTime(filterFrom, filterFromTime) : undefined;
      const end = filterTo ? buildDateWithTime(filterTo, filterToTime) : undefined;
      if (start && end) return isWithinInterval(d, { start, end });
      if (start) return d >= start;
      if (end) return d <= end;
      return true;
    });
  }, [unifiedEntries, filterFrom, filterTo, filterFromTime, filterToTime]);

  // Today helpers
  const today = new Date();
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  // Today's total = payments (excl credits) + orders (excl credits) - withdrawals
  const todayTotal = useMemo(() => {
    const paymentsTotal = payments
      .filter((p) => isToday(p.created_at) && p.payment_method !== "credits")
      .reduce((sum, p) => sum + p.amount, 0);
    const ordersTotal = orders
      .filter((o) => isToday(o.created_at) && o.payment_method !== "credits")
      .reduce((sum, o) => sum + o.total_amount, 0);
    const withdrawalsTotal = withdrawals
      .filter((w) => isToday(w.created_at))
      .reduce((sum, w) => sum + w.amount, 0);
    return paymentsTotal + ordersTotal - withdrawalsTotal;
  }, [payments, orders, withdrawals]);

  const todayEntriesCount = unifiedEntries.filter((e) => isToday(e.date)).length;

  // Filtered total (excl credits, withdrawals subtracted)
  const filteredTotal = useMemo(() => {
    let total = 0;
    filteredEntries.forEach((e) => {
      if (e.type === "withdrawal") {
        total -= e.amount;
      } else if (e.paymentMethod !== "credits") {
        total += e.amount;
      }
    });
    return total;
  }, [filteredEntries]);

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

  const getEntryIcon = (entry: UnifiedEntry) => {
    if (entry.type === "order") return ShoppingCart;
    if (entry.type === "withdrawal") return ArrowDownCircle;
    return paymentMethodIcons[entry.paymentMethod] || DollarSign;
  };

  const getEntryTypeBadge = (entry: UnifiedEntry) => {
    if (entry.type === "order") return <Badge variant="outline" className="text-xs">Order</Badge>;
    if (entry.type === "withdrawal") return <Badge variant="destructive" className="text-xs">Withdrawal</Badge>;
    return null;
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold", todayTotal >= 0 ? "text-success" : "text-destructive")}>
              ${todayTotal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{todayEntriesCount} entries today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{unifiedEntries.length}</div>
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
                {filterFrom || filterTo
                  ? `${filterFrom ? format(filterFrom, "MMM d, yyyy") : "Start"}${filterTo ? ` — ${format(filterTo, "MMM d, yyyy")}` : ""} — Total: $${filteredTotal.toFixed(2)}`
                  : "All payments, orders & withdrawals"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[160px] justify-start text-left font-normal",
                      !filterFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterFrom ? format(filterFrom, "PP") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={filterFrom}
                    onSelect={setFilterFrom}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                  <div className="px-3 pb-3">
                    <Label className="text-xs text-muted-foreground">Heure</Label>
                    <Input
                      type="time"
                      value={filterFromTime}
                      onChange={(e) => setFilterFromTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[160px] justify-start text-left font-normal",
                      !filterTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterTo ? format(filterTo, "PP") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={filterTo}
                    onSelect={setFilterTo}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                  <div className="px-3 pb-3">
                    <Label className="text-xs text-muted-foreground">Heure</Label>
                    <Input
                      type="time"
                      value={filterToTime}
                      onChange={(e) => setFilterToTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </PopoverContent>
              </Popover>
              {(filterFrom || filterTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterFrom(undefined); setFilterTo(undefined); setFilterFromTime("00:00"); setFilterToTime("23:59"); }}>
                  Clear
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const rows = filteredEntries.map((e) => ({
                    Date: format(new Date(e.date), "yyyy-MM-dd HH:mm"),
                    Type: e.type,
                    Client: e.name,
                    Montant: e.type === "withdrawal" ? -e.amount : e.amount,
                    Méthode: e.paymentMethod,
                    Notes: e.notes || "",
                  }));
                  const ws = XLSX.utils.json_to_sheet(rows);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Paiements");
                  XLSX.writeFile(wb, `paiements_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
                }}
                disabled={filteredEntries.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {filterFrom || filterTo ? "No entries in this period" : "No entries recorded yet"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => {
                  const Icon = getEntryIcon(entry);
                  return (
                    <TableRow key={`${entry.type}-${entry.id}`}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(entry.date), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {getEntryTypeBadge(entry) || <Badge variant="secondary" className="text-xs">Payment</Badge>}
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.name}
                        {entry.isGuest && (
                          <Badge variant="outline" className="ml-2 text-xs">Guest</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-mono",
                            entry.type === "withdrawal"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-success/10 text-success"
                          )}
                        >
                          {entry.type === "withdrawal" ? "-" : ""}
                          <DollarSign className="h-3 w-3" />
                          {entry.amount.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{entry.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {entry.notes || "-"}
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
