import { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { ProductCategory } from "@/hooks/useProducts";

interface CategoryManagerProps {
  categories: ProductCategory[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}

export function CategoryManager({ categories, onAdd, onDelete, isPending }: CategoryManagerProps) {
  const [newName, setNewName] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName("");
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          placeholder="Nom de la nouvelle catégorie..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={isPending || !newName.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Badge key={cat.id} variant="secondary" className="flex items-center gap-1 py-1.5 px-3">
            <Tag className="h-3 w-3" />
            {cat.name}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="ml-1 hover:text-destructive transition-colors">
                  <Trash2 className="h-3 w-3" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer la catégorie "{cat.name}" ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cela supprimera aussi tous les produits de cette catégorie.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(cat.id)}>Supprimer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Badge>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune catégorie. Ajoutez-en une ci-dessus.</p>
        )}
      </div>
    </div>
  );
}
