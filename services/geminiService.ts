import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, TradeDirection } from "../types";

// Initialize Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-3-flash-preview as it supports multimodal input (images), JSON schema output, and googleSearch grounding
const ANALYSIS_MODEL = "gemini-3-flash-preview";

/**
 * Converts a File object to a Base64 string.
 */
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
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
  try {
    const imagePart15m = await fileToGenerativePart(file15m);
    const imagePart1h = await fileToGenerativePart(file1h);

    const prompt = `
      You are an expert crypto technical analyst. 
      Analyze these two chart screenshots for the token ${token}. 
      Image 1 is the 15-minute timeframe. Image 2 is the 1-hour timeframe.
      
      Focus specifically on the MACD (12, 26, 9) indicator.
      
      **Trading Rules:**
      1. Identify the current market trend (Up/Down/Sideways).
      2. Check if the MACD is in the "Second Half Red Zone". This is defined as:
         - The MACD histogram is negative (red).
         - The histogram bars are receding (getting shorter/lighter color) indicating bearish momentum is fading and a bullish crossover might be approaching.
      3. If the MACD enters this "Second Half Red Zone" on either timeframe (prioritize 1H for major trend, 15m for entry), recommend a LONG position.
      4. If the MACD is clearly positive and expanding, the trend is up.
      5. If the MACD is negative and expanding (dark red), the trend is strongly down (avoid long).

      **Output Requirements:**
      Provide a JSON object with the following fields:
      - trend: A brief statement of the market trend.
      - direction: "Long", "Short", or "Wait".
      - entryPrice: Specific entry price suggestion based on the chart's current price action.
      - targetPrice: A realistic target price based on recent resistance.
      - pnlProjection: Estimated Profit/Loss ratio or percentage gain.
      - rationale: A concise explanation referencing the MACD status on both 15m and 1h charts. Mention if there is a conflict.
      - confidence: "High", "Medium", or "Low" based on image clarity and indicator alignment.

      Return ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: {
        parts: [
          imagePart15m, 
          imagePart1h, 
          { text: prompt }
        ]
      },
      config: {
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

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text);

    // Map string direction to Enum
    let directionEnum = TradeDirection.WAIT;
    if (result.direction === 'Long') directionEnum = TradeDirection.LONG;
    if (result.direction === 'Short') directionEnum = TradeDirection.SHORT;

    return {
      ...result,
      direction: directionEnum,
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error("Failed to analyze charts. Please ensure images are clear.");
  }
};

export interface SentimentAnalysis {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  sources: { title: string; uri: string }[];
}

export const fetchMarketSentiment = async (): Promise<SentimentAnalysis> => {
  try {
    const prompt = `
      Search for and analyze the current crypto market sentiment as of today.
      Specifically look for recent updates from:
      1. Thuan Capital X (Twitter) channel (@ThuanCapital).
      2. CoinMarketCap Fear & Greed Index and market news.
      3. CoinGecko global market cap trends.
      
      Based on these, determine if the overall sentiment is "Bullish", "Bearish", or "Neutral".
      Provide a brief 2-3 sentence summary of the findings.
      
      Format your response as a JSON object:
      {
        "sentiment": "Bullish" | "Bearish" | "Neutral",
        "summary": "..."
      }
    `;

    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
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

    const result = JSON.parse(response.text || '{}');
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter(chunk => chunk.web)
      ?.map(chunk => ({
        title: chunk.web?.title || 'Source',
        uri: chunk.web?.uri || '#'
      })) || [];

    return {
      sentiment: result.sentiment || 'Neutral',
      summary: result.summary || 'Unable to determine current sentiment.',
      sources: sources.slice(0, 5) // Top 5 sources
    };
  } catch (error) {
    console.error("Sentiment Fetch Failed:", error);
    return {
      sentiment: 'Neutral',
      summary: 'Error fetching real-time sentiment data.',
      sources: []
    };
  }
};
