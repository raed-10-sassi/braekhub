import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: { id: string; name: string; hourly_rate: number };
  onSave: (id: string, updates: { name: string; hourly_rate: number }) => void;
  onDelete: (id: string) => void;
  isPending?: boolean;
  isAdmin?: boolean;
}

export function EditTableDialog({ open, onOpenChange, table, onSave, onDelete, isPending, isAdmin }: EditTableDialogProps) {
  const [name, setName] = useState(table.name);
  const [hourlyRate, setHourlyRate] = useState(table.hourly_rate.toString());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(table.id, { name, hourly_rate: parseFloat(hourlyRate) });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(table.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); setConfirmDelete(false); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Table</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Table Name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-rate">Hourly Rate ($)</Label>
            <Input id="edit-rate" type="number" step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} required />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isPending}>
              Save Changes
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {confirmDelete ? "Confirm Delete" : "Delete"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
