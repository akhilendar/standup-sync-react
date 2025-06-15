
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Standups() {
  return (
    <div className="max-w-xl mx-auto my-10">
      <Card>
        <CardHeader>
          <CardTitle>Standups</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-muted-foreground">Standup scheduling and logs will appear here soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
