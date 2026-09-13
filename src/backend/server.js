// env.js يحمّل ملف .env بنفسه، لذلك يجب أن يسبق كل استيراد يقرأ الإعدادات
import { env } from "./config/env.js";
import app from "./app.js";
import prisma from "./lib/prisma.js";
import logger from "./utils/logger.js";
import { verifyMailer } from "./lib/mailer.js";
import { purgeExpiredPendingUsers } from "./modules/auth/auth.service.js";

const PURGE_INTERVAL_MS = 60 * 60 * 1000; // كنس محاولات التسجيل المنتهية كل ساعة

const server = app.listen(env.PORT, () => {
  logger.info("server.listening", { port: env.PORT, env: env.NODE_ENV });
  verifyMailer();
});

// وظيفة التنظيف: تعمل مرة عند الإقلاع ثم دورياً. unref حتى لا تمنع الإغلاق.
const runPurge = () =>
  purgeExpiredPendingUsers().catch((err) =>
    logger.error("cleanup.pending_users_failed", { err }),
  );
runPurge();
setInterval(runPurge, PURGE_INTERVAL_MS).unref();

// إغلاق سلس: نتوقف عن قبول اتصالات جديدة، ننهي الجارية، ثم نغلق اتصال القاعدة
const shutdown = (signal) => {
  logger.info("server.shutdown", { signal });
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // مهلة قصوى إن علقت اتصالات مفتوحة
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (err) => {
  logger.error("process.unhandled_rejection", { err });
});
