
import React from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useNavigate } from "react-router-dom";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/integrations/supabase/client";
import "./AdminHome.css"; // New CSS for this page

const AdminHome = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = React.useState<{
    standupTime: string | null;
    present: number;
    total: number;
  }>({ standupTime: null, present: 0, total: 0 });

  React.useEffect(() => {
    if (!admin) navigate("/admin/login");
  }, [admin, navigate]);

  React.useEffect(() => {
    async function fetchSummary() {
      const todayStr = new Date().toISOString().slice(0, 10);
      const { data: standup } = await supabase
        .from("standups")
        .select("*")
        .gte("scheduled_at", todayStr + "T00:00:00.000Z")
        .lt("scheduled_at", todayStr + "T23:59:59.999Z")
        .order("scheduled_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      let standupTime = null, present = 0, total = 0;
      if (standup) {
        const { data: attendance } = await supabase
          .from("attendance")
          .select("*")
          .eq("standup_id", standup.id);
        present = attendance ? attendance.filter(a => a.status === "Present").length : 0;
        total = attendance ? attendance.length : 0;
        standupTime = new Date(standup.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      setSummary({ standupTime, present, total });
    }
    fetchSummary();
  }, []);

  return (
    <div className="admin-home-bg">
      <AppNavbar />
      <div className="admin-home-content">
        <div className="admin-home-card">
          <div className="admin-home-header">
            <h1 className="admin-home-title">Admin Dashboard</h1>
            <button className="admin-home-logout-btn" onClick={logout}>Logout</button>
          </div>
          <div className="admin-home-card-content">
            <div className="admin-home-welcome">
              Welcome, <span>{admin?.email}!</span>
            </div>
            {summary.standupTime ? (
              <div className="admin-home-summary">
                <div>
                  <span>Today's Standup:</span>
                  <span className="admin-home-standup-time">{summary.standupTime}</span>
                </div>
                <div>
                  <span>Attendance:</span>
                  <span className="admin-home-attendance">
                    {summary.present} / {summary.total}
                  </span>
                </div>
              </div>
            ) : (
              <div className="admin-home-no-standup">
                No standup scheduled today.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
