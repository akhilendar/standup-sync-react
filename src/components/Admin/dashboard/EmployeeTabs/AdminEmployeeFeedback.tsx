"use client";

import { useState, useEffect } from "react";
import type { StudentFeedback, DashboardMetrics, ChartData, ViewMode, AIAnalysisResponse } from "@/lib/types";
import { filterDataByDateRange, calculateMetrics, prepareChartData } from "@/lib/utils/dashboard";
import { analyzeStudentRemarks } from "@/hooks/aiAnalysisService";
import { fetchFeedbackData } from "@/hooks/useGoogleSheets";
import { MetricsTiles } from "@/components/Admin/dashboard/MetricTiles";
import { InsightsCards } from "@/components/Admin/dashboard/InsightsCards";
import { Charts } from "@/components/Admin/dashboard/Charts";
import { DateControls } from "@/components/Admin/dashboard/DateControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { endOfToday, startOfToday } from "date-fns";

export default function AdminEmployeeFeedback({ sheet }: { sheet: string }) {
  const [feedbackData, setFeedbackData] = useState<StudentFeedback[]>([]);
  const [filteredData, setFilteredData] = useState<StudentFeedback[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    avgStudentUnderstanding: 0,
    avgInstructorRating: 0,
    totalFeedbacks: 0,
    positivePoints: [],
    improvementPoints: [],
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfToday(),
    end: endOfToday(),
  });
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<AIAnalysisResponse>({
    positivePoints: [],
    improvementPoints: [],
  });
  const [sentimentData, setSentimentData] = useState([
    { name: "Positive", value: 0, color: "#10b981" },
    { name: "Neutral", value: 0, color: "#f59e0b" },
    { name: "Negative", value: 0, color: "#ef4444" },
  ]);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to fetch from Google Sheets, fallback to mock data
        let data = await fetchFeedbackData(sheet);

        // If no data from API, use mock data
        if (data.length === 0) {
          data = [
            {
              id: "1",
              date: "15/01/2024",
              time: "10:00",
              studentUnderstandingRating: 4,
              instructorRating: 5,
              studentRemark: "Great explanation of complex topics. Very engaging!",
            },
            {
              id: "2",
              date: "16/01/2024",
              time: "10:00",
              studentUnderstandingRating: 3,
              instructorRating: 4,
              studentRemark: "Good session but could use more examples",
            },
            {
              id: "3",
              date: "17/01/2024",
              time: "10:00",
              studentUnderstandingRating: 5,
              instructorRating: 5,
              studentRemark: "Excellent teaching style, very clear and helpful",
            },
            {
              id: "4",
              date: "18/01/2024",
              time: "10:00",
              studentUnderstandingRating: 4,
              instructorRating: 4,
              studentRemark: "Interactive session, would like more practice time",
            },
          ];
        }

        setFeedbackData(data);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Process data when filters change
  useEffect(() => {
    if (feedbackData.length > 0) {
      const filtered = filterDataByDateRange(feedbackData, selectedDateRange);

      const filteredSorted = [...filtered].sort((a, b) => {
        const aParts = a.date.split("/"); // MM/DD/YYYY
        const bParts = b.date.split("/");

        const aDate = new Date(`${aParts[2]}-${aParts[0].padStart(2, "0")}-${aParts[1].padStart(2, "0")}T${a.time}`);
        const bDate = new Date(`${bParts[2]}-${bParts[0].padStart(2, "0")}-${bParts[1].padStart(2, "0")}T${b.time}`);

        return bDate.getTime() - aDate.getTime(); // Ascending
      });

      setFilteredData(filteredSorted);

      const calculatedMetrics = calculateMetrics(filtered);
      setMetrics(calculatedMetrics);

      const preparedChartData = prepareChartData(filtered);
      setChartData(preparedChartData);

      // Analyze remarks with AI
      analyzeStudentRemarks(filteredSorted).then((insights) => {
        setAiInsights({ positivePoints: insights.positivePoints, improvementPoints: insights.improvementPoints });
        setSentimentData([
          { name: "Positive", value: insights.sentimentSummary?.positiveCount || 0, color: "#10b981" },
          { name: "Neutral", value: insights.sentimentSummary?.neutralCount || 0, color: "#f59e0b" },
          { name: "Negative", value: insights.sentimentSummary?.negativeCount || 0, color: "#ef4444" },
        ]);
      });
    }
  }, [feedbackData, selectedDateRange, viewMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-10 p-4 md:p-8 pt-6">
      <div className="flex items-end justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Feedback Dashboard</h2>
        <DateControls
          selectedDateRange={selectedDateRange}
          onDateChange={(range) => setSelectedDateRange(range)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      <div className="space-y-4">
        <MetricsTiles metrics={metrics} />

        <InsightsCards positivePoints={aiInsights.positivePoints} improvementPoints={aiInsights.improvementPoints} />

        <Charts chartData={chartData} sentimentData={sentimentData} />

        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredData.slice(0, 5).map((feedback) => (
                <div key={feedback.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {feedback.date} at {feedback.time}
                    </span>
                    <div className="flex gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Understanding: {feedback.studentUnderstandingRating}/5
                      </span>
                      <span className={cn("text-xs bg-green-100 text-green-800 px-2 py-1 rounded")}>
                        Instructor: {feedback.instructorRating}/5
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{feedback.studentRemark}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
