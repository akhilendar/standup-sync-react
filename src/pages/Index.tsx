
import React, { useState } from "react";
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
