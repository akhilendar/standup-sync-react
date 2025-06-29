
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// NEW UTILITY FUNCTION FOR SHEET SYNC
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby8F_q7tY_HuIHwsMpSRYXcbEsXx3mwW69EZAE_fepk2S5w01xeubMRKG084kNBICNb7Q/exec";

async function syncAttendanceToSheet({
  standup,
  employees,
  attendance,
}: {
  standup: { id: string; scheduled_at: string };
  employees: { employee_id: string; name: string; email: string }[];
  attendance: Record<
    string,
    {
      id: string;
      employee_id: string;
      status: string | null;
    }
  >;
}) {
  try {
    // Prepare records for POST
    const dataToSend = employees.map((emp) => ({
      standup_id: standup.id,
      standup_time: new Date(standup.scheduled_at).toLocaleString(),
      employee_id: emp.employee_id,
      employee_name: emp.name,
      employee_email: emp.email,
      status: attendance[emp.employee_id]?.status || "Absent",
    }));
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: dataToSend }),
    });
    // Optionally, a success message could be shown, but we'll avoid spamming
  } catch (err) {
    console.error("Sheet sync error:", err);
    toast({
      title: "Google Sheet sync failed",
      description: err instanceof Error ? err.message : "Unknown error",
      variant: "destructive",
    });
  }
}

type Employee = {
  employee_id: string;
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

  // Get today's standup with datetime (scheduled_at includes time!)
  React.useEffect(() => {
    const fetchTodayStandup = async () => {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("standups")
        .select("*")
        .gte("scheduled_at", todayStr + "T00:00:00.000Z")
        .lt("scheduled_at", todayStr + "T23:59:59.999Z")
        .order("scheduled_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setTodayStandup(data);
      else setTodayStandup(null);
    };
    fetchTodayStandup();
  }, []);

  React.useEffect(() => {
    if (!todayStandup) return;
    const fetchEmployees = async () => {
      const { data } = await supabase.from("employees").select("*");
      if (data) setEmployees(data);
    };
    fetchEmployees();
  }, [todayStandup]);

  React.useEffect(() => {
    if (!todayStandup || (!start && !finalized)) return;
    const fetchAttendance = async () => {
      const { data } = await supabase
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

  const scheduledDate = todayStandup ? new Date(todayStandup.scheduled_at) : null;
  const now = new Date();

  const canStart =
    todayStandup && scheduledDate
      ? now.getTime() >= scheduledDate.getTime()
      : false;

  // Updated - sync after changes
  const syncSheet = React.useCallback(() => {
    if (todayStandup && employees.length > 0) {
      syncAttendanceToSheet({
        standup: todayStandup,
        employees: employees,
        attendance: attendance,
      });
    }
  }, [todayStandup, employees, attendance]);

  // Save attendance in localStorage after standup is stopped
  const saveAttendanceLocal = () => {
    if (todayStandup && employees.length > 0) {
      const details = {
        standupTime: todayStandup.scheduled_at,
        attendance: employees.map((emp) => ({
          ...emp,
          status: attendance[emp.employee_id]?.status || "Absent",
        })),
      };
      localStorage.setItem("standup_attendance_details", JSON.stringify(details));
    }
  };

  const handleStart = async () => {
    if (!todayStandup || employees.length === 0) return;
    setLoading(true);

    // Insert attendance rows for each employee if not already present
    const inserts = [];
    for (let emp of employees) {
      if (!attendance[emp.employee_id]) {
        inserts.push({
          standup_id: todayStandup.id,
          employee_id: emp.employee_id,
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
    setTimeout(syncSheet, 500); // allow fetchAttendance to update state
  };

  const handleCheckbox = async (employeeId: string) => {
    if (!todayStandup || finalized) return;
    setLoading(true);
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
        setTimeout(syncSheet, 400); // sync after update
      }
    }
    setLoading(false);
  };

  const handleStop = async () => {
    setFinalized(true);
    setStart(false);
    saveAttendanceLocal();
    toast({ title: "Standup finalized", description: "Attendance is locked for today" });
    setTimeout(syncSheet, 400); // sync after finalizing
  };

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

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>
          Standup for {scheduledDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on {scheduledDate?.toLocaleDateString()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!start && !finalized ? (
          <Button onClick={handleStart} disabled={loading || employees.length === 0 || !canStart}>
            {canStart ? "Start Standup" : `Start available at ${scheduledDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </Button>
        ) : (
          <>
            <div className="mb-2 font-semibold">
              Mark attendance:
            </div>
            <div className="space-y-2">
              {employees.map((emp) => (
                <div key={emp.employee_id} className="flex items-center gap-2">
                  <Checkbox
                    checked={attendance[emp.employee_id]?.status === "Present"}
                    disabled={finalized}
                    onCheckedChange={() => handleCheckbox(emp.employee_id)}
                    id={`attendance-${emp.employee_id}`}
                  />
                  <label htmlFor={`attendance-${emp.employee_id}`}>{emp.name} ({emp.email})</label>
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
