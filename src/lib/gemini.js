import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn("⚠️ VITE_GEMINI_API_KEY is not defined in .env");
}

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenerativeAI(apiKey || "dummy-key");

// Configure the model
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: "You are MindWell AI, a compassionate, empathetic, and professional mental wellness companion. Your goal is to listen, support, and guide the user through their emotional journey. Provide short, concise, and helpful responses. Do not provide medical diagnoses. Suggest breathing exercises, journaling, or speaking to a therapist if they are deeply distressed.",
});

// Create a single chat session instance for the session
let chatSession = null;

export async function getGeminiResponse(userMessage, chatHistory = []) {
  try {
    if (!chatSession) {
      // Convert our Supabase history format to Gemini's format
      let history = chatHistory.map((msg) => ({
        role: msg.role === "ai" ? "model" : "user",
        parts: [{ text: msg.text || msg.message || "" }],
      }));

      // Gemini API rule: The first message in history MUST be from the user
      while (history.length > 0 && history[0].role === "model") {
        history.shift();
      }

      chatSession = model.startChat({
        history: history,
      });
    }

    const result = await chatSession.sendMessage(userMessage);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having a little trouble connecting right now, but I'm here for you. Let's take a deep breath together. 💙";
  }
}
