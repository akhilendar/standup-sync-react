
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AppNavbar from "@/components/AppNavbar";

export default function Attendance() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNavbar />
      <div className="max-w-xl mx-auto my-10 flex-1 flex items-center">
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-muted-foreground">Attendance tracking coming soon.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
