import * as uploadService from "./upload.service.js";

export const presignLessonVideo = async (req, res, next) => {
  try {
    const result = await uploadService.createLessonVideoUpload(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const presignCourseImage = async (req, res, next) => {
  try {
    const result = await uploadService.createCourseImageUpload(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const presignCategoryImage = async (req, res, next) => {
  try {
    const result = await uploadService.createCategoryImageUpload(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
