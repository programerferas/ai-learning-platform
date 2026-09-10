import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLessonsByCourse } from "../../api/Lesson";
import { useLessonContext } from "../lessonPage/Lessoncontext";

export default function CourseCurriculum({ currentLessonId, courseId }) {
  const { completedIds } = useLessonContext();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    getLessonsByCourse(courseId)
      .then(setLessons)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId]);

const handleLessonClick = (lesson, isUnlocked) => {
  if (!isUnlocked) return;
  window.location.assign(`/lessons/${lesson.id}?courseId=${courseId}`);
};

  const allCompleted =
    lessons.length > 0 && lessons.every((l) => completedIds.includes(l.id));

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <section className="curriculum glass-panel anim-enter anim-delay-1">
      <div className="curriculum__header">
        <h2 className="curriculum__title">
          <span className="material-symbols-outlined">format_list_bulleted</span>
          محتوى الكورس
        </h2>
        <span className="curriculum__duration">{lessons.length} دروس</span>
      </div>

      <div className="curriculum__list">
        {lessons.map((lesson, index) => {
          const isActive = lesson.id === currentLessonId;
          const isCompleted = completedIds.includes(lesson.id);
          const prevCompleted =
            index === 0 || completedIds.includes(lessons[index - 1].id);
          const isUnlocked = isCompleted || isActive || prevCompleted;

          let icon = "lock";
          let iconClass = "lesson-item__icon--locked";
          if (isActive)       { icon = "play_arrow";   iconClass = "lesson-item__icon--active"; }
          else if (isCompleted) { icon = "check_circle"; iconClass = "lesson-item__icon--completed"; }
          else if (isUnlocked)  { icon = "play_circle";  iconClass = "lesson-item__icon--unlocked"; }

          return (
            <div
              key={lesson.id}
              className={`lesson-item ${isActive ? "lesson-item--active" : ""} ${!isUnlocked ? "lesson-item--locked" : ""}`}
              role="button"
              tabIndex={isUnlocked ? 0 : -1}
              onClick={() => handleLessonClick(lesson, isUnlocked)}
              onKeyDown={(e) => e.key === "Enter" && handleLessonClick(lesson, isUnlocked)}
              style={{ cursor: isUnlocked ? "pointer" : "not-allowed" }}
            >
              <div className={`lesson-item__icon ${iconClass}`}>
                <span className={`material-symbols-outlined ${isActive || isCompleted ? "icon-filled" : ""}`}>
                  {icon}
                </span>
              </div>
              <div className="lesson-item__info">
                <p className="lesson-item__name">{lesson.title}</p>
                <p className="lesson-item__meta">{lesson.duration ?? ""}</p>
              </div>
            </div>
          );
        })}
      </div>

      {allCompleted && (
        <div className="curriculum__quiz-cta">
          <button
            className="quiz-cta-btn"
            onClick={() => navigate(`/quiz/${courseId}`)}
          >
            <span className="material-symbols-outlined">quiz</span>
            ابدأ اختبار الكورس
          </button>
        </div>
      )}
    </section>
  );
}