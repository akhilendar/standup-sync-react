import type { StudentFeedback } from "@/lib/types";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Helper to extract sheet ID from full URL
function extractSheetId(sheetUrlOrId: string): string {
  const match = sheetUrlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : sheetUrlOrId; // If it's already an ID
}

export async function fetchFeedbackData(
  sheetUrlOrId: string,
  range: string = "Sheet1!A:D" // Default range covering the 4 columns mentioned
): Promise<StudentFeedback[]> {
  const SHEET_ID = extractSheetId(sheetUrlOrId);

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch data from Google Sheets");
    }

    const data = await response.json();
    const rows = data.values || [];

    // Skip header row
    const feedbackData = rows.slice(1).map((row: string[], index: number) => {
      const [timestamp, understanding, instructor, remark] = row;

      const [date, time] = (timestamp || "").split(" ");

      return {
        id: `feedback-${index}`,
        date: date || "",
        time: time || "",
        studentUnderstandingRating: Number.parseInt(understanding) || 0,
        instructorRating: Number.parseInt(instructor) || 0,
        studentRemark: remark || "",
      };
    });

    return feedbackData;
  } catch (error) {
    console.error("Error fetching dynamic sheet data:", error);
    return [];
  }
}
