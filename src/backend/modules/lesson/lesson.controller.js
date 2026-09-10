import * as lessonService from "./lesson.service.js";

export const createLesson = async (req, res, next) => {
  try {
    const lesson = await lessonService.createLesson(req.body, req.user);
    res.status(201).json(lesson);
  } catch (err) {
    next(err);
  }
};

export const getLessonsByCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id || req.params.courseId;
    const lessons = await lessonService.getLessonsByCourse(courseId);
    res.json(lessons);
  } catch (err) {
    next(err);
  }
};

export const getLessonById = async (req, res, next) => {
  try {
    const lesson = await lessonService.getLessonById(req.params.id);
    res.status(200).json(lesson);
  } catch (err) {
    next(err);
  }
};

export const updateLesson = async (req, res, next) => {
  try {
    const lesson = await lessonService.updateLesson(req.params.id, req.body, req.user);
    res.status(200).json(lesson);
  } catch (err) {
    next(err);
  }
};

export const deleteLesson = async (req, res, next) => {
  try {
    const result = await lessonService.deleteLesson(req.params.id, req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const completeLessonController = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.body;
    const userId = req.user.id;
    const result = await lessonService.completeLesson(userId, courseId, lessonId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getAllLessons = async (req, res, next) => {
  try {
    const lessons = await lessonService.getAllLessons();
    res.status(200).json(lessons);
  } catch (err) {
    next(err);
  }
};