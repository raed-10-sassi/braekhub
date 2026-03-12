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
import { Textarea } from "@/components/ui/textarea";
import { useCustomers, Customer } from "@/hooks/useCustomers";

interface EndSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  playerNames: string[];
  onConfirm: (paymentAmount: number, payerName: string, paymentMethod: string, customerId?: string, notes?: string) => void;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Espèces" },
  { value: "card", label: "Carte" },
  { value: "mobile", label: "Paiement mobile" },
  { value: "credits", label: "Crédits" },
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
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setPaymentAmount(totalAmount.toFixed(2));
      setSelectedPayer(playerNames[0] || "");
      setPaymentMethod("cash");
      setNotes("");
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
    const customer = customers.find(c => c.name === selectedPayer);
    onConfirm(paid, selectedPayer, paymentMethod, customer?.id, notes || undefined);
  };

  const remaining = isCredits ? totalAmount : totalAmount - (parseFloat(paymentAmount) || 0);

  const getPayerCustomer = (name: string): Customer | undefined => {
    return customers.find(c => c.name === name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Terminer la session & Paiement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-muted-foreground">Montant total :</span>
            <span className="text-xl font-bold">{totalAmount.toFixed(2)} DT</span>
          </div>

          <div className="space-y-2">
            <Label>Qui paie ?</Label>
            <Select value={selectedPayer} onValueChange={setSelectedPayer}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le payeur..." />
              </SelectTrigger>
              <SelectContent>
                {playerNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                    {getPayerCustomer(name) && (
                      <span className="text-muted-foreground ml-2">(Client)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mode de paiement</Label>
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
              <Label htmlFor="payment">Montant payé (0 - {totalAmount.toFixed(2)} DT)</Label>
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
                Entrez le montant que le client paie maintenant
              </p>
            </div>
          )}

          {isCredits && (
            <div className="p-3 bg-accent/50 border border-border rounded-lg">
              <p className="text-sm font-medium text-foreground">
                Montant total : {totalAmount.toFixed(2)} DT sera ajouté aux crédits
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getPayerCustomer(selectedPayer) 
                  ? `Ceci sera ajouté au solde crédit de ${selectedPayer}.`
                  : `Ceci apparaîtra dans la page Crédits sous le nom de ${selectedPayer}.`
                }
              </p>
            </div>
          )}

          {isCredits && (
            <div className="space-y-2">
              <Label htmlFor="credit-notes">Commentaire (optionnel)</Label>
              <Textarea
                id="credit-notes"
                placeholder="Ajouter une note sur ce crédit..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {!isCredits && remaining > 0.01 && (
            <div className="p-3 bg-accent/50 border border-border rounded-lg">
              <p className="text-sm font-medium text-foreground">
                Reste : {remaining.toFixed(2)} DT
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getPayerCustomer(selectedPayer) 
                  ? `Ceci sera ajouté au solde crédit de ${selectedPayer} pour un paiement futur.`
                  : "⚠️ Les joueurs invités ne peuvent pas stocker de crédit. Seuls les clients enregistrés peuvent avoir un solde crédit."
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
              Annuler
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={!selectedPayer}
            >
              Confirmer & Terminer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
