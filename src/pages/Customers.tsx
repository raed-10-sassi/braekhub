import { useState } from "react";
import { Plus, Phone, Mail, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCustomers } from "@/hooks/useCustomers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default function Customers() {
  const { customers, isLoading, createCustomer } = useCustomers();
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);

  const handleCreateCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createCustomer.mutate({
      name: formData.get("name") as string,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      notes: (formData.get("notes") as string) || null,
    });
    setNewCustomerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Gérer votre base de données clients</p>
        </div>
        <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input id="name" name="name" placeholder="Jean Dupont" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+216 XX XXX XXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="jean@exemple.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Notes supplémentaires..." />
              </div>
              <Button type="submit" className="w-full" disabled={createCustomer.isPending}>
                Créer le client
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tous les clients</CardTitle>
          <CardDescription>{customers.length} clients au total</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucun client. Ajoutez votre premier client !</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Solde crédit</TableHead>
                  <TableHead>Inscrit le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                      {customer.notes && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {customer.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        )}
                        {!customer.phone && !customer.email && (
                          <span className="text-muted-foreground text-sm">Pas de contact</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.credit_balance > 0 ? (
                        <Badge variant="destructive" className="font-mono">
                          {customer.credit_balance.toFixed(2)} DT
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="font-mono">
                          0.00 DT
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(customer.created_at), "d MMM yyyy")}
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
