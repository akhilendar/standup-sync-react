import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";
import HomeStreakBanner from "@/components/HomeStreakBanner";
import AuthModeChooser from "@/components/AuthModeChooser";
import TeamMemberAuthCard from "@/components/TeamMemberAuthCard";
import AdminAuthCard from "@/components/AdminAuthCard";
import { useAttendanceStreak } from "@/hooks/useAttendanceStreak";
import { supabase } from "@/integrations/supabase/client";
import AppNavbar from "@/components/AppNavbar";

enum EntryMode {
  Choose,
  TeamMember,
  Admin,
}
enum TeamMemberAuthMode {
  Login = "Login",
  Signup = "Sign Up",
}

export default function Index() {
  // Admin authentication state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);

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

  // New: Use attendance streak hook
  const { attendanceStreak, attendanceLoading } = useAttendanceStreak();

  // New: Check if standup is scheduled for today
  const [standupScheduled, setStandupScheduled] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if standup is scheduled for today
    async function checkTodayStandup() {
      const todayStr = new Date().toISOString().slice(0, 10);
      const { data: standup } = await supabase
        .from("standups")
        .select("*")
        .gte("scheduled_at", todayStr + "T00:00:00.000Z")
        .lt("scheduled_at", todayStr + "T23:59:59.999Z")
        .order("scheduled_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setStandupScheduled(!!standup);
    }
    checkTodayStandup();
  }, []);

  // --- Routing refactor: only admins are redirected away from "/" (home) page ---
  React.useEffect(() => {
    if (admin) {
      navigate("/admin");
    }
    // Do NOT redirect team members before profile/session is done loading
  }, [admin, navigate]);

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
      const redirectUrl = `${window.location.origin}/`;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-lg font-semibold text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  // CASE: Logged in user OR admin
  if ((user && profile) || admin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            {!standupScheduled && standupScheduled !== null ? (
              <div className="mb-7 text-center bg-orange-50 border border-orange-200 text-orange-700 rounded-lg p-5">
                <div className="font-bold mb-2">Standup is not done for today.</div>
                <div className="mb-4">Let's schedule one now!</div>
                <button
                  className="btn-style py-2 px-6 text-base rounded"
                  onClick={() => window.location.href = "/standups"}
                >
                  Go to Standup Page
                </button>
              </div>
            ) : null}
            <HomeStreakBanner
              attendanceStreak={attendanceStreak}
              attendanceLoading={attendanceLoading}
              isAdmin={!!admin}
            />
          </div>
        </div>
      </div>
    );
  }

  // Default: not logged in
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm">
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
