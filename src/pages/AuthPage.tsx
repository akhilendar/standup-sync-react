
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AppNavbar from "@/components/AppNavbar";
import { useUser } from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

enum Mode {
  Login = "Login",
  Signup = "Sign Up",
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>(Mode.Login);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadingForm(true);
    if (mode === Mode.Login) {
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
          emailRedirectTo: redirectUrl
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNavbar />
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-sm mx-auto">
          <CardHeader>
            <CardTitle>{mode === Mode.Login ? "Login" : "Sign Up"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
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
                {mode === Mode.Signup && (
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
                  autoComplete={
                    mode === Mode.Login ? "current-password" : "new-password"
                  }
                />
                {error && <div className="text-sm text-red-500">{error}</div>}
                <Button type="submit" className="w-full mt-2" disabled={loadingForm}>
                  {loadingForm ? "Loading..." : (mode === Mode.Login ? "Login" : "Sign Up")}
                </Button>
                <div className="flex justify-center text-sm pt-3">
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setMode(mode === Mode.Login ? Mode.Signup : Mode.Login)}
                  >
                    {mode === Mode.Login
                      ? "Don't have an account? Sign up"
                      : "Already have an account? Login"}
                  </button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
