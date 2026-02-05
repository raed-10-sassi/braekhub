import { useState } from "react";
import { Pencil, Trash2, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProductWithCategory } from "@/hooks/useProducts";
import { EditProductDialog } from "./EditProductDialog";
import { ProductCategory } from "@/hooks/useProducts";

interface ProductTableProps {
  products: ProductWithCategory[];
  categories: ProductCategory[];
  onUpdate: (data: { id: string; name?: string; price?: number; stock_quantity?: number; category_id?: string }) => void;
  onDelete: (id: string) => void;
}

export function ProductTable({ products, categories, onUpdate, onDelete }: ProductTableProps) {
  const [editProduct, setEditProduct] = useState<ProductWithCategory | null>(null);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No products yet
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.product_categories?.name}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">${product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                      {product.stock_quantity === 0 ? (
                        <Badge variant="destructive">Out of stock</Badge>
                      ) : (
                        <span className={product.stock_quantity <= 5 ? "text-warning font-bold" : ""}>
                          {product.stock_quantity}
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditProduct(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{product.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(product.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editProduct && (
        <EditProductDialog
          open={!!editProduct}
          onOpenChange={(open) => !open && setEditProduct(null)}
          product={editProduct}
          categories={categories}
          onSave={(data) => {
            onUpdate({ id: editProduct.id, ...data });
            setEditProduct(null);
          }}
        />
      )}
    </>
  );
}
