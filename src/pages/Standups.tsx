
import React, { useEffect, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/integrations/supabase/client";
import "./Attendance.css";

type Employee = { id: string; name: string; email: string };
type Attendance = { employee_id: string; status: string | null };

export default function Standups() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Attendance>>({});
  const [standupCompleted, setStandupCompleted] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // Fetch employees list
      const { data: empData } = await supabase.from("employees").select("*");
      setEmployees(empData || []);
      // Fetch today's standup
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
        // Fetch attendance for this standup
        const { data: attData } = await supabase
          .from("attendance")
          .select("*")
          .eq("standup_id", standup.id);
        const map: Record<string, Attendance> = {};
        attData?.forEach((a) => {
          map[a.employee_id] = a;
        });
        setAttendance(map);
        // Let's say standup is complete if all employees have any attendance marked.
        setStandupCompleted(attData && attData.length === empData?.length && attData.length > 0);
      } else {
        setAttendance({});
        setStandupCompleted(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(120deg, #e6eafc 0%, #c8eafc 50%, #f1f4f9 100%)" }}>
      <AppNavbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card-style" style={{ maxWidth: 520 }}>
          <h1 style={{ marginBottom: 13 }}>Team Standups</h1>
          <div className="banner" style={{ color: "#088", marginTop: 0, background: "linear-gradient(90deg,#eefff9 0%,#e8f5fa 80%)" }}>
            Stay on track with team standups! <span role="img" aria-label="microphone">🎤</span>
          </div>
          <div style={{ marginTop: 18, color: "#238", fontWeight: 400, fontSize: "1.04rem" }}>
            See who joined today's standup and stay connected. Checkmarks show who attended.
          </div>
          <div style={{ marginTop: 30 }}>
            <div style={{ fontWeight: 600, color: "#267", marginBottom: 10, fontSize: "1.08rem" }}>People</div>
            <div>
              {employees.length === 0 && (
                <span style={{ color: "#777" }}>No data</span>
              )}
              <ul style={{ paddingLeft: 0, margin: 0 }}>
                {employees.map(emp => {
                  const present = attendance[emp.id]?.status === "Present";
                  return (
                    <li
                      key={emp.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 9,
                        fontWeight: 500,
                        color: present ? "#20af6e" : "#cb9620",
                        fontSize: "1.025rem"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={present}
                        readOnly
                        disabled={standupCompleted}
                        style={{
                          marginRight: 12,
                          accentColor: present ? "#11b26b" : "#beae6c",
                          width: "18px",
                          height: "18px",
                          cursor: "default"
                        }}
                      />
                      <span>{emp.name}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            {standupCompleted && (
              <div className="banner" style={{ background: "#e5ffe5", color: "#159f46", marginTop: 16 }}>
                Standup completed!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
