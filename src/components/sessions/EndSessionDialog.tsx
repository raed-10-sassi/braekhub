import { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomers, Customer } from "@/hooks/useCustomers";

interface EndSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  playerNames: string[];
  onConfirm: (paymentAmount: number, payerName: string, paymentMethod: string, customerId?: string) => void;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile", label: "Mobile Payment" },
  { value: "credits", label: "Credits" },
];

export function EndSessionDialog({
  open,
  onOpenChange,
  totalAmount,
  playerNames,
  onConfirm,
}: EndSessionDialogProps) {
  const { customers } = useCustomers();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedPayer, setSelectedPayer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  useEffect(() => {
    if (open) {
      setPaymentAmount(totalAmount.toFixed(2));
      setSelectedPayer(playerNames[0] || "");
      setPaymentMethod("cash");
    }
  }, [open, totalAmount, playerNames]);

  const isCredits = paymentMethod === "credits";

  useEffect(() => {
    if (isCredits) {
      setPaymentAmount("0");
    }
  }, [isCredits]);

  const handleConfirm = () => {
    const paid = isCredits ? 0 : (parseFloat(paymentAmount) || 0);
    // Check if the selected payer is an existing customer
    const customer = customers.find(c => c.name === selectedPayer);
    onConfirm(paid, selectedPayer, paymentMethod, customer?.id);
  };

  const remaining = isCredits ? totalAmount : totalAmount - (parseFloat(paymentAmount) || 0);

  // Find if any player is a registered customer
  const getPayerCustomer = (name: string): Customer | undefined => {
    return customers.find(c => c.name === name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            End Session & Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="text-xl font-bold">${totalAmount.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <Label>Who is paying?</Label>
            <Select value={selectedPayer} onValueChange={setSelectedPayer}>
              <SelectTrigger>
                <SelectValue placeholder="Select payer..." />
              </SelectTrigger>
              <SelectContent>
                {playerNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                    {getPayerCustomer(name) && (
                      <span className="text-muted-foreground ml-2">(Customer)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isCredits && (
            <div className="space-y-2">
              <Label htmlFor="payment">Payment Amount (0 - ${totalAmount.toFixed(2)})</Label>
              <Input
                id="payment"
                type="number"
                step="0.01"
                min="0"
                max={totalAmount}
                value={paymentAmount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  const clamped = Math.min(Math.max(0, value), totalAmount);
                  setPaymentAmount(clamped.toString());
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter the amount the customer is paying now
              </p>
            </div>
          )}

          {isCredits && (
            <div className="p-3 bg-accent/50 border border-border rounded-lg">
              <p className="text-sm font-medium text-foreground">
                Full amount: ${totalAmount.toFixed(2)} will be added to credits
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getPayerCustomer(selectedPayer) 
                  ? `This will be added to ${selectedPayer}'s credit balance.`
                  : `This will appear in the Credits page under ${selectedPayer}'s name.`
                }
              </p>
            </div>
          )}

          {!isCredits && remaining > 0.01 && (
            <div className="p-3 bg-accent/50 border border-border rounded-lg">
              <p className="text-sm font-medium text-foreground">
                Remaining: ${remaining.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getPayerCustomer(selectedPayer) 
                  ? `This will be added to ${selectedPayer}'s credit balance for future payment.`
                  : "⚠️ Guest players cannot store credit. Only registered customers can have credit balance."
                }
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={!selectedPayer}
            >
              Confirm & End
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
