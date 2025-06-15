import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppNavbar from "@/components/AppNavbar";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { admin, login } = useAdminAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (admin) navigate("/admin");
  }, [admin, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!login(email, password)) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNavbar />
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-sm mx-auto">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Admin username"
                  required
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
                {error && <div className="text-sm text-red-500">{error}</div>}
                <Button type="submit" className="w-full mt-2">Login</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
