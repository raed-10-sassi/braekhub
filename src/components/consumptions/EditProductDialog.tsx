import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductWithCategory, ProductCategory } from "@/hooks/useProducts";

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductWithCategory;
  categories: ProductCategory[];
  onSave: (data: { name?: string; price?: number; stock_quantity?: number; category_id?: string }) => void;
}

export function EditProductDialog({ open, onOpenChange, product, categories, onSave }: EditProductDialogProps) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [stock, setStock] = useState(product.stock_quantity.toString());
  const [categoryId, setCategoryId] = useState(product.category_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      price: parseFloat(price),
      stock_quantity: parseInt(stock),
      category_id: categoryId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le produit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nom</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-category">Catégorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Prix (DT)</Label>
              <Input id="edit-price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Stock</Label>
              <Input id="edit-stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} required />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" className="flex-1">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
