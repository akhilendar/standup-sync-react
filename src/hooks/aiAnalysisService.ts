import { GoogleGenAI } from "@google/genai";
import type { StudentFeedback, AIAnalysisResponse } from "@/lib/types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

function extractJsonFromCodeBlock(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return match ? match[1] : text;
}

export async function analyzeStudentRemarks(feedbacks: StudentFeedback[]): Promise<AIAnalysisResponse> {
  const remarks = feedbacks.map((f) => f.studentRemark).filter(Boolean);
  if (remarks.length === 0) return { positivePoints: [], improvementPoints: [] };

  const prompt = `Analyze the following student feedback remarks and extract:
1. Top 3 positive points about the instructor
2. Top 3 improvement suggestions

Improvement suggestions should be actionable and specific. Avoid generic responses like "nothing to improve". If no direct suggestions are mentioned, infer areas of improvement based on tone or content.

Also, analyze the sentiment of the feedback:
- Classify each remark as "positive", "neutral", or "negative"
- Count how many remarks fall into each category
- If there are no remarks for some feedback, assume it as a neutral sentiment

Return the response strictly in JSON format using the following structure:

{
  "positivePoints": [string, string, string],
  "improvementPoints": [string, string, string],
  "sentimentSummary": {
    "positiveCount": number,
    "neutralCount": number,
    "negativeCount": number,
  }
}

Student Remarks:
${remarks.join("\n---\n")}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
    });

    const text = extractJsonFromCodeBlock(response.text);
    try {
      const parsedResponse: AIAnalysisResponse = JSON.parse(text);

      return {
        improvementPoints: parsedResponse.improvementPoints,
        positivePoints: parsedResponse.positivePoints,
        sentimentSummary: parsedResponse.sentimentSummary || {
          positiveCount: 0,
          neutralCount: 0,
          negativeCount: 0,
        },
      };
    } catch {
      console.warn("Non-JSON response from Gemini, using fallback.");
    }
  } catch (err) {
    console.error("Gemini SDK error:", err);
  }

  // Fallback defaults
  return {
    positivePoints: ["Engaging teaching style", "Clear explanations", "Helpful examples"],
    improvementPoints: ["More interactive sessions", "Better time management", "Additional practice materials"],
    sentimentSummary: {
      positiveCount: 0,
      neutralCount: 0,
      negativeCount: 0,
    },
  };
}
