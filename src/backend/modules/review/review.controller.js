import * as reviewService from "./review.service.js";

export const createReviewController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.courseId;
    const result = await reviewService.createReview(userId, courseId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const getReviewsByCourseController = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const result = await reviewService.getReviewsByCourse(courseId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateReviewController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.reviewId;
    const result = await reviewService.updateReview(userId, reviewId, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteReviewController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.reviewId;
    const userRole = req.user.role;
    const result = await reviewService.deleteReview(userId, reviewId, userRole);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getAllReviewsController = async (req, res, next) => {
  try {
    const result = await reviewService.getAllReviews();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
