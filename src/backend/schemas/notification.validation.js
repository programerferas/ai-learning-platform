import { z } from "zod";

// حدود الطول تمنع رسائل ضخمة أو حشو عشوائي من البوتات
export const createNotificationSchema = z.object({
  fname: z.string().trim().min(1, "First name is required").max(50, "First name is too long"),
  lname: z.string().trim().min(1, "Last name is required").max(50, "Last name is too long"),
  email: z.string().trim().toLowerCase().email("Invalid email").max(254),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .max(20, "Phone is too long")
    .regex(/^[0-9+\s()-]+$/, "Invalid phone number"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be at most 2000 characters"),
  // Honeypot: حقل مخفي في الواجهة لا يراه البشر — أي قيمة فيه تعني بوت.
  // نقبله في الـ schema حتى لا يفشل التحقق ويعرف البوت أنه اكتُشف.
  website: z.string().max(200).optional(),
});
