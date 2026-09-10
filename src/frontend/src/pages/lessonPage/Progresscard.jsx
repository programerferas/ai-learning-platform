import { useLessonContext } from "../lessonPage/Lessoncontext";

const CIRCUMFERENCE = 2 * Math.PI * 24;

export default function ProgressCard() {
  // ✅ كل البيانات من الـ context — لا يحتاج API call منفصل
  const { completedIds, progress, total } = useLessonContext();
  const completed  = completedIds.length;
  const dashOffset = CIRCUMFERENCE * (1 - progress / 100);

  

  return (
    <section className="progress-card glass-panel anim-enter">
      <div className="progress-card__top">
        <div>
          <p className="progress-card__label">التقدم في الدورة</p>
          <h3 className="progress-card__value">{progress}% مكتمل</h3>
        </div>

        <div className="progress-card__ring">
          <svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
            <circle
              cx="28" cy="28" r="24"
              fill="transparent"
              stroke="var(--color-surface-highest)"
              strokeWidth="4"
            />
            <circle
              cx="28" cy="28" r="24"
              fill="transparent"
              stroke="var(--color-secondary)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <span className="progress-card__ring-text">{completed}/{total}</span>
        </div>
      </div>

      <div className="progress-card__info">
        <span className="material-symbols-outlined">workspace_premium</span>
        <span>{total - completed} دروس متبقية للحصول على الشهادة</span>
      </div>

      <button className="progress-card__cert-btn">
        <span className="material-symbols-outlined">workspace_premium</span>
        الحصول على الشهادة
      </button>
    </section>
  );
}