"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ViewMode } from "@/lib/types";
import DateRangePicker from "@/components/ui/date-range-picker";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfToday, startOfToday } from "date-fns";

interface DateControlsProps {
  selectedDateRange: {
    start: Date;
    end: Date;
  };
  onDateChange: (dateRange: { start: Date; end: Date }) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function DateControls({ selectedDateRange, onDateChange, viewMode, onViewModeChange }: DateControlsProps) {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: selectedDateRange.start,
    end: selectedDateRange.end,
  });

  function handleViewModeChange(mode: ViewMode) {
    onViewModeChange(mode);

    const today = new Date();

    if (mode === "week") {
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = endOfWeek(today, { weekStartsOn: 1 });
      onDateChange({ start, end });
    } else if (mode === "month") {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      onDateChange({ start, end });
    } else if (mode === "day") {
      // For 'day' mode, set both start and end to today
      const start = startOfToday();
      const end = endOfToday();
      onDateChange({ start, end });
    } else {
      // View mode is 'day' or reset — leave date range as-is
      onDateChange({
        start: selectedDateRange.start,
        end: selectedDateRange.start,
      });
    }
  }

  const handleRangeChange = (range: { start: Date; end: Date } | null) => {
    if (range) {
      setDateRange(range);
      onDateChange(range); // You can also lift full range if needed
    } else {
      setDateRange({ start: startOfToday(), end: endOfToday() });
      onDateChange({ start: startOfToday(), end: endOfToday() });
    }
  };

  return (
    <div className="flex items-end gap-4">
      {/* View toggle buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === "day" ? "default" : "outline"}
          size="sm"
          onClick={() => handleViewModeChange("day")}
        >
          Today
        </Button>
        <Button
          variant={viewMode === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => handleViewModeChange("week")}
        >
          Current Week
        </Button>
        <Button
          variant={viewMode === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => handleViewModeChange("month")}
        >
          Current Month
        </Button>
      </div>

      {/* Date Range Picker */}
      <div className="relative">
        <DateRangePicker value={dateRange} onChange={handleRangeChange} />
      </div>
    </div>
  );
}
