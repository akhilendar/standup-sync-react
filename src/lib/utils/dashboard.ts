import type { StudentFeedback, DashboardMetrics, ChartData, ViewMode } from "../types";
import { isWithinInterval } from "date-fns";

export function filterDataByDateRange(
  data: StudentFeedback[],
  selectedDate: { start: Date; end: Date }
): StudentFeedback[] {
  return data.filter((item) => {
    try {
      if (selectedDate.start === selectedDate.end) {
        const [month, day, year] = item.date.split("/");
        const itemDate = new Date(Number(year), Number(month) - 1, Number(day));
        console.log("Item Date:", itemDate);
        return itemDate.getTime() === selectedDate.start.getTime();
      }
      const [month, day, year] = item.date.split("/");
      const itemDate = new Date(Number(year), Number(month) - 1, Number(day));
      return isWithinInterval(itemDate, {
        start: selectedDate.start,
        end: selectedDate.end,
      });
    } catch {
      return false;
    }
  });
}

export function calculateMetrics(data: StudentFeedback[]): DashboardMetrics {
  if (data.length === 0) {
    return {
      avgStudentUnderstanding: 0,
      avgInstructorRating: 0,
      totalFeedbacks: 0,
      positivePoints: [],
      improvementPoints: [],
    };
  }

  const avgStudentUnderstanding = data.reduce((sum, item) => sum + item.studentUnderstandingRating, 0) / data.length;
  const avgInstructorRating = data.reduce((sum, item) => sum + item.instructorRating, 0) / data.length;

  return {
    avgStudentUnderstanding: Math.round(avgStudentUnderstanding * 10) / 10,
    avgInstructorRating: Math.round(avgInstructorRating * 10) / 10,
    totalFeedbacks: data.length,
    positivePoints: [],
    improvementPoints: [],
  };
}

export function prepareChartData(data: StudentFeedback[]): ChartData[] {
  const groupedData = data.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) {
      acc[date] = {
        studentUnderstanding: [],
        instructorRating: [],
      };
    }
    acc[date].studentUnderstanding.push(item.studentUnderstandingRating);
    acc[date].instructorRating.push(item.instructorRating);
    return acc;
  }, {} as Record<string, { studentUnderstanding: number[]; instructorRating: number[] }>);

  return Object.entries(groupedData)
    .map(([date, ratings]) => {
      const avgUnderstanding =
        ratings.studentUnderstanding.reduce((a, b) => a + b, 0) / ratings.studentUnderstanding.length;
      const avgInstructor = ratings.instructorRating.reduce((a, b) => a + b, 0) / ratings.instructorRating.length;

      return {
        date,
        studentUnderstanding: Math.round(avgUnderstanding * 10) / 10,
        instructorRating: Math.round(avgInstructor * 10) / 10,
      };
    })
    .sort((a, b) => {
      const [monthA, dayA, yearA] = a.date.split("/").map(Number);
      const [monthB, dayB, yearB] = b.date.split("/").map(Number);
      return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
    });
}
