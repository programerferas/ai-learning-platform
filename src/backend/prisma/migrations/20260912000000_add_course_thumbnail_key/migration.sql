-- AlterTable
-- الكورسات القديمة تحتفظ بـ thumbnail كرابط كامل، والكورسات الجديدة تستعمل
-- thumbnailKey ويُولَّد رابط موقّع عند القراءة — نفس منطق videoKey في الدروس.
ALTER TABLE "Course" ADD COLUMN     "thumbnailKey" TEXT;
