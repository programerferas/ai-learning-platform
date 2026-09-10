// utils/aiParser.js

/**
 * Strips markdown code fences from AI output before JSON.parse
 */
const stripCodeFences = (text) => {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
};

/**
 * Parses the quiz JSON array returned by OpenAI.
 * Validates structure and throws descriptive errors on malformed output.
 */
export const parseQuizResponse = (rawText) => {
  const cleaned = stripCodeFences(rawText);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON for quiz. Raw: " + rawText.slice(0, 200));
  }

  if (!Array.isArray(parsed)) {
    throw new Error("AI quiz response is not an array.");
  }

  const validated = parsed.map((item, index) => {
    if (typeof item.question !== "string" || !item.question.trim()) {
      throw new Error(`Quiz item ${index} missing valid 'question' field.`);
    }
    if (!Array.isArray(item.options) || item.options.length !== 4) {
      throw new Error(`Quiz item ${index} must have exactly 4 options.`);
    }
    if (typeof item.correctAnswer !== "string" || !item.options.includes(item.correctAnswer)) {
      throw new Error(`Quiz item ${index} 'correctAnswer' must match one of the options.`);
    }
    return {
      question: item.question.trim(),
      options: item.options.map((o) => o.trim()),
      correctAnswer: item.correctAnswer.trim(),
    };
  });

  return validated;
};

/**
 * Parses the recommendation explanation JSON returned by OpenAI.
 */
export const parseRecommendationResponse = (rawText) => {
  const cleaned = stripCodeFences(rawText);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON for recommendations. Raw: " + rawText.slice(0, 200));
  }

  if (typeof parsed.explanations !== "object" || typeof parsed.overallMessage !== "string") {
    throw new Error("AI recommendation response has unexpected structure.");
  }

  return parsed;
};

/**
 * Extracts plain text content from an OpenAI message response.
 */
export const extractTextContent = (response) => {
  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response.");
  return content.trim();
};