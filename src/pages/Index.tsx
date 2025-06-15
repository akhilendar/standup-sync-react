import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { useAdminAuth } from "@/context/AdminAuthContext";

enum EntryMode {
  Choose,
  TeamMember,
  Admin,
}

enum TeamMemberAuthMode {
  Login = "Login",
  Signup = "Sign Up",
}

import HomeStreakBanner from "@/components/HomeStreakBanner";
import AuthModeChooser from "@/components/AuthModeChooser";
import TeamMemberAuthCard from "@/components/TeamMemberAuthCard";
import AdminAuthCard from "@/components/AdminAuthCard";

export default function Index() {
  // Move useAdminAuth hook usage to the top so `admin` is initialized before use
  const { admin, login: adminLogin } = useAdminAuth();

  const [entryMode, setEntryMode] = useState<EntryMode>(EntryMode.Choose);
  // TEAM MEMBER AUTH
  const [tmMode, setTmMode] = useState<TeamMemberAuthMode>(TeamMemberAuthMode.Login);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const { user, profile, loading } = useUser();
  const navigate = useNavigate();

  // --- Attendance streak state ---
  const [attendanceStreak, setAttendanceStreak] = useState<number | "N/A" | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // --- Routing refactor: only admins are redirected away from "/" (home) page ---
  React.useEffect(() => {
    if (admin) {
      navigate("/admin");
    }
    // For team members: don't navigate to "/standups" automatically!
    // They will see streak/motivation here at "/"
  }, [admin, navigate]);

  // Fetch and calculate attendance streak for logged-in users (not admin)
  useEffect(() => {
    async function fetchStreak() {
      if (!user || !profile) {
        setAttendanceStreak(null);
        return;
      }
      setAttendanceLoading(true);

      // Fetch user's attendance records, sorted descending by standup date
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

      // Transform and filter for present streak
      // Sort records by scheduled_at descending
      const sortedAtt = data
        .map((att: any) => ({
          status: att.status,
          scheduled_at: att.standups?.scheduled_at,
        }))
        .filter((att: any) => att.scheduled_at)
        .sort((a: any, b: any) => (a.scheduled_at > b.scheduled_at ? -1 : 1));

      // Calculate the current consecutive present streak (most recent backwards)
      let streak = 0;
      for (let i = 0; i < sortedAtt.length; i++) {
        if (sortedAtt[i].status === "Present") {
          if (i === 0) {
            streak = 1;
          } else {
            // Check if the previous record is yesterday
            const prevDate = new Date(sortedAtt[i - 1].scheduled_at);
            const currDate = new Date(sortedAtt[i].scheduled_at);
            const diff = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
              streak += 1;
            } else {
              break; // Not consecutive
            }
          }
        } else {
          if (i === 0) {
            // Only break the streak at first missed record
            break;
          } else {
            break;
          }
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

  // --- Handlers ---

  // After login/signup, just reload to let onAuthStateChange trigger
  const handleTeamMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadingForm(true);
    if (tmMode === TeamMemberAuthMode.Login) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      // Don't navigate here; let useUser's effect respond
    } else {
      const redirectUrl = `${window.location.origin}/`; // Home, not standups
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: redirectUrl,
        }
      });
      if (error) setError(error.message);
      else setError("Check your inbox for confirmation.");
    }
    setLoadingForm(false);
  };

  const handleGoogleLogin = async () => {
    setLoadingForm(true);
    setError(null);
    const redirectTo = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });
    if (error) setError(error.message);
    setLoadingForm(false);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    if (!adminLogin(adminEmail, adminPassword)) {
      setAdminError("Invalid credentials");
    }
  };

  // When logged in (user+profile) or admin, show streak banner
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm">
          {(user && profile) || admin ? (
            <HomeStreakBanner
              attendanceStreak={attendanceStreak}
              attendanceLoading={attendanceLoading}
              isAdmin={!!admin}
            />
          ) : null}
          {entryMode === EntryMode.Choose && (
            <AuthModeChooser
              onChoose={(choice) =>
                setEntryMode(choice === "TeamMember" ? EntryMode.TeamMember : EntryMode.Admin)
              }
            />
          )}
          {entryMode === EntryMode.TeamMember && (
            <TeamMemberAuthCard
              mode={tmMode}
              email={email}
              setEmail={setEmail}
              name={name}
              setName={setName}
              password={password}
              setPassword={setPassword}
              error={error}
              loadingForm={loadingForm}
              onSubmit={handleTeamMemberSubmit}
              onGoogle={handleGoogleLogin}
              onSwitchMode={() =>
                setTmMode(
                  tmMode === TeamMemberAuthMode.Login
                    ? TeamMemberAuthMode.Signup
                    : TeamMemberAuthMode.Login
                )
              }
              onBack={() => setEntryMode(EntryMode.Choose)}
            />
          )}
          {entryMode === EntryMode.Admin && (
            <AdminAuthCard
              adminEmail={adminEmail}
              setAdminEmail={setAdminEmail}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              adminError={adminError}
              onSubmit={handleAdminSubmit}
              onBack={() => setEntryMode(EntryMode.Choose)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
