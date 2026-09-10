import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(3, "يجب أن يتكون الاسم من 3 حروف على الأقل.").max(10, "يجب ألا يتجاوز الاسم 10 أحرف."),
   thumbnail: z.string().url().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(3, "يجب أن يتكون الاسم من 3 حروف على الأقل.").max(10, "يجب ألا يتجاوز الاسم 10 أحرف.").optional(),
   thumbnail: z.string().url().optional(),
});