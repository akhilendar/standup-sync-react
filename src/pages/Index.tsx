// New home page that offers option for Admin or Team Member login/signup

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

  React.useEffect(() => {
    if ((user && profile) || admin) {
      navigate("/standups");
    }
  }, [user, profile, admin, navigate]);

  // ADMIN AUTH
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);

  React.useEffect(() => {
    if (admin) navigate("/admin");
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

  // Handlers
  const handleTeamMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadingForm(true);
    if (tmMode === TeamMemberAuthMode.Login) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      // On signup, pass name to user_metadata for trigger
      const redirectUrl = `${window.location.origin}/standups`;
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
    const redirectTo = `${window.location.origin}/standups`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo
      }
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm">
          {/* Show attendance streak at the top for logged in users */}
          {(user && profile) || admin ? (
            <div className="mb-6">
              <div className="text-lg font-semibold text-center flex flex-col gap-1">
                <span>Your Attendance Streak:</span>
                <span className="text-3xl font-bold text-primary">
                  {attendanceLoading
                    ? "Loading..."
                    : attendanceStreak !== null
                    ? attendanceStreak
                    : "--"}
                  {attendanceStreak !== "N/A" && attendanceStreak !== null && typeof attendanceStreak === "number" ? (
                    <span className="text-base font-medium ml-1">day{attendanceStreak === 1 ? "" : "s"}</span>
                  ) : (
                    ""
                  )}
                </span>
              </div>
            </div>
          ) : null}

          {entryMode === EntryMode.Choose && (
            <div className="space-y-6 text-center">
              <h1 className="text-3xl font-bold mb-4">Welcome to Your Attendance Tracker</h1>
              <div className="space-y-2">
                <Button className="w-full h-12 text-lg" onClick={() => setEntryMode(EntryMode.TeamMember)}>Team Member</Button>
                <Button className="w-full h-12 text-lg" variant="outline" onClick={() => setEntryMode(EntryMode.Admin)}>Admin</Button>
              </div>
            </div>
          )}

          {entryMode === EntryMode.TeamMember && (
            <Card>
              <CardHeader>
                <CardTitle>{tmMode === TeamMemberAuthMode.Login ? "Team Member Login" : "Team Member Sign Up"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTeamMemberSubmit}>
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full flex gap-2 items-center justify-center"
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loadingForm}
                    >
                      <FcGoogle className="text-xl" />
                      {loadingForm ? "Signing in..." : "Sign in with Google"}
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="border-b grow border-muted-foreground/10"></span>
                      <span className="text-xs text-muted-foreground">or</span>
                      <span className="border-b grow border-muted-foreground/10"></span>
                    </div>
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Email"
                      required
                      autoComplete="username"
                    />
                    {tmMode === TeamMemberAuthMode.Signup && (
                      <Input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Full Name"
                        required
                        autoComplete="name"
                      />
                    )}
                    <Input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      autoComplete={tmMode === TeamMemberAuthMode.Login ? "current-password" : "new-password"}
                    />
                    {error && <div className="text-sm text-red-500">{error}</div>}
                    <Button type="submit" className="w-full mt-2" disabled={loadingForm}>
                      {loadingForm ? "Loading..." : (tmMode === TeamMemberAuthMode.Login ? "Login" : "Sign Up")}
                    </Button>
                    <div className="flex justify-between text-sm pt-3">
                      <button
                        type="button"
                        className="underline"
                        onClick={() => setTmMode(tmMode === TeamMemberAuthMode.Login ? TeamMemberAuthMode.Signup : TeamMemberAuthMode.Login)}
                      >
                        {tmMode === TeamMemberAuthMode.Login
                          ? "Don't have an account? Sign up"
                          : "Already have an account? Login"}
                      </button>
                      <button
                        type="button"
                        className="underline"
                        onClick={() => setEntryMode(EntryMode.Choose)}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {entryMode === EntryMode.Admin && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminSubmit}>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      placeholder="Admin username"
                      required
                    />
                    <Input
                      type="password"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="Password"
                      required
                    />
                    {adminError && <div className="text-sm text-red-500">{adminError}</div>}
                    <Button type="submit" className="w-full mt-2">Login</Button>
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        className="underline text-sm"
                        onClick={() => setEntryMode(EntryMode.Choose)}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
