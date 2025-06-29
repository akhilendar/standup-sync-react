
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface AdminScheduleLearningHourProps {
  onAfterSchedule: () => void;
}

export default function AdminScheduleLearningHour({ onAfterSchedule }: AdminScheduleLearningHourProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [loading, setLoading] = useState(false);

  const handleSchedule = async () => {
    if (!selectedDate) {
      toast({
        title: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    
    try {
      const { error } = await supabase.from("learning_hours").insert([
        {
          scheduled_at: scheduledDateTime.toISOString(),
        },
      ]);

      if (error) {
        toast({
          title: "Error scheduling learning hour",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Learning hour scheduled successfully!",
          description: `Scheduled for ${scheduledDateTime.toLocaleString()}`,
        });
        onAfterSchedule();
      }
    } catch (error) {
      toast({
        title: "Error scheduling learning hour",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-style" style={{ maxWidth: 500, margin: "40px auto 0" }}>
      <h2 style={{ marginBottom: 20 }}>Schedule Learning Hour</h2>
      
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
          Select Date:
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            fontSize: "16px",
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
          Select Time:
        </label>
        <input
          type="time"
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            fontSize: "16px",
          }}
        />
      </div>

      <button
        className="btn-style"
        onClick={handleSchedule}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px",
          fontSize: "16px",
          fontWeight: 600,
        }}
      >
        {loading ? "Scheduling..." : "Schedule Learning Hour"}
      </button>
    </div>
  );
}
