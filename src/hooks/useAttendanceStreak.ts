
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { useAdminAuth } from "@/context/AdminAuthContext";

type AttendanceStreak = number | "N/A" | null;

export function useAttendanceStreak() {
  const { user, profile } = useUser();
  const { admin } = useAdminAuth();
  const [attendanceStreak, setAttendanceStreak] = useState<AttendanceStreak>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    async function fetchStreak() {
      if (!user || !profile) {
        setAttendanceStreak(null);
        return;
      }
      setAttendanceLoading(true);

      const { data, error } = await supabase
        .from("attendance")
        .select("status, standup_id, standups:supabase_standups_id(scheduled_at)")
        .eq("employee_id", user.id)
        .order("standups.scheduled_at", { ascending: false });

      if (error || !Array.isArray(data)) {
        setAttendanceStreak(null);
        setAttendanceLoading(false);
        return;
      }
      const sortedAtt = data
        .map((att: any) => ({
          status: att.status,
          scheduled_at: att.standups?.scheduled_at,
        }))
        .filter((att: any) => att.scheduled_at)
        .sort((a: any, b: any) => (a.scheduled_at > b.scheduled_at ? -1 : 1));
      let streak = 0;
      for (let i = 0; i < sortedAtt.length; i++) {
        if (sortedAtt[i].status === "Present") {
          if (i === 0) {
            streak = 1;
          } else {
            const prevDate = new Date(sortedAtt[i - 1].scheduled_at);
            const currDate = new Date(sortedAtt[i].scheduled_at);
            const diff = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
              streak += 1;
            } else {
              break;
            }
          }
        } else {
          if (i === 0) break;
          else break;
        }
      }
      setAttendanceStreak(streak);
      setAttendanceLoading(false);
    }

    if (user && profile && profile.role !== "admin") {
      fetchStreak();
    } else if (admin) {
      setAttendanceStreak("N/A");
    }
  }, [user, profile, admin]);

  return { attendanceStreak, attendanceLoading };
}
