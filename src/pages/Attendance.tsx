
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Attendance() {
  return (
    <div className="max-w-xl mx-auto my-10">
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
  );
}
