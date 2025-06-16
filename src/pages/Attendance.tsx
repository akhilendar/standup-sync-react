import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppNavbar from "@/components/AppNavbar";
import { toast } from "@/components/ui/use-toast";
import "./Attendance.css";

type Employee = { id: string; name: string; email: string };
type Attendance = { employee_id: string; status: string | null };

export default function Attendance() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Attendance>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedAtt, setEditedAtt] = useState<Record<string, string>>({}); // id -> status

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setEditing(false);
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
        setEditedAtt({});
      } else {
        setAttendance({});
        setEditedAtt({});
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Handler: initiate edit mode
  const handleEdit = () => {
    const initial = Object.fromEntries(
      employees.map(emp => [emp.id, attendance[emp.id]?.status || "Missed"])
    );
    setEditedAtt(initial);
    setEditing(true);
  };

  // Handler: Change status in edit mode
  const handleChange = (empId: string, val: string) => {
    setEditedAtt(prev => ({ ...prev, [empId]: val }));
  };

  // Save edited attendance to DB (insert or update)
  const handleSave = async () => {
    setLoading(true);
    const todayStr = new Date().toISOString().slice(0, 10);
    // Find today's standup
    const { data: standup } = await supabase
      .from("standups")
      .select("*")
      .gte("scheduled_at", todayStr + "T00:00:00.000Z")
      .lt("scheduled_at", todayStr + "T23:59:59.999Z")
      .order("scheduled_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!standup) {
      setLoading(false);
      return;
    }
    // Upsert attendance for each employee
    const bulk = employees.map(emp => {
      return {
        standup_id: standup.id,
        employee_id: emp.id,
        status: editedAtt[emp.id] || "Missed"
      };
    });
    for (let row of bulk) {
      const found = attendance[row.employee_id];
      if (found) {
        await supabase
          .from("attendance")
          .update({ status: row.status })
          .eq("employee_id", row.employee_id)
          .eq("standup_id", row.standup_id);
      } else {
        await supabase.from("attendance").insert([{ ...row }]);
      }
    }
    // After saving, reload state from DB
    const { data: attData } = await supabase
      .from("attendance")
      .select("*")
      .eq("standup_id", standup.id);
    const map: Record<string, Attendance> = {};
    attData?.forEach((a) => {
      map[a.employee_id] = a;
    });
    setAttendance(map);
    setEditedAtt({});
    setEditing(false);
    // Google Sheets sync via your provided deployment
    const dataToSend = employees.map((emp) => ({
      standup_id: standup.id,
      standup_time: new Date(standup.scheduled_at).toLocaleString(),
      employee_id: emp.id,
      employee_name: emp.name,
      employee_email: emp.email,
      status: map[emp.id]?.status || "Missed",
    }));
    try {
      await fetch(
        "https://cors-anywhere.herokuapp.com/https://script.google.com/macros/s/AKfycbyfGUpUJ7sLxScWTVQwxQTC5YGqxysEVODH00y6VbzfOjfjThVJXfcJNkqfEvcT2WL34g/exec",
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

  // Modified handleSyncSheet:
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
    if (!standup) {
      toast({
        title: "No standup found for today.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    // Always fetch fresh attendance data for today
    const { data: attData } = await supabase
      .from("attendance")
      .select("*")
      .eq("standup_id", standup.id);
    const newAttendance: Record<string, Attendance> = {};
    attData?.forEach((a) => {
      newAttendance[a.employee_id] = a;
    });
    setAttendance(newAttendance);

    const dataToSend = employees.map((emp) => ({
      standup_id: standup.id,
      standup_time: new Date(standup.scheduled_at).toLocaleString(),
      employee_id: emp.id,
      employee_name: emp.name,
      employee_email: emp.email,
      status: newAttendance[emp.id]?.status || "Missed",
    }));
    try {
      const res = await fetch(
        "https://script.google.com/macros/s/AKfycbyfGUpUJ7sLxScWTVQwxQTC5YGqxysEVODH00y6VbzfOjfjThVJXfcJNkqfEvcT2WL34g/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: dataToSend }),
        }
      );
      const resJson = await res.json();
      if (resJson.status === "success") {
        toast({
          title: "Google Sheet sync successful!",
          description: resJson.message || "",
          variant: "default",
        });
      } else {
        toast({
          title: "Google Sheet sync failed",
          description: resJson.message || "An error occurred.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Google Sheet sync failed",
        description: error?.message || "An error occurred.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Compute counts
  const totalEmployees = employees.length;
  const presentCount = employees.filter(
    (emp) =>
      (editing ? editedAtt[emp.id] : attendance[emp.id]?.status) === "Present"
  ).length;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppNavbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card-style" style={{ maxWidth: 700 }}>
          <h1 style={{ marginBottom: 18 }}>Attendance</h1>
          <button className="btn-style" onClick={handleSyncSheet} disabled={loading}>
            Resync to Google Sheet
          </button>
          {loading ? (
            <div className="banner" style={{ background: "#e6eeff", color: "#3366a3", margin: "18px 0" }}>Loading...</div>
          ) : (
            <>
              <div style={{ margin: "18px 0 7px 0", fontWeight: 600, color: "#27588a", fontSize: "1.05rem" }}>
                <span>Today’s Attendance</span>
                {/* Attendance count */}
                <span style={{ marginLeft: 20, color: "#188d4c", fontWeight: 800 }}>
                  Present: {presentCount} / {totalEmployees}
                </span>
                {!editing && (
                  <button className="btn-style" style={{ float: "right", fontSize: 14, padding: "5px 16px", borderRadius: 12, marginTop: -2 }}
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
                        key={emp.id}
                        className={
                          (editing
                            ? (editedAtt[emp.id] === "Present" ? "table-row-present" : editedAtt[emp.id] === "Missed" ? "table-row-missed" : "table-row-absent")
                            : (attendance[emp.id]?.status === "Present" ? "table-row-present" : attendance[emp.id]?.status === "Missed" ? "table-row-missed" : attendance[emp.id]?.status === "Absent" ? "table-row-absent" : "table-row-absent"))
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
                              value={editedAtt[emp.id]}
                              onChange={e => handleChange(emp.id, e.target.value)}
                              data-testid={`status-select-${emp.id}`}
                            >
                              <option value="Present">Present</option>
                              <option value="Missed">Missed</option>
                              <option value="Absent">Absent</option>
                              <option value="Not Available">Not Available</option>
                            </select>
                          ) : (
                            attendance[emp.id]?.status
                              ? attendance[emp.id]?.status
                              : <span style={{ color: "#be8808" }}>Missed</span>
                          )}
                        </td>
                        {editing && (
                          <td>
                            <span role="img" aria-label="editing">✏️</span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {editing && (
                <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end", gap: 9 }}>
                  <button
                    className="btn-style"
                    style={{ fontSize: "1rem", borderRadius: 10, padding: "8px 22px" }}
                    onClick={handleSave}
                  >
                    Add to Database
                  </button>
                  <button
                    className="btn-style"
                    style={{ background: "#e4e8fc", color: "#1272a5", fontWeight: 700, borderRadius: 10, padding: "8px 19px" }}
                    onClick={() => { setEditing(false); setEditedAtt({}); }}
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
