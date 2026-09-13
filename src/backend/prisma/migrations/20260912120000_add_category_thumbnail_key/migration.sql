-- AlterTable
-- صورة التصنيف بنفس منطق صورة الكورس: التصنيفات القديمة تحتفظ بـ thumbnail كرابط كامل،
-- والجديدة تستعمل thumbnailKey ويُولَّد رابط موقّع عند القراءة.
-- description كان يُرسل من الواجهة والخدمة لكن لم يكن له عمود في قاعدة البيانات.
ALTER TABLE "Category" ALTER COLUMN "thumbnail" DROP NOT NULL;
ALTER TABLE "Category" ADD COLUMN     "description" TEXT;
ALTER TABLE "Category" ADD COLUMN     "thumbnailKey" TEXT;
