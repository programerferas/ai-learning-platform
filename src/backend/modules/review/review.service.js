import prisma from "../../lib/prisma.js";
import { AppError } from "../../utils/appError.js";

export const createReview = async (userId, courseId, data) => {
  // check if user is enrolled
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, courseId },
  });

  if (!enrollment)
    throw new AppError("You must be enrolled to review this course", 403);

  // check if user already reviewed
  const existing = await prisma.review.findFirst({
    where: { userId, courseId },
  });

  if (existing) throw new AppError("You already reviewed this course", 409);

  // validate rating
  if (data.rating < 1 || data.rating > 5)
    throw new AppError("Rating must be between 1 and 5", 400);

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

  if (!review) throw new AppError("Review not found", 404);
  if (review.userId !== userId) throw new AppError("Not authorized", 403);

  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    throw new AppError("Rating must be between 1 and 5", 400);
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

  if (!review) throw new AppError("Review not found", 404);

  // user can delete their own, admin can delete any
  if (review.userId !== userId && userRole !== "ADMIN") {
    throw new AppError("Not authorized", 403);
  }

  return await prisma.review.delete({
    where: { id: reviewId },
  });
};
