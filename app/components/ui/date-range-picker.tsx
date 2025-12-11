"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import type { DateRange as DateRangeType } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangePickerProps {
  dateRange: DateRangeType | undefined;
  onDateRangeChange: (range: DateRangeType | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [preset, setPreset] = React.useState<string>("7days");

  const presets = React.useMemo(() => ({
    "7days": {
      label: "Últimos 7 días",
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return { from: start, to: end };
      },
    },
    "30days": {
      label: "Últimos 30 días",
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return { from: start, to: end };
      },
    },
    "thismonth": {
      label: "Este mes",
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { from: start, to: end };
      },
    },
    "custom": {
      label: "Rango personalizado",
      getRange: () => dateRange,
    },
  }), [dateRange]);

  // Detectar si el dateRange corresponde a un preset (solo cuando cambia desde fuera)
  React.useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    // Comparar con presets para actualizar el selector
    const currentRangeStr = `${dateRange.from.getTime()}-${dateRange.to.getTime()}`;
    
    for (const [key, presetConfig] of Object.entries(presets)) {
      if (key === "custom") continue;
      const presetRange = presetConfig.getRange();
      if (presetRange?.from && presetRange?.to) {
        const presetRangeStr = `${presetRange.from.getTime()}-${presetRange.to.getTime()}`;
        if (currentRangeStr === presetRangeStr) {
          if (preset !== key) {
            setPreset(key);
          }
          return;
        }
      }
    }
    
    // Si no coincide con ningún preset, debe ser custom
    if (preset !== "custom") {
      setPreset("custom");
    }
  }, [dateRange, preset, presets]);

  const handlePresetChange = (value: string) => {
    setPreset(value);
    if (value !== "custom") {
      const range = presets[value as keyof typeof presets].getRange();
      onDateRangeChange(range);
    }
  };

  return (
    <div className={cn("flex gap-2 items-center", className)}>
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleccionar período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7days">{presets["7days"].label}</SelectItem>
          <SelectItem value="30days">{presets["30days"].label}</SelectItem>
          <SelectItem value="thismonth">{presets["thismonth"].label}</SelectItem>
          <SelectItem value="custom">{presets["custom"].label}</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                  {format(dateRange.to, "LLL dd, y", { locale: es })}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y", { locale: es })
              )
            ) : (
              <span>Seleccionar fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={(range) => {
              onDateRangeChange(range);
              if (range?.from && range?.to) {
                setPreset("custom");
              }
            }}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

