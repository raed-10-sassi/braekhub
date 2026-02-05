import { useState } from "react";
import { Plus, X, Users } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useCustomers } from "@/hooks/useCustomers";

interface StartSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  tableId: string;
  hourlyRate: number;
  onStart: (playerNames: string[], playerCount: number, effectiveRate: number) => void;
  isPending?: boolean;
}

export function StartSessionDialog({
  open,
  onOpenChange,
  tableName,
  tableId,
  hourlyRate,
  onStart,
  isPending,
}: StartSessionDialogProps) {
  const { customers } = useCustomers();
  const [playerCount, setPlayerCount] = useState<1 | 2 | 4>(2);
  const [players, setPlayers] = useState<string[]>(["", ""]);
  const [guestInputs, setGuestInputs] = useState<string[]>(["", "", "", ""]);
  const [isGuest, setIsGuest] = useState<boolean[]>([false, false, false, false]);
  const isTraining = playerCount === 1;
  const effectiveRate = isTraining ? hourlyRate / 2 : hourlyRate;

  const handlePlayerCountChange = (count: string) => {
    const newCount = parseInt(count) as 1 | 2 | 4;
    setPlayerCount(newCount);
    if (newCount === 1) {
      setPlayers(players.slice(0, 1));
    } else if (newCount === 2) {
      setPlayers([...players, ""].slice(0, 2));
    } else {
      setPlayers([...players, "", "", ""].slice(0, 4));
    }
  };

  const handlePlayerSelect = (index: number, value: string) => {
    const newPlayers = [...players];
    const newIsGuest = [...isGuest];
    
    if (value === "guest") {
      newIsGuest[index] = true;
      newPlayers[index] = guestInputs[index] || "";
    } else {
      newIsGuest[index] = false;
      newPlayers[index] = value;
      // Clear guest input when selecting a customer
      const newGuestInputs = [...guestInputs];
      newGuestInputs[index] = "";
      setGuestInputs(newGuestInputs);
    }
    setIsGuest(newIsGuest);
    setPlayers(newPlayers);
  };

  const handleGuestInput = (index: number, value: string) => {
    const newGuestInputs = [...guestInputs];
    newGuestInputs[index] = value;
    setGuestInputs(newGuestInputs);
    
    // Update player name with guest input
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const handleSubmit = () => {
    const validPlayers = players.slice(0, playerCount).filter(p => p.trim() !== "");
    if (validPlayers.length === 0) return;
    onStart(validPlayers, playerCount, effectiveRate);
    // Reset state
    setPlayers(["", ""]);
    setGuestInputs(["", "", "", ""]);
    setIsGuest([false, false, false, false]);
    setPlayerCount(2);
  };


  const getSelectValue = (index: number) => {
    if (isGuest[index]) return "guest";
    const playerName = players[index];
    if (!playerName) return "";
    return playerName;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Start Session - {tableName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Rate:</span>
            <div className="text-right">
              {isTraining ? (
                <>
                  <span className="font-bold">${(hourlyRate / 2).toFixed(2)}/hr</span>
                  <span className="text-xs text-muted-foreground ml-2 line-through">${hourlyRate.toFixed(2)}</span>
                </>
              ) : (
                <span className="font-bold">${hourlyRate.toFixed(2)}/hr</span>
              )}
            </div>
          </div>
          {isTraining && (
            <div className="p-2 bg-accent/50 border border-border rounded-lg text-center">
              <span className="text-sm font-medium">🎯 Training Mode — 50% Rate</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Number of Players</Label>
            <Select
              value={playerCount.toString()}
              onValueChange={handlePlayerCountChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Player (Training)</SelectItem>
                <SelectItem value="2">2 Players (1v1)</SelectItem>
                <SelectItem value="4">4 Players (2v2)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Players</Label>
            {Array.from({ length: playerCount }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <Select
                    value={getSelectValue(index)}
                    onValueChange={(value) => handlePlayerSelect(index, value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select player..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Guest Player
                        </span>
                      </SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.name}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(players[index] || isGuest[index]) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const newPlayers = [...players];
                        newPlayers[index] = "";
                        setPlayers(newPlayers);
                        const newGuestInputs = [...guestInputs];
                        newGuestInputs[index] = "";
                        setGuestInputs(newGuestInputs);
                        const newIsGuest = [...isGuest];
                        newIsGuest[index] = false;
                        setIsGuest(newIsGuest);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {isGuest[index] && (
                  <Input
                    placeholder="Enter guest name..."
                    value={guestInputs[index]}
                    onChange={(e) => handleGuestInput(index, e.target.value)}
                    className="ml-10"
                  />
                )}
              </div>
            ))}
          </div>

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
              onClick={handleSubmit}
              disabled={isPending || players.slice(0, playerCount).filter(p => p.trim()).length === 0}
            >
              Start Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
