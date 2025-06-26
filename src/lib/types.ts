export interface StudentFeedback {
  id: string;
  date: string;
  time: string;
  studentUnderstandingRating: number;
  instructorRating: number;
  studentRemark: string;
  aiSummary?: {
    sentiment: "positive" | "neutral" | "negative";
    themes: string[];
    category: "positive" | "improvement";
  };
}

export interface DashboardMetrics {
  avgStudentUnderstanding: number;
  avgInstructorRating: number;
  totalFeedbacks: number;
  positivePoints: string[];
  improvementPoints: string[];
}

export interface ChartData {
  date: string;
  studentUnderstanding: number;
  instructorRating: number;
}

export type ViewMode = "week" | "month" | "day";

export interface AIAnalysisResponse {
  positivePoints: string[];
  improvementPoints: string[];
  sentimentSummary?: {
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
  };
}
