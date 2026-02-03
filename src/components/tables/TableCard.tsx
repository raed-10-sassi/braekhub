import { Play, Square, Clock, Users, Settings2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TableStatus } from "@/hooks/useTables";
import { SessionWithRelations } from "@/hooks/useSessions";
import { differenceInMinutes } from "date-fns";
import { useState, useEffect } from "react";

const statusConfig: Record<TableStatus, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-success text-success-foreground" },
  occupied: { label: "Occupied", className: "bg-destructive text-destructive-foreground" },
  maintenance: { label: "Maintenance", className: "bg-warning text-warning-foreground" },
};

interface TableCardProps {
  table: {
    id: string;
    name: string;
    table_number: number;
    hourly_rate: number;
    status: TableStatus;
  };
  activeSession?: SessionWithRelations & { player_names?: string[] };
  onStatusChange: (status: TableStatus) => void;
  onStartSession: () => void;
  onEndSession: () => void;
}

function ActiveTimer({ startTime }: { startTime: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = differenceInMinutes(new Date(), new Date(startTime));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return (
    <span className="font-mono text-lg font-bold text-destructive">
      {hours.toString().padStart(2, "0")}:{mins.toString().padStart(2, "0")}
    </span>
  );
}

export function TableCard({
  table,
  activeSession,
  onStatusChange,
  onStartSession,
  onEndSession,
}: TableCardProps) {
  const isOccupied = table.status === "occupied" && activeSession;
  const isAvailable = table.status === "available";
  const isMaintenance = table.status === "maintenance";

  return (
    <Card className="relative overflow-hidden">
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          table.status === "available" && "bg-success",
          table.status === "occupied" && "bg-destructive",
          table.status === "maintenance" && "bg-warning"
        )}
      />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{table.name}</CardTitle>
          <Badge className={statusConfig[table.status].className}>
            {statusConfig[table.status].label}
          </Badge>
        </div>
        <CardDescription>Table #{table.table_number}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price and status select */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">${table.hourly_rate.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">per hour</p>
          </div>
          {!isOccupied && (
            <Select
              value={table.status}
              onValueChange={(value) => onStatusChange(value as TableStatus)}
            >
              <SelectTrigger className="w-[140px]">
                <Settings2 className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Active session info */}
        {isOccupied && activeSession && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <ActiveTimer startTime={activeSession.start_time} />
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{activeSession.player_count}</span>
              </div>
            </div>
            {activeSession.player_names && activeSession.player_names.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {activeSession.player_names.join(", ")}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {isAvailable && (
            <Button className="flex-1" onClick={onStartSession}>
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}
          {isOccupied && (
            <Button variant="destructive" className="flex-1" onClick={onEndSession}>
              <Square className="h-4 w-4 mr-2" />
              End Session
            </Button>
          )}
          {isMaintenance && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onStatusChange("available")}
            >
              Set Available
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
