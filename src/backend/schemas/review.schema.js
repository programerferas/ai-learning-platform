import { z } from "zod";

const ratingField = z
  .number({ message: "التقييم يجب أن يكون رقماً" })
  .int("التقييم يجب أن يكون رقماً صحيحاً")
  .min(1, "التقييم يجب أن يكون بين 1 و 5")
  .max(5, "التقييم يجب أن يكون بين 1 و 5");

const commentField = z.string().trim().max(1000, "التعليق طويل جداً");

export const createReviewSchema = z.object({
  rating: ratingField,
  comment: commentField.optional(),
});

export const updateReviewSchema = z
  .object({
    rating: ratingField.optional(),
    comment: commentField.optional(),
  })
  .refine((d) => d.rating !== undefined || d.comment !== undefined, {
    message: "لا توجد حقول للتحديث",
  });
