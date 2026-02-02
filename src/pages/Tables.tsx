import { useState } from "react";
import { Plus, Settings2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTables, TableStatus } from "@/hooks/useTables";
import { cn } from "@/lib/utils";

const statusConfig: Record<TableStatus, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-success text-success-foreground" },
  occupied: { label: "Occupied", className: "bg-destructive text-destructive-foreground" },
  maintenance: { label: "Maintenance", className: "bg-warning text-warning-foreground" },
};

export default function Tables() {
  const { tables, isLoading, updateTableStatus, createTable } = useTables();
  const [newTableOpen, setNewTableOpen] = useState(false);

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
            <Card key={table.id} className="relative overflow-hidden">
              <div
                className={cn(
                  "absolute top-0 left-0 right-0 h-1",
                  table.status === "available" && "bg-success",
                  table.status === "occupied" && "bg-destructive",
                  table.status === "maintenance" && "bg-warning"
                )}
              />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{table.name}</CardTitle>
                  <Badge className={statusConfig[table.status].className}>
                    {statusConfig[table.status].label}
                  </Badge>
                </div>
                <CardDescription>Table #{table.table_number}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">${table.hourly_rate.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">per hour</p>
                  </div>
                  <Select
                    value={table.status}
                    onValueChange={(value) => handleStatusChange(table.id, value as TableStatus)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <Settings2 className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
