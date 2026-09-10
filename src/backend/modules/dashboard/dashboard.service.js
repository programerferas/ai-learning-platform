import prisma from "../../lib/prisma.js";


 export const getOverview = async () => {
  try {
    const totalUsers = await prisma.user.count();
    const totalCourses = await prisma.course.count();
    const totalLessons = await prisma.lesson.count();
    const totalReviews = await prisma.review.count();

    // Recent activities - last 10 enrollments
   const recentActivities = await prisma.enrollment.findMany({
  orderBy: { createdAt: "desc" },
  take: 10,
  include: {
    user: { select: { name: true } },
    course: { select: { title: true } },
  },
});

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
  } catch (error) {
    throw new Error(`Failed to fetch dashboard overview: ${error.message}`);
  }
};

