import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterPreset = "all" | "today" | "week" | "month" | "custom";

interface OrderFiltersProps {
  preset: FilterPreset;
  onPresetChange: (preset: FilterPreset) => void;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
}

export function OrderFilters({
  preset,
  onPresetChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: OrderFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={preset} onValueChange={(v) => onPresetChange(v as FilterPreset)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Filtrer par période" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tout le temps</SelectItem>
          <SelectItem value="today">Aujourd'hui</SelectItem>
          <SelectItem value="week">Cette semaine</SelectItem>
          <SelectItem value="month">Ce mois</SelectItem>
          <SelectItem value="custom">Période personnalisée</SelectItem>
        </SelectContent>
      </Select>

      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "d MMM yyyy") : "Du"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={onDateFromChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground">→</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "d MMM yyyy") : "Au"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={onDateToChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}

export function getFilterDateRange(
  preset: FilterPreset,
  dateFrom: Date | undefined,
  dateTo: Date | undefined
): { from: Date | null; to: Date | null } {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "custom":
      return {
        from: dateFrom ? startOfDay(dateFrom) : null,
        to: dateTo ? endOfDay(dateTo) : null,
      };
    default:
      return { from: null, to: null };
  }
}
