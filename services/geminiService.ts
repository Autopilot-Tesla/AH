import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

// Helper to get key safely
const getApiKey = () => process.env.API_KEY || '';

export const generateAIResponse = async (
  prompt: string, 
  channelName: string, 
  history: Message[]
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "Error: No API Key configured. Please set process.env.API_KEY.";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Construct a bit of context based on the channel
  let systemInstruction = "You are a helpful AI assistant in a Discord-like chat environment.";
  
  if (channelName === 'memes') {
    systemInstruction += " Be funny, post short jokes, and use internet slang.";
  } else if (channelName === 'coding-help') {
    systemInstruction += " You are an expert senior software engineer. Provide code blocks and technical explanations.";
  } else if (channelName === 'welcome') {
    systemInstruction += " You are the server greeter. Be very enthusiastic and welcoming.";
  }

  // Convert last few messages to history for context (simplified)
  // In a real app we would map roles correctly, here we just dump recent text
  const recentContext = history.slice(-5).map(m => `${m.author.username}: ${m.content}`).join('\n');
  const fullPrompt = `${systemInstruction}\n\nRecent Chat History:\n${recentContext}\n\nCurrent User: ${prompt}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
    });

    return response.text || "I'm speechless!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I had trouble connecting to the mainframe. (API Error)";
  }
};