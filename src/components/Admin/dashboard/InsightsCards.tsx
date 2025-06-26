import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, AlertTriangle } from "lucide-react";

interface InsightsCardsProps {
  positivePoints: string[];
  improvementPoints: string[];
}

export function InsightsCards({ positivePoints, improvementPoints }: InsightsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThumbsUp className="h-5 w-5 text-green-600" />
            Top Positive Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {positivePoints.length > 0 ? (
              positivePoints.slice(0, 3).map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm">{point}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">No positive feedback analyzed yet</li>
            )}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Improvement Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {improvementPoints.length > 0 ? (
              improvementPoints.slice(0, 3).map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm">{point}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">No improvement suggestions analyzed yet</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
