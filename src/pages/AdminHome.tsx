
import React from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AppNavbar from "@/components/AppNavbar";
import { supabase } from "@/integrations/supabase/client";

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
      // 1. Find today's standup
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
        // 2. Count attendance
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
    <div className="min-h-screen flex flex-col bg-background p-4">
      <AppNavbar />
      <Card className="w-full max-w-2xl mt-10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Admin Dashboard</CardTitle>
            <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <span className="font-semibold">Welcome, {admin?.email}!</span>
          </div>
          {summary.standupTime ? (
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Today's Standup:</span>&nbsp;
                {summary.standupTime}
              </div>
              <div>
                <span className="font-semibold">Attendance:</span>&nbsp;
                {summary.present} / {summary.total}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">
              No standup scheduled today.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHome;
