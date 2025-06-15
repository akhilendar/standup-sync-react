
import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppNavbar from "@/components/AppNavbar";
import "./Attendance.css";

type Employee = { id: string; name: string; email: string };
type Attendance = { employee_id: string; status: string | null };

export default function Attendance() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Attendance>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: empData } = await supabase.from("employees").select("*");
      setEmployees(empData || []);
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

  const handleSyncSheet = async () => {
    setLoading(true);
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: standup } = await supabase
      .from("standups")
      .select("*")
      .gte("scheduled_at", todayStr + "T00:00:00.000Z")
      .lt("scheduled_at", todayStr + "T23:59:59.999Z")
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!standup) return setLoading(false);
    const dataToSend = employees.map((emp) => ({
      standup_id: standup.id,
      standup_time: new Date(standup.scheduled_at).toLocaleString(),
      employee_id: emp.id,
      employee_name: emp.name,
      employee_email: emp.email,
      status: attendance[emp.id]?.status || "Absent",
    }));
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppNavbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card-style" style={{ maxWidth: 700 }}>
          <h1 style={{ marginBottom: 20 }}>Attendance</h1>
          <button className="btn-style" onClick={handleSyncSheet}>
            Resync to Google Sheet
          </button>
          {loading ? (
            <div className="banner" style={{ background: "#e6eeff", color: "#3366a3", margin: "18px 0" }}>Loading...</div>
          ) : (
            <>
              <div style={{ marginTop: 18, fontWeight: 600, color: "#27588a", fontSize: "1.05rem" }}>
                <span>Today’s Attendance</span>
              </div>
              <div style={{ overflowX: "auto", width: "100%", marginTop: 10 }}>
                <table className="table-style">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr
                        key={emp.id}
                        className={
                          attendance[emp.id]?.status === "Present"
                            ? "table-row-present"
                            : "table-row-absent"
                        }
                      >
                        <td>{emp.name}</td>
                        <td>{emp.email}</td>
                        <td>
                          {attendance[emp.id]?.status || <span style={{ color: "#be8808" }}>Absent</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
