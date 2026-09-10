import prisma from "../../lib/prisma.js";
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

export const updateProgress = async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.updateProgress(
      req.params.courseId,
      req.user,
      req.body.progress,
    );
    res.status(200).json(enrollment);
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

export const getEnrollmentByCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.courseId;

    if (!courseId) return res.status(400).json({ message: "Invalid courseId" });

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, courseId },
      select: { progress: true, completedLessons: true },
    });

    if (!enrollment) return res.status(404).json({ message: "Not enrolled" });

    const totalLessons = await prisma.lesson.count({ where: { courseId } });

    res.json({
      completedLessons: enrollment.completedLessons,
      completed: enrollment.completedLessons.length,
      progress: enrollment.progress,
      totalLessons,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const checkEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.checkEnrollment(req.params.courseId, req.user);
    res.status(200).json(result); // { enrolled: true/false }
  } catch (err) {
    res.status(400).json({ message: err.message });
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