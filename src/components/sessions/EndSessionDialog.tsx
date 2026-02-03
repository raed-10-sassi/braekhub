import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface EndSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  playerNames: string[];
  onConfirm: (paymentAmount: number) => void;
}

export function EndSessionDialog({
  open,
  onOpenChange,
  totalAmount,
  playerNames,
  onConfirm,
}: EndSessionDialogProps) {
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    if (open) {
      setPaymentAmount(totalAmount.toFixed(2));
    }
  }, [open, totalAmount]);

  const handleConfirm = () => {
    const paid = parseFloat(paymentAmount) || 0;
    onConfirm(paid);
  };

  const remaining = totalAmount - (parseFloat(paymentAmount) || 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End Session</AlertDialogTitle>
          <AlertDialogDescription>
            Players: {playerNames.length > 0 ? playerNames.join(", ") : "No players"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="text-xl font-bold">${totalAmount.toFixed(2)}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment">Payment Amount</Label>
            <Input
              id="payment"
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
          </div>
          {remaining > 0.01 && (
            <p className="text-sm text-warning">
              Remaining ${remaining.toFixed(2)} will be added to customer credit.
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Confirm & End
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
