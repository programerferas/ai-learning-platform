import * as enrollmentService from "./enrollment.service.js";

export const enrollInCourse = async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.enrollInCourse(
      req.params.courseId,
      req.user,
    );
    res.status(201).json(enrollment);
  } catch (err) {
    next(err);
  }
};

export const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await enrollmentService.getMyEnrollments(req.user);
    res.status(200).json(enrollments);
  } catch (err) {
    next(err);
  }
};

export const unenrollFromCourse = async (req, res, next) => {
  try {
    const result = await enrollmentService.unenrollFromCourse(
      req.params.courseId,
      req.user,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getAllEnrollments = async (req, res, next) => {
  try {
    const enrollments = await enrollmentService.getAllEnrollments();
    res.status(200).json(enrollments);
  } catch (err) {
    next(err);
  }
};

export const getEnrollmentByCourse = async (req, res, next) => {
  try {
    const result = await enrollmentService.getEnrollmentByCourse(
      req.params.courseId,
      req.user,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const checkEnrollment = async (req, res, next) => {
  try {
    const result = await enrollmentService.checkEnrollment(req.params.courseId, req.user);
    res.status(200).json(result); // { enrolled: true/false }
  } catch (err) {
    next(err);
  }
};

export const getContinueLearningController = async (req, res, next) => {
  try {
    const result = await enrollmentService.getContinueLearning(req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const saveProgressController = async (req, res, next) => {
  try {
    const { courseId, lessonId, position } = req.body;
    const userId = req.user.id;
    const result = await enrollmentService.saveProgress(
      userId,
      courseId,
      lessonId,
      position,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getResumeController = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const result = await enrollmentService.getResume(userId, courseId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};