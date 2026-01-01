
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { FamilyMember } from "../types";
import mammoth from "mammoth";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FAMILY_EXTRACTION_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      familyGroupIndex: { type: Type.INTEGER, description: "Index to group members of the same household" },
      fullName: { type: Type.STRING },
      nativeName: { type: Type.STRING, description: "Full Name in Hindi/Native Script" },
      gender: { type: Type.STRING, description: "Male or Female" },
      dob: { type: Type.STRING, description: "YYYY-MM-DD format" },
      maritalStatus: { type: Type.STRING, description: "Single, Married, Divorced, or Widowed" },
      relationToHead: { type: Type.STRING },
      isHeadOfFamily: { type: Type.BOOLEAN },
      education: { type: Type.STRING },
      nativeEducation: { type: Type.STRING, description: "Education degree in Hindi/Native script" },
      occupation: { type: Type.STRING },
      nativeOccupation: { type: Type.STRING, description: "Occupation in Hindi/Native script" },
      mobile: { type: Type.STRING },
      nativePlace: { type: Type.STRING, description: "Village name in English" },
      nativeNativePlace: { type: Type.STRING, description: "Village name in Hindi/Native Script" },
      gotra: { type: Type.STRING },
      nativeGotra: { type: Type.STRING, description: "Gotra in Hindi/Native script" },
      currentAddress: {
        type: Type.OBJECT,
        properties: {
          street: { type: Type.STRING },
          city: { type: Type.STRING },
          state: { type: Type.STRING },
          pincode: { type: Type.STRING }
        },
        required: ["city", "state"]
      },
      nativeCurrentAddress: { type: Type.STRING, description: "Complete current address in Hindi/Native script" }
    },
    required: ["fullName", "familyGroupIndex"]
  }
};

/**
 * Robust API call wrapper with exponential backoff for 429/quota errors.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = error?.message || "";
    if (retries > 0 && (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("quota"))) {
      console.warn(`Gemini Quota exceeded. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(res => setTimeout(res, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Highly robust JSON parser designed to heal truncated or malformed AI responses.
 */
function safeJsonParse(text: string): any {
  let cleanText = text.trim();
  
  // Strip Markdown code blocks if present
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleanText);
  } catch (e: any) {
    console.warn("Standard JSON parse failed, attempting deep recovery...", e.message);
    
    // Recovery Step 1: Fix unclosed strings
    // Count quotes. If odd, we probably ended inside a string.
    const quoteCount = (cleanText.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      cleanText += '"';
    }

    // Recovery Step 2: Balance braces and brackets
    const stack: string[] = [];
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      if (char === '{') stack.push('}');
      else if (char === '[') stack.push(']');
      else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }

    // Close remaining open structures in reverse order
    while (stack.length > 0) {
      cleanText += stack.pop();
    }

    try {
      return JSON.parse(cleanText);
    } catch (e2) {
      // Last ditch effort: Try to find the last valid object boundary
      const lastPossibleEnd = Math.max(cleanText.lastIndexOf('}'), cleanText.lastIndexOf(']'));
      if (lastPossibleEnd !== -1) {
        try {
          return JSON.parse(cleanText.substring(0, lastPossibleEnd + 1));
        } catch (e3) {
          console.error("Deep recovery failed. Sample:", cleanText.slice(-50));
        }
      }
      throw new Error("The AI response was too large or complex for automatic recovery. Please try importing data in smaller batches.");
    }
  }
}

export const translateDetails = async (
  text: string,
  targetLang: string
): Promise<string> => {
  if (!process.env.API_KEY) return text;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate to ${targetLang}: "${text}". Return only translation.`,
    }));
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
};

export const autoFillNativeDetails = async (
  member: Partial<FamilyMember>,
  targetLang: string
): Promise<{ 
  fullName?: string; 
  nativePlace?: string; 
  nativeNativePlace?: string;
  occupation?: string; 
  education?: string;
  currentAddress?: string; 
  gotra?: string;
}> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const addressStr = member.currentAddress 
    ? `${member.currentAddress.street || ''}, ${member.currentAddress.city || ''}, ${member.currentAddress.state || ''}`
    : '';

  const prompt = `
    Translate the following to ${targetLang}. Return ONLY JSON.
    Name: ${member.fullName || ''}
    Place: ${member.nativePlace || ''}
    Job: ${member.occupation || ''}
    Edu: ${member.education || ''}
    Gotra: ${member.gotra || ''}
    Addr: ${addressStr}
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            nativeNativePlace: { type: Type.STRING },
            occupation: { type: Type.STRING },
            education: { type: Type.STRING },
            currentAddress: { type: Type.STRING },
            gotra: { type: Type.STRING },
          }
        }
      }
    }));

    const jsonText = response.text;
    if (!jsonText) return {};
    return safeJsonParse(jsonText);
  } catch (error) {
    console.error("AI Auto-fill error:", error);
    return {};
  }
};

export const extractFamilyFromRawText = async (rawText: string): Promise<any[]> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const prompt = `
    Extract members from this text as JSON. Include native script for names/places.
    Text: "${rawText.substring(0, 5000)}"
  `;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: FAMILY_EXTRACTION_SCHEMA
      }
    }));
    return safeJsonParse(response.text || '[]');
  } catch (error) {
    console.error("Smart text extraction failed:", error);
    throw error;
  }
};

export const extractFamilyFromDocument = async (
  base64Data: string,
  mimeType: string
): Promise<any[]> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const base64Content = base64Data.split(',')[1] || base64Data;
  const instructions = `Extract family members as JSON array. Include native script translations.`;

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const binaryString = window.atob(base64Content);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
      
      const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
      const textContent = result.value;

      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Text:\n${textContent.substring(0, 10000)}\n\n${instructions}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: FAMILY_EXTRACTION_SCHEMA
        }
      }));

      return safeJsonParse(response.text || '[]');
    } catch (e) {
      console.error("Word processing error:", e);
      throw new Error("Failed to process Word document.");
    }
  }

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Content } },
          { text: instructions }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: FAMILY_EXTRACTION_SCHEMA
      }
    }));

    return safeJsonParse(response.text || '[]');
  } catch (error) {
    console.error("Document extraction error:", error);
    throw error;
  }
};
