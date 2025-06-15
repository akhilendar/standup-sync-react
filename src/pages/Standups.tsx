
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AppNavbar from "@/components/AppNavbar";
import { useUser } from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Standups() {
  const { loading, profile } = useUser();
  const navigate = useNavigate();
  const [nextStandup, setNextStandup] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading && !profile) {
      navigate("/auth");
    }
  }, [loading, profile, navigate]);

  React.useEffect(() => {
    async function fetchNextStandup() {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("standups")
        .select("scheduled_at")
        .gte("scheduled_at", today)
        .order("scheduled_at", { ascending: true })
        .limit(1);
      if (data && data[0]) {
        setNextStandup(data[0].scheduled_at);
      } else {
        setNextStandup(null);
      }
    }
    fetchNextStandup();
  }, []);

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
              <p className="text-muted-foreground">
                Welcome, {profile.name}! Your role: {profile.role}.
              </p>
              <p className="text-muted-foreground mt-2">
                Standup scheduling and logs will appear here soon.
              </p>
              <div className="mt-4">
                {nextStandup ? (
                  <div>
                    <span className="font-semibold">Next Standup:</span>{" "}
                    {nextStandup}
                  </div>
                ) : (
                  <span className="text-muted-foreground">No upcoming standups scheduled.</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
