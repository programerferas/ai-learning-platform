import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";

// المفتاح والنموذج مُتحقَّق منهما في config/env.js عند الإقلاع —
// لا نقرأ process.env هنا حتى يبقى تقرير الإعدادات الناقصة في مكان واحد
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const MODEL = env.GEMINI_MODEL;

const MAX_ATTEMPTS = 3;
const RETRYABLE = new Set([429, 500, 503]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Send a prompt to Gemini and return the plain-text reply.
 * Pass { json: true } for prompts that must return JSON — Gemini then
 * guarantees the output is a valid JSON document (no prose, no code fences).
 * Transient errors (rate limit / high demand) are retried with backoff.
 */
export const callGemini = async (prompt, { json = false } = {}) => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          temperature: 0.7,
          // Gemini's internal "thinking" tokens count against this limit, and
          // Arabic uses ~2-3x more tokens than English — keep it generous or
          // the answer gets cut off mid-JSON.
          maxOutputTokens: 8192,
          ...(json && { responseMimeType: "application/json" }),
        },
      });

      const text = response.text;
      if (!text) throw new Error("Gemini returned an empty response.");
      return text.trim();
    } catch (err) {
      const status = err?.status ?? err?.error?.code;
      if (RETRYABLE.has(status) && attempt < MAX_ATTEMPTS) {
        await sleep(1000 * 2 ** (attempt - 1)); // 1s, 2s
        continue;
      }
      if (RETRYABLE.has(status)) {
        throw new AppError(
          "خدمة الذكاء الاصطناعي مشغولة حالياً، يرجى المحاولة بعد قليل.",
          503,
        );
      }
      throw err;
    }
  }
};
