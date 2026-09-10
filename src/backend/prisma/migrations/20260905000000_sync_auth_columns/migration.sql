-- أعمدة إعادة تعيين كلمة المرور كانت في schema.prisma بلا هجرة تنشئها
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetPasswordToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP(3);

-- تتبّع آخر إرسال لرابط التفعيل (فترة التهدئة)
ALTER TABLE "PendingUser" ADD COLUMN IF NOT EXISTS "lastSentAt" TIMESTAMP(3);

-- محاولات تسجيل متعددة لنفس البريد مسموحة، لذلك البريد مفهرس لا فريد
DROP INDEX IF EXISTS "PendingUser_email_key";
CREATE INDEX IF NOT EXISTS "PendingUser_email_idx" ON "PendingUser"("email");

-- التوكن هو مفتاح البحث عند التفعيل ويجب أن يكون فريداً
CREATE UNIQUE INDEX IF NOT EXISTS "PendingUser_verifyToken_key" ON "PendingUser"("verifyToken");
CREATE INDEX IF NOT EXISTS "PendingUser_verifyTokenExpires_idx" ON "PendingUser"("verifyTokenExpires");
