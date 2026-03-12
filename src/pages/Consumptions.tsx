import { useState, useMemo } from "react";
import { Plus, ShoppingCart, Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { CategoryManager } from "@/components/consumptions/CategoryManager";
import { ProductTable } from "@/components/consumptions/ProductTable";
import { AddProductDialog } from "@/components/consumptions/AddProductDialog";
import { NewOrderDialog } from "@/components/consumptions/NewOrderDialog";
import { OrderFilters, FilterPreset, getFilterDateRange } from "@/components/consumptions/OrderFilters";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export default function Consumptions() {
  const {
    categories,
    products,
    isLoading,
    createCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts();
  const { orders, isLoading: ordersLoading, createOrder, deleteOrder } = useOrders();
  const { customers } = useCustomers();
  const { isAdmin } = useAuth();

  const [addProductOpen, setAddProductOpen] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [filterPreset, setFilterPreset] = useState<FilterPreset>("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const filteredOrders = useMemo(() => {
    const { from, to } = getFilterDateRange(filterPreset, dateFrom, dateTo);
    if (!from && !to) return orders;
    return orders.filter((o) => {
      const d = new Date(o.created_at);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [orders, filterPreset, dateFrom, dateTo]);

  const lowStockCount = products.filter((p) => p.stock_quantity <= 5).length;
  const todayOrders = orders.filter((o) => {
    const today = new Date();
    const orderDate = new Date(o.created_at);
    return (
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    );
  });
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consommations</h1>
          <p className="text-muted-foreground">Gérer les produits, le stock & les ventes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddProductOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un produit
          </Button>
          <Button onClick={() => setNewOrderOpen(true)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Nouvelle commande
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total produits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock faible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{lowStockCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ventes du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayRevenue.toFixed(2)} DT</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Produits
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Historique des commandes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6 mt-4">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Catégories</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryManager
                categories={categories}
                onAdd={(name) => createCategory.mutate(name)}
                onDelete={(id) => deleteCategory.mutate(id)}
                isPending={createCategory.isPending}
              />
            </CardContent>
          </Card>

          {/* Products Table */}
          <ProductTable
            products={products}
            categories={categories}
            onUpdate={(data) => updateProduct.mutate(data)}
            onDelete={(id) => deleteProduct.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="orders" className="mt-4 space-y-4">
          <OrderFilters
            preset={filterPreset}
            onPresetChange={setFilterPreset}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {isAdmin && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      Aucune commande trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-sm">
                        {format(new Date(order.created_at), "d MMM, HH:mm")}
                      </TableCell>
                      <TableCell>{order.customer_name || "Invité"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {order.order_items?.map((item) => (
                            <Badge key={item.id} variant="secondary" className="text-xs">
                              {item.products?.name} ×{item.quantity}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{order.payment_method}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {order.total_amount.toFixed(2)} DT
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(order.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredOrders.length > 0 && (
            <div className="flex items-center justify-between rounded-md border bg-muted/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {filteredOrders.length} commande{filteredOrders.length !== 1 ? "s" : ""}
              </span>
              <span className="text-lg font-bold font-mono">
                Total : {filteredOrders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)} DT
              </span>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddProductDialog
        open={addProductOpen}
        onOpenChange={setAddProductOpen}
        categories={categories}
        onAdd={(product) => createProduct.mutate(product)}
        isPending={createProduct.isPending}
      />

      <NewOrderDialog
        open={newOrderOpen}
        onOpenChange={setNewOrderOpen}
        products={products}
        customers={customers}
        onConfirm={(data) => createOrder.mutate(data)}
        isPending={createOrder.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Voulez-vous vraiment supprimer cette commande ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteOrder.mutate(deleteTarget);
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
