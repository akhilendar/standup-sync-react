
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Standup = {
  id: string;
  scheduled_at: string;
  created_at: string;
};
export default function AdminScheduleStandup() {
  const [date, setDate] = useState("");
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

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    const { error } = await supabase.from("standups").insert([
      {
        scheduled_at: date,
        created_by: profile.id
      }
    ]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Standup Scheduled" });
      setDate("");
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
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          <Button type="submit" disabled={loading}>Add</Button>
        </form>
        <h4 className="font-semibold mb-2">All Scheduled Standups:</h4>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <ul className="space-y-2">
            {standups.map(su => (
              <li key={su.id} className="flex justify-between border-b py-2">
                <span>{su.scheduled_at}</span>
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
