"use client";

import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Label } from "@/components/ui/label";

interface DateRangePickerProps {
  value: { start: Date; end: Date } | null;
  onChange: (range: { start: Date; end: Date } | null) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange, className }) => {
  const handleStartDateChange = (date: Date | null) => {
    if (date && value) {
      onChange({ start: date, end: value.end });
    } else if (date) {
      onChange({ start: date, end: date });
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date && value) {
      onChange({ start: value.start, end: date });
    } else if (date) {
      onChange({ start: date, end: date });
    }
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      <div className="flex flex-col gap-1">
        <Label className=" font-semibold" htmlFor="startDate">
          Start Date
        </Label>
        <DatePicker
          selected={value?.start}
          onChange={handleStartDateChange}
          selectsStart
          id="startDate"
          startDate={value?.start}
          endDate={value?.end}
          placeholderText="Start Date"
          className="border p-2 rounded max-w-32"
          name="startDate"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className=" font-semibold" htmlFor="endDate">
          End Date
        </Label>
        <DatePicker
          selected={value?.end}
          id="endDate"
          onChange={handleEndDateChange}
          selectsEnd
          name="endDate"
          startDate={value?.start}
          endDate={value?.end}
          minDate={value?.start}
          placeholderText="End Date"
          className="border p-2 rounded max-w-32"
        />
      </div>
    </div>
  );
};

export default DateRangePicker;
