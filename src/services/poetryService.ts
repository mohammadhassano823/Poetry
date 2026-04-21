import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface PoetryAnalysis {
  originalPoem: string;
  translation?: string;
  explanation: string;
  wordDictionary: { word: string; meaning: string; translation?: string; pronunciation?: string }[];
  poet: {
    name: string;
    era: string;
    bio: string;
    whyForm: string;
    wikipediaLink?: string;
  };
  themes: string[];
  literaryDevices: { device: string; example: string; meaning: string }[];
  sources: string[];
}

export async function explainPoetry(poem: string, targetLanguage: string = "English"): Promise<PoetryAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following poem. Provide a detailed explanation, translation to ${targetLanguage} (if the poem is not in ${targetLanguage}), word dictionary for difficult words (including pronunciation if possible), context about the poet (era, bio, why they chose this form), themes, literary devices, and potential study sources.

Poem:
${poem}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          originalPoem: { type: Type.STRING },
          translation: { type: Type.STRING },
          explanation: { type: Type.STRING },
          wordDictionary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                meaning: { type: Type.STRING },
                translation: { type: Type.STRING },
                pronunciation: { type: Type.STRING }
              },
              required: ["word", "meaning"]
            }
          },
          poet: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              era: { type: Type.STRING },
              bio: { type: Type.STRING },
              whyForm: { type: Type.STRING },
              wikipediaLink: { type: Type.STRING }
            },
            required: ["name", "era", "bio", "whyForm"]
          },
          themes: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          literaryDevices: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                device: { type: Type.STRING },
                example: { type: Type.STRING },
                meaning: { type: Type.STRING }
              },
              required: ["device", "example", "meaning"]
            }
          },
          sources: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["originalPoem", "explanation", "wordDictionary", "poet", "themes", "literaryDevices", "sources"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function chatAboutPoetry(poem: string, history: { role: 'user' | 'model', text: string }[], message: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are an expert poetry guide. The user is asking questions about the following poem:
      
      ${poem}
      
      Be insightful, encouraging, and academic yet accessible. Use literary terms where appropriate.`
    }
  });

  // Convert history to GenAI format
  const chatHistory = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }]
  }));

  const response = await chat.sendMessage({
    message: message
  });

  return response.text;
}
