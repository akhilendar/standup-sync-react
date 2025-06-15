
// New home page that offers option for Admin or Team Member login/signup

import React, { useState } from "react";
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

  React.useEffect(() => {
    if (user && profile) {
      navigate("/standups");
    }
  }, [user, profile, navigate]);

  // ADMIN AUTH
  const { admin, login: adminLogin } = useAdminAuth();
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);

  React.useEffect(() => {
    if (admin) navigate("/admin");
  }, [admin, navigate]);

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
