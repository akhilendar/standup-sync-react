
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AppNavbar from "@/components/AppNavbar";
import { useUser } from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";

export default function Standups() {
  const { loading, profile } = useUser();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !profile) {
      navigate("/auth");
    }
  }, [loading, profile, navigate]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppNavbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNavbar />
      <div className="max-w-xl mx-auto my-10 flex-1 flex items-center">
        <Card>
          <CardHeader>
            <CardTitle>Standups</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-muted-foreground">Welcome, {profile.name}! Your role: {profile.role}.</p>
              <p className="text-muted-foreground mt-2">Standup scheduling and logs will appear here soon.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
