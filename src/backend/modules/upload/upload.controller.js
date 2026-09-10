import * as uploadService from "./upload.service.js";

export const presignLessonVideo = async (req, res, next) => {
  try {
    const result = await uploadService.createLessonVideoUpload(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
