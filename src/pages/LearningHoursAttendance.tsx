
import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppNavbar from "@/components/AppNavbar";
import { toast } from "@/components/ui/use-toast";
import "./Attendance.css";

type Employee = { employee_id: string; name: string; email: string };
type LearningHourAttendance = { employee_id: string; status: string | null };

export default function LearningHoursAttendance() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, LearningHourAttendance>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedAtt, setEditedAtt] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setEditing(false);
      const { data: empData } = await supabase.from("employees").select("*");
      setEmployees(empData || []);
      const todayStr = new Date().toISOString().slice(0, 10);
      const { data: learningHour } = await supabase
        .from("learning_hours")
        .select("*")
        .gte("scheduled_at", todayStr + "T00:00:00.000Z")
        .lt("scheduled_at", todayStr + "T23:59:59.999Z")
        .order("scheduled_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (learningHour) {
        const { data: attData } = await supabase.from("learning_hours_attendance").select("*").eq("learning_hour_id", learningHour.id);
        const map: Record<string, LearningHourAttendance> = {};
        attData?.forEach((a) => {
          map[a.employee_id] = a;
        });
        setAttendance(map);
        setEditedAtt({});
      } else {
        setAttendance({});
        setEditedAtt({});
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleEdit = () => {
    const initial: Record<string, string> = {};
    employees.forEach((emp) => {
      initial[emp.employee_id] = attendance[emp.employee_id]?.status || "Missed";
    });
    setEditedAtt(initial);
    setEditing(true);
  };

  const handleChange = (empId: string, val: string) => {
    setEditedAtt((prev) => ({ ...prev, [empId]: val }));
  };

  const handleSave = async () => {
    setLoading(true);
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: learningHour } = await supabase
      .from("learning_hours")
      .select("*")
      .gte("scheduled_at", todayStr + "T00:00:00.000Z")
      .lt("scheduled_at", todayStr + "T23:59:59.999Z")
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!learningHour) {
      setLoading(false);
      return;
    }

    const bulk = employees.map((emp) => {
      return {
        learning_hour_id: learningHour.id,
        employee_id: emp.employee_id,
        status: editedAtt[emp.employee_id] || "Missed",
      };
    });

    for (const row of bulk) {
      const found = attendance[row.employee_id];
      if (found) {
        await supabase
          .from("learning_hours_attendance")
          .update({ status: row.status })
          .eq("employee_id", row.employee_id)
          .eq("learning_hour_id", row.learning_hour_id);
      } else {
        await supabase.from("learning_hours_attendance").insert([{ ...row }]);
      }
    }

    // Reload attendance after saving
    const { data: attData } = await supabase.from("learning_hours_attendance").select("*").eq("learning_hour_id", learningHour.id);
    const map: Record<string, LearningHourAttendance> = {};
    attData?.forEach((a) => {
      map[a.employee_id] = a;
    });
    setAttendance(map);
    setEditedAtt({});
    setEditing(false);

    // Google Sheets sync with correct LH Attendance URL
    const dataToSend = employees.map((emp) => ({
      learning_hour_id: learningHour.id,
      learning_hour_time: new Date(learningHour.scheduled_at).toLocaleString(),
      employee_id: emp.employee_id,
      employee_name: emp.name,
      employee_email: emp.email,
      status: map[emp.employee_id]?.status || "Missed",
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
      console.error("Error syncing to Google Sheets:", error);
    }
    setLoading(false);
  };

  const handleSyncSheet = async () => {
    setLoading(true);
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: learningHour } = await supabase
      .from("learning_hours")
      .select("*")
      .gte("scheduled_at", todayStr + "T00:00:00.000Z")
      .lt("scheduled_at", todayStr + "T23:59:59.999Z")
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!learningHour) {
      toast({
        title: "No learning hour found for today.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const dataToSend = employees.map((emp) => ({
      learning_hour_id: learningHour.id,
      learning_hour_time: new Date(learningHour.scheduled_at).toLocaleString(),
      employee_id: emp.employee_id,
      employee_name: emp.name,
      employee_email: emp.email,
      status: attendance[emp.employee_id]?.status || "Missed",
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
      toast({
        title: "Google Sheet sync completed!",
        description: "Data has been synced successfully.",
        variant: "default",
      });
    } catch (error: unknown) {
      toast({
        title: "Google Sheet sync failed",
        description: error instanceof Error ? error.message : "An error occurred.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const totalEmployees = employees.length;
  const presentCount = employees.filter(
    (emp) => (editing ? editedAtt[emp.employee_id] : attendance[emp.employee_id]?.status) === "Present"
  ).length;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppNavbar />
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="card-style" style={{ maxWidth: 700 }}>
          <h1 style={{ marginBottom: 18 }}>Learning Hours Attendance</h1>
          <button className="btn-style" onClick={handleSyncSheet} disabled={loading}>
            Resync to Google Sheet
          </button>
          {loading ? (
            <div
              className="banner"
              style={{
                background: "#e6eeff",
                color: "#3366a3",
                margin: "18px 0",
              }}
            >
              Loading...
            </div>
          ) : (
            <>
              <div
                style={{
                  margin: "18px 0 7px 0",
                  fontWeight: 600,
                  color: "#27588a",
                  fontSize: "1.05rem",
                }}
              >
                <span>Today's Learning Hours Attendance</span>
                <span style={{ marginLeft: 20, color: "#188d4c", fontWeight: 800 }}>
                  Present: {presentCount} / {totalEmployees}
                </span>
                {!editing && (
                  <button
                    className="btn-style"
                    style={{
                      float: "right",
                      fontSize: 14,
                      padding: "5px 16px",
                      borderRadius: 12,
                      marginTop: -2,
                    }}
                    onClick={handleEdit}
                  >
                    Edit
                  </button>
                )}
              </div>
              <div style={{ overflowX: "auto", width: "100%", marginTop: 10 }}>
                <table className="table-style">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      {editing && <th>Edit</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr
                        key={emp.employee_id}
                        className={
                          editing
                            ? editedAtt[emp.employee_id] === "Present"
                              ? "table-row-present"
                              : editedAtt[emp.employee_id] === "Missed"
                              ? "table-row-missed"
                              : "table-row-absent"
                            : attendance[emp.employee_id]?.status === "Present"
                            ? "table-row-present"
                            : attendance[emp.employee_id]?.status === "Missed"
                            ? "table-row-missed"
                            : attendance[emp.employee_id]?.status === "Absent"
                            ? "table-row-absent"
                            : "table-row-absent"
                        }
                      >
                        <td>{emp.name}</td>
                        <td>
                          {editing ? (
                            <select
                              style={{
                                padding: "6px 14px",
                                borderRadius: "7px",
                                border: "1.6px solid #b7e6d7",
                                background: "#f5ffee",
                                fontWeight: 600,
                                color: "#20af6e",
                                fontSize: "0.96rem",
                                outline: "none",
                              }}
                              value={editedAtt[emp.employee_id] || "Missed"}
                              onChange={(e) => handleChange(emp.employee_id, e.target.value)}
                              data-testid={`status-select-${emp.employee_id}`}
                            >
                              <option value="Present">Present</option>
                              <option value="Missed">Missed</option>
                              <option value="Absent">Absent</option>
                              <option value="Not Available">Not Available</option>
                            </select>
                          ) : attendance[emp.employee_id]?.status ? (
                            attendance[emp.employee_id]?.status
                          ) : (
                            <span style={{ color: "#be8808" }}>Missed</span>
                          )}
                        </td>
                        {editing && (
                          <td>
                            <span role="img" aria-label="editing">
                              ✏️
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {editing && (
                <div
                  style={{
                    marginTop: 22,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 9,
                  }}
                >
                  <button
                    className="btn-style"
                    style={{
                      fontSize: "1rem",
                      borderRadius: 10,
                      padding: "8px 22px",
                    }}
                    onClick={handleSave}
                  >
                    Add to Database
                  </button>
                  <button
                    className="btn-style"
                    style={{
                      background: "#e4e8fc",
                      color: "#1272a5",
                      fontWeight: 700,
                      borderRadius: 10,
                      padding: "8px 19px",
                    }}
                    onClick={() => {
                      setEditing(false);
                      setEditedAtt({});
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
