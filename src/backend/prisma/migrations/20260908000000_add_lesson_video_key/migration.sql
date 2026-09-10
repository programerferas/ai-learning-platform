-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "videoKey" TEXT;

-- الصفوف القديمة تحتفظ بـ videoUrl كاملاً، والدروس الجديدة تستعمل videoKey،
-- لذلك يجب أن يقبل videoUrl القيمة NULL. العمود منشأ أصلاً بلا NOT NULL
-- في 20260523093841_add_core_schema، وهذه العبارة تأكيد آمن لا يفشل إن كان كذلك.
ALTER TABLE "Lesson" ALTER COLUMN "videoUrl" DROP NOT NULL;
