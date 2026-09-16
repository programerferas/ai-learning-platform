-- AlterTable
-- صورة التصنيف بنفس منطق صورة الكورس: التصنيفات القديمة تحتفظ بـ thumbnail كرابط كامل،
-- والجديدة تستعمل thumbnailKey ويُولَّد رابط موقّع عند القراءة.
-- description كان يُرسل من الواجهة والخدمة لكن لم يكن له عمود في قاعدة البيانات.
-- ملاحظة: عمود thumbnail لم يُنشأ في أي مigration سابق (كان مضافاً يدوياً محلياً فقط)،
-- لذلك نضيفه هنا حتى تُبنى القاعدة من الصفر بنجاح.
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "thumbnail" TEXT;
ALTER TABLE "Category" ALTER COLUMN "thumbnail" DROP NOT NULL;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "thumbnailKey" TEXT;
