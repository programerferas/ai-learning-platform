// env.js يحمّل ملف .env بنفسه، لذلك يجب أن يسبق كل استيراد يقرأ الإعدادات
import { env } from "./config/env.js";
import app from "./app.js";
import { verifyMailer } from "./lib/mailer.js";

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
  verifyMailer();
});

