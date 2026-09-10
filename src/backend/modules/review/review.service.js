import prisma from "../../lib/prisma.js";

export const createReview = async (userId, courseId, data) => {
  // check if user is enrolled
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, courseId },
  });

  if (!enrollment)
    throw new Error("You must be enrolled to review this course");

  // check if user already reviewed
  const existing = await prisma.review.findFirst({
    where: { userId, courseId },
  });

  if (existing) throw new Error("You already reviewed this course");

  // validate rating
  if (data.rating < 1 || data.rating > 5)
    throw new Error("Rating must be between 1 and 5");

  return await prisma.review.create({
    data: {
      userId,
      courseId,
      rating: data.rating,
      comment: data.comment,
    },
  });
};

export const getAllReviews = async () => {
  return await prisma.review.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      course: {
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getReviewsByCourse = async (courseId) => {
  return await prisma.review.findMany({
    where: { courseId },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const updateReview = async (userId, reviewId, data) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) throw new Error("Review not found");
  if (review.userId !== userId) throw new Error("Not authorized");

  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    throw new Error("Rating must be between 1 and 5");
  }

  return await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: data.rating ?? review.rating,
      comment: data.comment ?? review.comment,
    },
  });
};

export const deleteReview = async (userId, reviewId, userRole) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) throw new Error("Review not found");

  // user can delete their own, admin can delete any
  if (review.userId !== userId && userRole !== "ADMIN") {
    throw new Error("Not authorized");
  }

  return await prisma.review.delete({
    where: { id: reviewId },
  });
};
