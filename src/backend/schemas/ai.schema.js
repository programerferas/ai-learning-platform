// schemas/ai.schema.js
import { z } from "zod";

export const chatSchema = z.object({
  message: z
    .string({ required_error: "Message is required" })
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters")
    .transform((val) => val.trim()),

  sessionId: z.string().uuid().optional(),

  lessonId: z.string().uuid("معرف الدرس غير صالح").optional(),
});

export const summarySchema = z.object({
  // lessonId comes from route params, validated separately
  // Body is empty for summary — no fields needed
});

export const quizSchema = z.object({
  questionCount: z
    .number({ invalid_type_error: "questionCount must be a number" })
    .int("questionCount must be an integer")
    .min(3, "Minimum 3 questions")
    .max(15, "Maximum 15 questions")
    .default(5),
});