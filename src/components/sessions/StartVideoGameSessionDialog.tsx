import { useState } from "react";
import { Gamepad2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomers } from "@/hooks/useCustomers";

interface StartVideoGameSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameName: string;
  hourlyRate: number;
  onStart: (playerNames: string[], playerCount: number, effectiveRate: number) => void;
  isPending?: boolean;
}

export function StartVideoGameSessionDialog({
  open,
  onOpenChange,
  gameName,
  hourlyRate,
  onStart,
  isPending,
}: StartVideoGameSessionDialogProps) {
  const { customers } = useCustomers();
  const [playerName, setPlayerName] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [guestInput, setGuestInput] = useState("");

  const handlePlayerSelect = (value: string) => {
    if (value === "guest") {
      setIsGuest(true);
      setPlayerName(guestInput);
    } else {
      setIsGuest(false);
      setPlayerName(value);
      setGuestInput("");
    }
  };

  const handleSubmit = () => {
    const name = isGuest ? guestInput : playerName;
    if (!name.trim()) return;
    onStart([name], 1, hourlyRate);
    setPlayerName("");
    setGuestInput("");
    setIsGuest(false);
  };

  const currentName = isGuest ? guestInput : playerName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Démarrer session - {gameName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Tarif :</span>
            <span className="font-bold">{hourlyRate.toFixed(2)} DT/h</span>
          </div>

          <div className="space-y-2">
            <Label>Nom du joueur</Label>
            <Select
              value={isGuest ? "guest" : playerName || ""}
              onValueChange={handlePlayerSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un joueur..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guest">
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Joueur invité
                  </span>
                </SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.name}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isGuest && (
              <Input
                placeholder="Nom de l'invité..."
                value={guestInput}
                onChange={(e) => setGuestInput(e.target.value)}
              />
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isPending || !currentName.trim()}
            >
              Démarrer la session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
