import prisma from "../../lib/prisma.js";

export const getOverview = async () => {
  // استعلامات مستقلة: نشغّلها معاً بدل التسلسل
  const [totalUsers, totalCourses, totalLessons, totalReviews, recentActivities] =
    await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.lesson.count(),
      prisma.review.count(),
      // Recent activities - last 10 enrollments
      prisma.enrollment.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: { select: { name: true } },
          course: { select: { title: true } },
        },
      }),
    ]);

  const formattedActivities = recentActivities.map((enrollment) => ({
    id: enrollment.id,
    user: enrollment.user.name,
    action: `تم التسجيل في دورة: ${enrollment.course.title}`,
    time: enrollment.createdAt,
  }));

  return {
    totalUsers,
    totalCourses,
    totalLessons,
    totalReviews,
    recentActivities: formattedActivities,
  };
};
