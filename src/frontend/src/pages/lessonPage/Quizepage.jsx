import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { generateCourseQuiz } from "../../api/ai";
import "../../css/Quizepage.css";

export default function QuizPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateCourseQuiz(courseId, 10)
      .then((res) => setQuestions(res.data.data.questions))
      .catch((err) =>
        setError(err.response?.data?.message || "فشل تحميل الاختبار")
      )
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleSelect = (questionId, option) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  if (loading)
    return (
      <div className="quiz-page quiz-page--loading">
        <span className="material-symbols-outlined quiz-spinner">progress_activity</span>
        <p>جاري إنشاء الاختبار...</p>
      </div>
    );

  if (error)
    return (
      <div className="quiz-page quiz-page--error">
        <span className="material-symbols-outlined">error</span>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>العودة</button>
      </div>
    );

  const percent = Math.round((score / questions.length) * 100);
  const passed = percent >= 70;

  return (
    <div className="quiz-page">
      <div className="quiz-container">
        {/* Header */}
        <div className="quiz-header">
          <button className="quiz-back-btn" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <h1 className="quiz-title">اختبار الكورس</h1>
          <span className="quiz-count">{questions.length} سؤال</span>
        </div>

        {/* Score banner */}
        {submitted && (
          <div className={`quiz-result ${passed ? "quiz-result--pass" : "quiz-result--fail"}`}>
            <span className="material-symbols-outlined quiz-result__icon">
              {passed ? "emoji_events" : "sentiment_dissatisfied"}
            </span>
            <div className="quiz-result__text">
              <p className="quiz-result__score">{score} / {questions.length}</p>
              <p className="quiz-result__percent">{percent}%</p>
              <p className="quiz-result__label">{passed ? "أحسنت! لقد اجتزت الاختبار" : "لم تجتز الاختبار، حاول مجدداً"}</p>
            </div>
            <button className="quiz-retry-btn" onClick={handleRetry}>
              <span className="material-symbols-outlined">refresh</span>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Questions */}
        <div className="quiz-questions">
          {questions.map((q, idx) => {
            const selected = answers[q.id];
            const isCorrect = submitted && selected === q.correctAnswer;
            const isWrong = submitted && selected && selected !== q.correctAnswer;

            return (
              <div key={q.id} className={`quiz-question ${submitted ? (isCorrect ? "quiz-question--correct" : isWrong ? "quiz-question--wrong" : "quiz-question--unanswered") : ""}`}>
                <p className="quiz-question__text">
                  <span className="quiz-question__num">{idx + 1}.</span> {q.question}
                </p>
                <div className="quiz-options">
                  {q.options.map((option) => {
                    const isSelected = selected === option;
                    const isCorrectOption = submitted && option === q.correctAnswer;

                    return (
                      <button
                        key={option}
                        className={`quiz-option
                          ${isSelected ? "quiz-option--selected" : ""}
                          ${isCorrectOption ? "quiz-option--correct" : ""}
                          ${submitted && isSelected && !isCorrectOption ? "quiz-option--wrong" : ""}
                        `}
                        onClick={() => handleSelect(q.id, option)}
                        disabled={submitted}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit */}
        {!submitted && (
          <button
            className="quiz-submit-btn"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
          >
            تسليم الاختبار
          </button>
        )}
      </div>
    </div>
  );
}