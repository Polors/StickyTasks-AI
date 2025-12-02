import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Uses Gemini to break down a high-level task into smaller, actionable steps.
 */
export const breakDownTaskWithGemini = async (taskDescription: string): Promise<string[]> => {
  try {
    const ai = getClient();
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `I have a goal or task: "${taskDescription}". Please break this down into 3 to 6 distinct, actionable, and short todo items.`,
      config: {
        systemInstruction: "You are a helpful productivity assistant. You keep tasks concise (under 10 words).",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "A list of actionable subtasks."
            }
          },
          required: ["tasks"]
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const json = JSON.parse(text);
    return json.tasks || [];

  } catch (error) {
    console.error("Error breaking down task with Gemini:", error);
    // Fallback or re-throw depending on UI needs
    throw error;
  }
};
