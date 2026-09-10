// modules/ai/ai.controller.js
import {
  chatWithAssistant,
  generateLessonSummary,
  generateLessonQuiz,
  generateCourseQuiz,
  getRecommendations,
} from "./ai.service.js";

export const chatController = async (req, res, next) => {
  try {
    const { message, sessionId, lessonId } = req.body;
    const userId = req.user.id;

    const result = await chatWithAssistant({ userId, message, sessionId, lessonId });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const summaryController = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    const result = await generateLessonSummary({ lessonId, userId });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const quizController = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const { questionCount } = req.body;

    const result = await generateLessonQuiz({ lessonId, userId, questionCount: questionCount ?? 5 });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


export const courseQuizController = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const { questionCount } = req.body;

    const result = await generateCourseQuiz({
      courseId,
      userId,
      questionCount: questionCount ?? 10,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const recommendationsController = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await getRecommendations({ userId });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

