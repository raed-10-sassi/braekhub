import { useState, useMemo } from "react";
import { Plus, ShoppingCart, Package } from "lucide-react";
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
  const { orders, isLoading: ordersLoading, createOrder } = useOrders();
  const { customers } = useCustomers();

  const [addProductOpen, setAddProductOpen] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [filterPreset, setFilterPreset] = useState<FilterPreset>("all");
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
          <h1 className="text-3xl font-bold tracking-tight">Consumptions</h1>
          <p className="text-muted-foreground">Manage products, stock & sales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddProductOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <Button onClick={() => setNewOrderOpen(true)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{lowStockCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${todayRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Products
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Order History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6 mt-4">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories</CardTitle>
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-sm">
                        {format(new Date(order.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell>{order.customer_name || "Guest"}</TableCell>
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
                        ${order.total_amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
    </div>
  );
}
