import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AppNavbar from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";

type Employee = { id: string; name: string; email: string };
type Attendance = { employee_id: string; status: string | null };

export default function Attendance() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Attendance>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // 1. Get all employees
      const { data: empData } = await supabase.from("employees").select("*");
      setEmployees(empData || []);
      // 2. Get today's standup
      const todayStr = new Date().toISOString().slice(0, 10);
      const { data: standup } = await supabase
        .from("standups")
        .select("*")
        .gte("scheduled_at", todayStr + "T00:00:00.000Z")
        .lt("scheduled_at", todayStr + "T23:59:59.999Z")
        .order("scheduled_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (standup) {
        // 3. Get today's attendance
        const { data: attData } = await supabase
          .from("attendance")
          .select("*")
          .eq("standup_id", standup.id);
        const map: Record<string, Attendance> = {};
        attData?.forEach((a) => {
          map[a.employee_id] = a;
        });
        setAttendance(map);
      } else {
        setAttendance({});
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // BUTTON: force re-sync sheet from attendance page, in case admin modifies directly
  const handleSyncSheet = async () => {
    setLoading(true);
    // 1. Find today standup
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: standup } = await supabase
      .from("standups")
      .select("*")
      .gte("scheduled_at", todayStr + "T00:00:00.000Z")
      .lt("scheduled_at", todayStr + "T23:59:59.999Z")
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!standup) return;
    // 2. Prepare data for sheet
    const dataToSend = employees.map((emp) => ({
      standup_id: standup.id,
      standup_time: new Date(standup.scheduled_at).toLocaleString(),
      employee_id: emp.id,
      employee_name: emp.name,
      employee_email: emp.email,
      status: attendance[emp.id]?.status || "Absent",
    }));
    // 3. POST data to Apps Script
    await fetch(
      "https://script.google.com/macros/s/AKfycby8F_q7tY_HuIHwsMpSRYXcbEsXx3mwW69EZAE_fepk2S5w01xeubMRKG084kNBICNb7Q/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: dataToSend }),
      }
    );
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNavbar />
      <div className="max-w-xl mx-auto my-10 flex-1 flex items-center">
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Button onClick={handleSyncSheet}>Resync to Google Sheet</Button>
              {loading ? (
                <div className="mt-4 text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <div className="my-4">
                    <span className="font-semibold">Today’s Attendance</span>
                  </div>
                  <table className="w-full border text-sm">
                    <thead>
                      <tr>
                        <th className="border p-2">Name</th>
                        <th className="border p-2">Email</th>
                        <th className="border p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp) => (
                        <tr key={emp.id}>
                          <td className="border p-2">{emp.name}</td>
                          <td className="border p-2">{emp.email}</td>
                          <td className="border p-2">
                            {attendance[emp.id]?.status || "Absent"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
