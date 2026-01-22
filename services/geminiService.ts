import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, TradeDirection } from "../types";

// 1. Vite/Vercel uses import.meta.env instead of process.env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

// 2. 2026 Standard: Using Gemini 2.0 Flash for superior speed and JSON reliability
const ANALYSIS_MODEL = "gemini-2.0-flash"; 

/**
 * HELPER: Exponential Backoff Retry Wrapper
 * Automatically retries requests if a 429 (Rate Limit) error occurs.
 */
async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error.message?.includes("429") || error.status === 429;
    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2); // Double the wait time
    }
    throw error;
  }
}

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: { data: base64String, mimeType: file.type },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeCharts = async (
  file15m: File,
  file1h: File,
  token: string
): Promise<AnalysisResult> => {
  return fetchWithRetry(async () => {
    const imagePart15m = await fileToGenerativePart(file15m);
    const imagePart1h = await fileToGenerativePart(file1h);

    const prompt = `
      You are an expert crypto analyst. Analyze these two chart screenshots for ${token}. 
      Image 1: 15m timeframe. Image 2: 1h timeframe.
      
      Focus: MACD (12, 26, 9) "Second Half Red Zone" (Receding red bars).
      Rule: Recommend LONG if 1H trend confirms or 15m shows bullish momentum receding from red.
      
      Return valid JSON only.
    `;

    const model = ai.getGenerativeModel({ model: ANALYSIS_MODEL });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [imagePart15m, imagePart1h, { text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trend: { type: Type.STRING },
            direction: { type: Type.STRING, enum: ["Long", "Short", "Wait"] },
            entryPrice: { type: Type.STRING },
            targetPrice: { type: Type.STRING },
            pnlProjection: { type: Type.STRING },
            rationale: { type: Type.STRING },
            confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
          },
          required: ["trend", "direction", "entryPrice", "targetPrice", "pnlProjection", "rationale", "confidence"]
        }
      }
    });

    const data = JSON.parse(result.response.text());
    
    // Map direction to Enum
    const directionMap: Record<string, TradeDirection> = {
      "Long": TradeDirection.LONG,
      "Short": TradeDirection.SHORT,
      "Wait": TradeDirection.WAIT
    };

    return { ...data, direction: directionMap[data.direction] || TradeDirection.WAIT };
  });
};

export interface SentimentAnalysis {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  sources: { title: string; uri: string }[];
}

export const fetchMarketSentiment = async (): Promise<SentimentAnalysis> => {
  return fetchWithRetry(async () => {
    const prompt = `Analyze current crypto market sentiment (Thuan Capital, CMC, CoinGecko). Determine if Bullish, Bearish, or Neutral.`;

    const model = ai.getGenerativeModel({ model: ANALYSIS_MODEL });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} } as any],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
            summary: { type: Type.STRING }
          },
          required: ["sentiment", "summary"]
        }
      }
    });

    const responseData = JSON.parse(result.response.text());
    const metadata = result.response.candidates?.[0]?.groundingMetadata;
    
    const sources = metadata?.groundingChunks
      ?.filter((chunk: any) => chunk.web)
      ?.map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      })) || [];

    return {
      sentiment: responseData.sentiment,
      summary: responseData.summary,
      sources: sources.slice(0, 5)
    };
  });
};
