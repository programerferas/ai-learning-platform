import * as courseService from "./course.service.js";

export const createCourse = async (req, res, next) => {
  try {
    const course = await courseService.createCourse(req.body, req.user);
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
};

export const getAllCourses = async (req, res, next) => {
  try {
    const result = await courseService.getAllCourses(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getManagedCourses = async (req, res, next) => {
  try {
    const result = await courseService.getManagedCourses(req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    res.status(200).json(course);
  } catch (err) {
    next(err);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json(course);
  } catch (err) {
    next(err);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const result = await courseService.deleteCourse(req.params.id, req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const togglePublish = async (req, res, next) => {
  try {
    const course = await courseService.togglePublish(req.params.id, req.user);
    res.status(200).json({
      message: course.published ? "Course published" : "Course unpublished",
      course,
    });
  } catch (err) {
    next(err);
  }
};

export const getCourseProgressController = async (req, res, next) => {
  try {
    const result = await courseService.getCourseProgress(
      req.params.courseId,
      req.user.id
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};