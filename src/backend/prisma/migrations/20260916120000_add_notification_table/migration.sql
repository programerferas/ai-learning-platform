-- CreateTable
-- جدول Notification كان موجوداً في schema.prisma ومستعملاً في /api/notifications،
-- لكن لم تُنشئه أي migration (كان مضافاً محلياً عبر db push فقط).
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "fname" TEXT NOT NULL,
    "lname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
