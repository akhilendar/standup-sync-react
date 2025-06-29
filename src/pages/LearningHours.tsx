
import React, { useEffect, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import AdminScheduleLearningHour from "@/components/AdminScheduleLearningHour";
import { supabase } from "@/integrations/supabase/client";
import "./Attendance.css";

type Employee = { employee_id: string; name: string; email: string };
type LearningHourAttendance = { employee_id: string; status: string | null };
type LearningHour = { id: string; scheduled_at: string };

export default function LearningHours() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, LearningHourAttendance>>({});
  const [learningHour, setLearningHour] = useState<LearningHour | null>(null);
  const [learningHourCompleted, setLearningHourCompleted] = useState(false);
  const [learningHourStarted, setLearningHourStarted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedAttendance, setEditedAttendance] = useState<Record<string, boolean>>({});

  // Fetch data function refactored OUT for reuse
  const fetchData = async () => {
    // Fetch employees list
    const { data: empData } = await supabase.from("employees").select("*");
    setEmployees(empData || []);
    // Fetch today's learning hour
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: learningHourData } = await supabase
      .from("learning_hours")
      .select("*")
      .gte("scheduled_at", todayStr + "T00:00:00.000Z")
      .lt("scheduled_at", todayStr + "T23:59:59.999Z")
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLearningHour(learningHourData || null);
    if (learningHourData) {
      // Fetch attendance for this learning hour
      const { data: attData } = await supabase
        .from("learning_hours_attendance")
        .select("*")
        .eq("learning_hour_id", learningHourData.id);
      const map: Record<string, LearningHourAttendance> = {};
      attData?.forEach((a) => {
        map[a.employee_id] = a;
      });
      setAttendance(map);
      setLearningHourCompleted(attData && attData.length === empData?.length && attData.length > 0);
    } else {
      setAttendance({});
      setLearningHourCompleted(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScheduleReload = () => {
    // Called when "Add" button in AdminScheduleLearningHour succeeds
    fetchData();
  };

  // Handlers for attendance editing during learning hour
  const handleStartLearningHour = () => {
    setLearningHourStarted(true);
    setEditing(true);
    setEditedAttendance(
      Object.fromEntries(
        employees.map(emp => [emp.employee_id, attendance[emp.employee_id]?.status === "Present"])
      )
    );
  };

  const handleAttendanceCheck = (empId: string, checked: boolean) => {
    setEditedAttendance(prev => ({ ...prev, [empId]: checked }));
  };

  const handleStopLearningHour = async () => {
    if (!learningHour) return;
    for (const emp of employees) {
      const empStatus = editedAttendance[emp.employee_id] ? "Present" : "Missed";
      const found = attendance[emp.employee_id];
      if (found) {
        await supabase
          .from("learning_hours_attendance")
          .update({ status: empStatus })
          .eq("employee_id", emp.employee_id)
          .eq("learning_hour_id", learningHour.id);
      } else {
        await supabase.from("learning_hours_attendance").insert([
          { learning_hour_id: learningHour.id, employee_id: emp.employee_id, status: empStatus },
        ]);
      }
    }
    
    // Sync to Google Sheets with LH Attendance sheet
    const dataToSend = employees.map((emp) => ({
      learning_hour_id: learningHour.id,
      learning_hour_time: new Date(learningHour.scheduled_at).toLocaleString(),
      employee_id: emp.employee_id,
      employee_name: emp.name,
      employee_email: emp.email,
      status: editedAttendance[emp.employee_id] ? "Present" : "Missed",
      sheet_type: "LH Attendance"
    }));
    
    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbyfGUpUJ7sLxScWTVQwxQTC5YGqxysEVODH00y6VbzfOjfjThVJXfcJNkqfEvcT2WL34g/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: dataToSend }),
        }
      );
    } catch (error) {
      console.error("Error syncing Learning Hours to Google Sheets:", error);
    }
    
    await fetchData();
    setLearningHourStarted(false);
    setEditing(false);
    setLearningHourCompleted(true);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(120deg, #e6eafc 0%, #c8eafc 50%, #f1f4f9 100%)" }}>
      <AppNavbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 620 }}>
          {/* 1. No learning hour for today: Show ONLY schedule section */}
          {!learningHour && (
            <AdminScheduleLearningHour onAfterSchedule={handleScheduleReload} />
          )}

          {/* 2. Learning hour scheduled for today */}
          {learningHour && !learningHourStarted && !learningHourCompleted && (
            <div className="card-style" style={{ maxWidth: 520, margin: "40px auto 0", textAlign: "center", padding: 32 }}>
              <h2 style={{ marginBottom: 18 }}>Today's Learning Hour</h2>
              <div className="banner" style={{ background: "#e6f7ff", color: "#096", margin: "0 0 20px 0" }}>
                Learning Hour scheduled for today.
              </div>
              <button
                className="btn-style py-2 px-7 text-lg rounded"
                onClick={handleStartLearningHour}
              >
                Start Learning Hour
              </button>
            </div>
          )}

          {/* 3. Learning hour started: Show attendance editing using checkboxes */}
          {learningHour && learningHourStarted && !learningHourCompleted && (
            <div className="card-style" style={{ maxWidth: 520, margin: "40px auto 0" }}>
              <h2 style={{ marginBottom: 16 }}>Mark Attendance</h2>
              <div style={{ marginTop: 12, fontWeight: 600, color: "#267", marginBottom: 12 }}>People</div>
              <ul style={{ paddingLeft: 0, margin: 0 }}>
                {employees.map(emp => (
                  <li
                    key={emp.employee_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 12,
                      fontWeight: 500,
                      color: editedAttendance[emp.employee_id] ? "#20af6e" : "#cb9620",
                      fontSize: "1.025rem"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!editedAttendance[emp.employee_id]}
                      onChange={e => handleAttendanceCheck(emp.employee_id, e.target.checked)}
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
                onClick={handleStopLearningHour}
              >
                Stop
              </button>
            </div>
          )}

          {/* 4. Learning hour completed: Show who attended (checkbox, disabled) */}
          {learningHour && learningHourCompleted && (
            <div className="card-style" style={{ maxWidth: 520, margin: "30px auto 0" }}>
              <h1 style={{ marginBottom: 13 }}>Learning Hours</h1>
              <div className="banner" style={{ color: "#088", marginTop: 0, background: "linear-gradient(90deg,#eefff9 0%,#e8f5fa 80%)" }}>
                Learning Hour completed for today!
              </div>
              <div style={{ marginTop: 18, color: "#238", fontWeight: 400, fontSize: "1.04rem" }}>
                See who joined today's learning hour and stay connected. Checkmarks show who attended.
              </div>
              <div style={{ marginTop: 30 }}>
                <div style={{ fontWeight: 600, color: "#267", marginBottom: 10, fontSize: "1.08rem" }}>People</div>
                <div>
                  <ul style={{ paddingLeft: 0, margin: 0 }}>
                    {employees.map(emp => {
                      const present = attendance[emp.employee_id]?.status === "Present";
                      return (
                        <li
                          key={emp.employee_id}
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
                  Learning Hour completed!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
