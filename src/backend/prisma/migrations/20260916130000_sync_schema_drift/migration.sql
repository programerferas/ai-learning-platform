-- يغلق الفجوة بين سلسلة الهجرات وschema.prisma (تغييرات كانت مطبّقة محلياً عبر db push فقط).
-- كل الخطوات آمنة على قاعدة مبنية من الصفر وعلى قاعدة مطبّق عليها التغيير سلفاً.

-- قيم CourseLevel: تُعاد إلى الإنجليزية كما في schema.prisma، مع تحويل أي قيم عربية قائمة
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'CourseLevel' AND e.enumlabel = 'مبتدئ'
  ) THEN
    CREATE TYPE "CourseLevel_new" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
    ALTER TABLE "Course" ALTER COLUMN "level" TYPE "CourseLevel_new"
      USING (
        CASE "level"::text
          WHEN 'مبتدئ' THEN 'BEGINNER'
          WHEN 'متوسط' THEN 'INTERMEDIATE'
          WHEN 'خبير'  THEN 'ADVANCED'
          ELSE "level"::text
        END
      )::"CourseLevel_new";
    ALTER TYPE "CourseLevel" RENAME TO "CourseLevel_old";
    ALTER TYPE "CourseLevel_new" RENAME TO "CourseLevel";
    DROP TYPE "CourseLevel_old";
  END IF;
END $$;

-- المدرّس اختياري: حذف المستخدم يجعل الحقل NULL بدل منع الحذف
ALTER TABLE "Course" ALTER COLUMN "instructorId" DROP NOT NULL;
ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_instructorId_fkey";
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- حذف الكورس يحذف تسجيلاته
ALTER TABLE "Enrollment" DROP CONSTRAINT IF EXISTS "Enrollment_courseId_fkey";
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- توكن التفعيل على User فريد كما في schema.prisma
CREATE UNIQUE INDEX IF NOT EXISTS "User_verifyToken_key" ON "User"("verifyToken");
