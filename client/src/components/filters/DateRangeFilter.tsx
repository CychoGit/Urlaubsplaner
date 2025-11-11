import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subMonths, subDays } from "date-fns";
import { de } from "date-fns/locale";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presetRanges = [
  {
    label: "Letzten 30 Tage",
    value: "last30",
    getRange: () => ({
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    })
  },
  {
    label: "Letzten 90 Tage", 
    value: "last90",
    getRange: () => ({
      startDate: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    })
  },
  {
    label: "Dieses Quartal",
    value: "thisQuarter",
    getRange: () => ({
      startDate: format(startOfQuarter(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfQuarter(new Date()), 'yyyy-MM-dd')
    })
  },
  {
    label: "Dieses Jahr",
    value: "thisYear",
    getRange: () => ({
      startDate: format(startOfYear(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfYear(new Date()), 'yyyy-MM-dd')
    })
  },
  {
    label: "Letztes Jahr",
    value: "lastYear",
    getRange: () => {
      const lastYear = new Date().getFullYear() - 1;
      return {
        startDate: `${lastYear}-01-01`,
        endDate: `${lastYear}-12-31`
      };
    }
  },
  {
    label: "Benutzerdefiniert",
    value: "custom",
    getRange: () => ({
      startDate: format(startOfYear(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfYear(new Date()), 'yyyy-MM-dd')
    })
  }
];

export default function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState("thisYear");
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(new Date(value.startDate));
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(new Date(value.endDate));

  const handlePresetChange = (presetValue: string) => {
    setSelectedPreset(presetValue);
    
    if (presetValue === "custom") {
      setIsCustomOpen(true);
      return;
    }
    
    const preset = presetRanges.find(p => p.value === presetValue);
    if (preset) {
      const range = preset.getRange();
      onChange(range);
    }
  };

  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      onChange({
        startDate: format(customStartDate, 'yyyy-MM-dd'),
        endDate: format(customEndDate, 'yyyy-MM-dd')
      });
      setIsCustomOpen(false);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: de });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Preset Selection */}
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-48" data-testid="select-date-preset">
          <SelectValue placeholder="Zeitraum wählen" />
        </SelectTrigger>
        <SelectContent>
          {presetRanges.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Current Range Display */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarIcon className="h-4 w-4" />
        <span>
          {formatDisplayDate(value.startDate)} - {formatDisplayDate(value.endDate)}
        </span>
      </div>

      {/* Custom Date Range Popover */}
      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={selectedPreset === "custom" ? "" : "hidden"}
            data-testid="button-custom-date"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="text-sm font-medium">Benutzerdefinierter Zeitraum</div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Startdatum</label>
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={setCustomStartDate}
                  locale={de}
                  className="rounded-md border"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Enddatum</label>
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={setCustomEndDate}
                  locale={de}
                  className="rounded-md border"
                  disabled={(date) => customStartDate ? date < customStartDate : false}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsCustomOpen(false)}
                data-testid="button-cancel-custom"
              >
                Abbrechen
              </Button>
              <Button 
                size="sm" 
                onClick={handleCustomRangeApply}
                disabled={!customStartDate || !customEndDate}
                data-testid="button-apply-custom"
              >
                Anwenden
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}