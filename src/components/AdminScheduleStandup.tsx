
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Standup = {
  id: string;
  scheduled_at: string; // ISO string with time
  created_at: string;
};
export default function AdminScheduleStandup() {
  // For time, use input type="time"
  const [time, setTime] = useState(""); // e.g., '09:30'
  const [standups, setStandups] = useState<Standup[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useUser();

  const fetchStandups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("standups")
      .select("*")
      .order("scheduled_at", { ascending: true });
    if (data) setStandups(data as Standup[]);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchStandups();
  }, []);

  // Helper: get today's date formatted as yyyy-mm-dd
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  };

  // Schedule standup for today at selected time
  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!time) {
      toast({ title: "Please select a time", variant: "destructive" });
      return;
    }
    setLoading(true);
    // Compose scheduled_at as yyyy-mm-ddTHH:mm:00.000+00:00 (UTC)
    let [hours, minutes] = time.split(":").map(Number);
    let now = new Date();
    now.setHours(hours, minutes, 0, 0);
    const scheduled_at = now.toISOString(); // keep as ISO with time
    const { error } = await supabase.from("standups").insert([
      {
        scheduled_at,      // store ISO datetime
        created_by: profile.id
      }
    ]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Standup Scheduled" });
      setTime("");
      fetchStandups();
    }
    setLoading(false);
  };

  return (
    <Card className="w-full mt-6 md:max-w-lg">
      <CardHeader>
        <CardTitle>Schedule Standup</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSchedule} className="flex gap-2 items-center mb-4">
          <div>
            <span>Today at:</span>
            <Input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              required
              className="ml-2 w-28"
              min="06:00"
              max="23:00"
            />
          </div>
          <Button type="submit" disabled={loading}>Add</Button>
        </form>
        <h4 className="font-semibold mb-2">All Scheduled Standups:</h4>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <ul className="space-y-2">
            {standups.map(su => (
              <li key={su.id} className="flex justify-between border-b py-2">
                <span>
                  {(() => {
                    const d = new Date(su.scheduled_at);
                    return d.toLocaleString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    });
                  })()}
                </span>
                <span className="text-xs text-muted-foreground">{new Date(su.created_at).toLocaleDateString()}</span>
              </li>
            ))}
            {standups.length === 0 && <li className="text-muted-foreground">No standups scheduled.</li>}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
