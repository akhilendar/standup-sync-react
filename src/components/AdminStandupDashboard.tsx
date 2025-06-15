
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Employee = {
  id: string;
  name: string;
  email: string;
};
type Attendance = {
  id: string;
  employee_id: string;
  status: string | null;
};

const AdminStandupDashboard: React.FC = () => {
  const [todayStandup, setTodayStandup] = React.useState<{ id: string; scheduled_at: string } | null>(null);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [attendance, setAttendance] = React.useState<Record<string, Attendance>>({});
  const [start, setStart] = React.useState(false);
  const [finalized, setFinalized] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Get today's standup
  React.useEffect(() => {
    const fetchTodayStandup = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("standups")
        .select("*")
        .eq("scheduled_at", today)
        .maybeSingle();
      if (data) setTodayStandup(data);
      else setTodayStandup(null);
    };
    fetchTodayStandup();
  }, []);

  // Fetch employees
  React.useEffect(() => {
    if (!todayStandup) return;
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from("employees").select("*");
      if (data) setEmployees(data);
    };
    fetchEmployees();
  }, [todayStandup]);

  // Fetch attendance entries if started/stopped
  React.useEffect(() => {
    if (!todayStandup || (!start && !finalized)) return;
    const fetchAttendance = async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("standup_id", todayStandup.id);
      if (data) {
        const attMap: Record<string, Attendance> = {};
        data.forEach((row: Attendance) => {
          attMap[row.employee_id] = row;
        });
        setAttendance(attMap);
      }
    };
    fetchAttendance();
  }, [todayStandup, start, finalized]);

  const handleStart = async () => {
    if (!todayStandup || employees.length === 0) return;
    setLoading(true);

    // Insert attendance rows for each employee if not already present
    const inserts = [];
    for (let emp of employees) {
      if (!attendance[emp.id]) {
        inserts.push({
          standup_id: todayStandup.id,
          employee_id: emp.id,
          status: "Absent",
        });
      }
    }
    if (inserts.length > 0) {
      const { error } = await supabase.from("attendance").insert(inserts);
      if (error) {
        toast({ title: "Failed to start standup", variant: "destructive", description: error.message });
        setLoading(false);
        return;
      }
    }
    setStart(true);
    toast({ title: "Standup started!" });
    setLoading(false);
  };

  const handleCheckbox = async (employeeId: string) => {
    if (!todayStandup || finalized) return;
    setLoading(true);
    // Toggle Present/Absent
    const prevStatus = attendance[employeeId]?.status;
    const newStatus = prevStatus === "Present" ? "Absent" : "Present";
    const row = attendance[employeeId];
    if (row) {
      const { error, data } = await supabase
        .from("attendance")
        .update({ status: newStatus })
        .eq("id", row.id)
        .select()
        .single();
      if (!error && data) {
        setAttendance((old) => ({
          ...old,
          [employeeId]: data,
        }));
      }
    }
    setLoading(false);
  };

  const handleStop = async () => {
    setFinalized(true);
    setStart(false);
    toast({ title: "Standup finalized", description: "Attendance is locked for today" });
  };

  // UI Logic
  if (!todayStandup) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>No standup scheduled today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Schedule a standup for today from above.</div>
        </CardContent>
      </Card>
    );
  }

  // Standup available
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>
          Standup for {todayStandup.scheduled_at}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!start && !finalized ? (
          <Button onClick={handleStart} disabled={loading || employees.length === 0}>
            Start Standup
          </Button>
        ) : (
          <>
            <div className="mb-2 font-semibold">
              Mark attendance:
            </div>
            <div className="space-y-2">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={attendance[emp.id]?.status === "Present"}
                    disabled={finalized}
                    onCheckedChange={() => handleCheckbox(emp.id)}
                    id={`attendance-${emp.id}`}
                  />
                  <label htmlFor={`attendance-${emp.id}`}>{emp.name} ({emp.email})</label>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              {!finalized && (
                <Button variant="destructive" onClick={handleStop}>
                  Stop Standup
                </Button>
              )}
            </div>
            {finalized && (
              <div className="mt-4 border-t pt-3 font-semibold">
                Present:{" "}
                {Object.values(attendance).filter((a) => a.status === "Present").length} / {employees.length}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminStandupDashboard;
