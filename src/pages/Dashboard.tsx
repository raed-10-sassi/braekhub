import { Clock, Users, DollarSign, Grid3X3, AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTables } from "@/hooks/useTables";
import { useSessions } from "@/hooks/useSessions";
import { usePayments } from "@/hooks/usePayments";
import { useCustomers } from "@/hooks/useCustomers";
import { useCashWithdrawals } from "@/hooks/useCashWithdrawals";
import { useOrders } from "@/hooks/useOrders";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variantStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { tables } = useTables();
  const { activeSessions, todaySessions } = useSessions();
  const { todayTotal, todayPayments } = usePayments();
  const { customersWithCredit } = useCustomers();
  const { withdrawals } = useCashWithdrawals();
  const { orders } = useOrders();

  const availableTables = tables.filter((t) => t.status === "available").length;
  const occupiedTables = tables.filter((t) => t.status === "occupied").length;
  const totalCredit = customersWithCredit.reduce((sum, c) => sum + c.credit_balance, 0);

  const today = new Date();
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const todayWithdrawalsTotal = withdrawals
    .filter((w) => isToday(w.created_at))
    .reduce((sum, w) => sum + w.amount, 0);

  const todayOrdersTotal = orders
    .filter((o) => isToday(o.created_at) && o.payment_method !== "credits")
    .reduce((sum, o) => sum + o.total_amount, 0);

  const netTodayTotal = todayTotal + todayOrdersTotal - todayWithdrawalsTotal;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de vos opérations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Sessions actives"
          value={activeSessions.length}
          description={`${occupiedTables} sur ${tables.length} tables occupées`}
          icon={Clock}
          variant={activeSessions.length > 0 ? "success" : "default"}
        />
        <StatCard
          title="Tables disponibles"
          value={availableTables}
          description={`${tables.length} tables au total`}
          icon={Grid3X3}
        />
        <StatCard
          title="Revenu du jour"
          value={`${netTodayTotal.toFixed(2)} DT`}
          description={`${todayPayments.length} paiements${todayWithdrawalsTotal > 0 ? ` - ${todayWithdrawalsTotal.toFixed(2)} DT retraits` : ""}`}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Crédits en cours"
          value={`${totalCredit.toFixed(2)} DT`}
          description={`${customersWithCredit.length} clients`}
          icon={AlertCircle}
          variant={totalCredit > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        {/* Outstanding Credits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Crédits en cours</CardTitle>
              <CardDescription>Clients avec des soldes impayés</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/credits">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {customersWithCredit.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Aucun crédit en cours</p>
            ) : (
              <div className="space-y-3">
                {customersWithCredit.slice(0, 5).map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.phone || "Pas de téléphone"}</p>
                    </div>
                    <Badge variant="destructive" className="font-mono">
                      {customer.credit_balance.toFixed(2)} DT
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activité du jour</CardTitle>
          <CardDescription>{todaySessions.length} sessions aujourd'hui</CardDescription>
        </CardHeader>
        <CardContent>
          {todaySessions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Aucune session aujourd'hui</p>
          ) : (
            <div className="space-y-2">
              {todaySessions.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Table {session.tables.table_number}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={session.status === "active" ? "default" : "secondary"}
                      className={session.status === "active" ? "bg-success text-success-foreground" : ""}
                    >
                      {session.status === "active" ? "active" : session.status === "completed" ? "terminée" : session.status}
                    </Badge>
                    {session.status === "completed" && (
                      <span className="text-sm font-mono">{session.total_amount.toFixed(2)} DT</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
