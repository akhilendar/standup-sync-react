
import React, { useEffect, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import AdminScheduleStandup from "@/components/AdminScheduleStandup";
import { supabase } from "@/integrations/supabase/client";
import "./Attendance.css";

type Employee = { id: string; name: string; email: string };
type Attendance = { employee_id: string; status: string | null };
type Standup = { id: string; scheduled_at: string };

export default function Standups() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Attendance>>({});
  const [standup, setStandup] = useState<Standup | null>(null);
  const [standupCompleted, setStandupCompleted] = useState(false);
  const [standupStarted, setStandupStarted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedAttendance, setEditedAttendance] = useState<Record<string, boolean>>({});

  // Fetch data function refactored OUT for reuse
  const fetchData = async () => {
    // Fetch employees list
    const { data: empData } = await supabase.from("employees").select("*");
    setEmployees(empData || []);
    // Fetch today's standup
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: standupData } = await supabase
      .from("standups")
      .select("*")
      .gte("scheduled_at", todayStr + "T00:00:00.000Z")
      .lt("scheduled_at", todayStr + "T23:59:59.999Z")
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setStandup(standupData || null);
    if (standupData) {
      // Fetch attendance for this standup
      const { data: attData } = await supabase
        .from("attendance")
        .select("*")
        .eq("standup_id", standupData.id);
      const map: Record<string, Attendance> = {};
      attData?.forEach((a) => {
        map[a.employee_id] = a;
      });
      setAttendance(map);
      setStandupCompleted(attData && attData.length === empData?.length && attData.length > 0);
    } else {
      setAttendance({});
      setStandupCompleted(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScheduleReload = () => {
    // Called when "Add" button in AdminScheduleStandup succeeds
    fetchData();
  };

  // Handlers for attendance editing during standup
  const handleStartStandup = () => {
    setStandupStarted(true);
    setEditing(true);
    setEditedAttendance(
      Object.fromEntries(
        employees.map(emp => [emp.id, attendance[emp.id]?.status === "Present"])
      )
    );
  };

  const handleAttendanceCheck = (empId: string, checked: boolean) => {
    setEditedAttendance(prev => ({ ...prev, [empId]: checked }));
  };

  const handleStopStandup = async () => {
    if (!standup) return;
    for (const emp of employees) {
      const empStatus = editedAttendance[emp.id] ? "Present" : "Missed";
      const found = attendance[emp.id];
      if (found) {
        await supabase
          .from("attendance")
          .update({ status: empStatus })
          .eq("employee_id", emp.id)
          .eq("standup_id", standup.id);
      } else {
        await supabase.from("attendance").insert([
          { standup_id: standup.id, employee_id: emp.id, status: empStatus },
        ]);
      }
    }
    await fetchData();
    setStandupStarted(false);
    setEditing(false);
    setStandupCompleted(true);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(120deg, #e6eafc 0%, #c8eafc 50%, #f1f4f9 100%)" }}>
      <AppNavbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 620 }}>
          {/* 1. No standup for today: Show ONLY schedule section */}
          {!standup && (
            <AdminScheduleStandup onAfterSchedule={handleScheduleReload} />
          )}

          {/* 2. Standup scheduled for today */}
          {standup && !standupStarted && !standupCompleted && (
            <div className="card-style" style={{ maxWidth: 520, margin: "40px auto 0", textAlign: "center", padding: 32 }}>
              <h2 style={{ marginBottom: 18 }}>Today's Standup</h2>
              <div className="banner" style={{ background: "#e6f7ff", color: "#096", margin: "0 0 20px 0" }}>
                Standup scheduled for today.
              </div>
              <button
                className="btn-style py-2 px-7 text-lg rounded"
                onClick={handleStartStandup}
              >
                Start Standup
              </button>
            </div>
          )}

          {/* 3. Standup started: Show attendance editing using checkboxes */}
          {standup && standupStarted && !standupCompleted && (
            <div className="card-style" style={{ maxWidth: 520, margin: "40px auto 0" }}>
              <h2 style={{ marginBottom: 16 }}>Mark Attendance</h2>
              <div style={{ marginTop: 12, fontWeight: 600, color: "#267", marginBottom: 12 }}>People</div>
              <ul style={{ paddingLeft: 0, margin: 0 }}>
                {employees.map(emp => (
                  <li
                    key={emp.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 12,
                      fontWeight: 500,
                      color: editedAttendance[emp.id] ? "#20af6e" : "#cb9620",
                      fontSize: "1.025rem"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!editedAttendance[emp.id]}
                      onChange={e => handleAttendanceCheck(emp.id, e.target.checked)}
                      disabled={!editing}
                      style={{
                        marginRight: 12,
                        accentColor: "#20af6e",
                        width: "20px",
                        height: "20px",
                        cursor: editing ? "pointer" : "default"
                      }}
                    />
                    <span>{emp.name}</span>
                  </li>
                ))}
              </ul>
              <button
                className="btn-style"
                style={{ marginTop: 30, background: "#18ae7a", color: "white", fontWeight: 700, fontSize: "1rem", padding: "10px 26px", borderRadius: 11 }}
                onClick={handleStopStandup}
              >
                Stop
              </button>
            </div>
          )}

          {/* 4. Standup completed: Show who attended (checkbox, disabled) */}
          {standup && standupCompleted && (
            <div className="card-style" style={{ maxWidth: 520, margin: "30px auto 0" }}>
              <h1 style={{ marginBottom: 13 }}>Team Standups</h1>
              <div className="banner" style={{ color: "#088", marginTop: 0, background: "linear-gradient(90deg,#eefff9 0%,#e8f5fa 80%)" }}>
                Standup completed for today!
              </div>
              <div style={{ marginTop: 18, color: "#238", fontWeight: 400, fontSize: "1.04rem" }}>
                See who joined today's standup and stay connected. Checkmarks show who attended.
              </div>
              <div style={{ marginTop: 30 }}>
                <div style={{ fontWeight: 600, color: "#267", marginBottom: 10, fontSize: "1.08rem" }}>People</div>
                <div>
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
                            disabled
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
                <div className="banner" style={{ background: "#e5ffe5", color: "#159f46", marginTop: 16 }}>
                  Standup completed!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
