import { useEffect, useState } from "react";
import { getMyEnrollments } from "../api/enrollments";
import "../css/Mycoursespanel.css";
import { Link } from "react-router-dom";

export default function MyCoursesPanel({ isOpen, onClose }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    getMyEnrollments()
      .then(({ data }) => setEnrollments(data ?? []))
      .catch(() => setError("تعذّر تحميل الدورات"))
      .finally(() => setLoading(false));
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`mcp-backdrop ${isOpen ? "mcp-backdrop--visible" : ""}`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside className={`mcp ${isOpen ? "mcp--open" : ""}`}>
        {/* Header */}
        <div className="mcp__header">
          <h2 className="mcp__title">دوراتي</h2>
          <button className="mcp__close" onClick={onClose} aria-label="إغلاق">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="mcp__body">
          {loading && (
            <div className="mcp__loading">
              {[1, 2, 3].map((i) => (
                <div key={i} className="mcp-skeleton">
                  <div className="mcp-skeleton__img" />
                  <div className="mcp-skeleton__lines">
                    <div className="mcp-skeleton__line mcp-skeleton__line--long" />
                    <div className="mcp-skeleton__line mcp-skeleton__line--short" />
                    <div className="mcp-skeleton__line mcp-skeleton__line--bar" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <p className="mcp__error">{error}</p>}

          {!loading && !error && enrollments.length === 0 && (
            <div className="mcp__empty">
              <span className="mcp__empty-icon">📚</span>
              <p>لم تنضم إلى أي دورة بعد</p>
            </div>
          )}

          {!loading && !error && enrollments.length > 0 && (
            <ul className="mcp__list">
             {enrollments.map((enrollment, index) => {
  const progress = enrollment.progress ?? 0;
  const course = enrollment.course ?? {};
  return (
    <li key={enrollment._id ?? index}>
      <Link
        to={`/courses/${course.id}`}
        className="mcp-card"
        onClick={onClose}
      >
        {/* Course thumbnail */}
        <div className="mcp-card__thumb">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} />
          ) : (
            <span className="mcp-card__thumb-icon">
              {course.emoji ?? "🎓"}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="mcp-card__info">
          <p className="mcp-card__title">
            {course.title ?? "دورة غير معنونة"}
          </p>

          <div className="mcp-card__progress-wrap">
            <div className="mcp-card__progress-bar">
              <div
                className="mcp-card__progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="mcp-card__progress-pct">{progress}%</span>
          </div>

          <span
            className={`mcp-card__badge ${
              progress === 100 ? "mcp-card__badge--done" : "mcp-card__badge--active"
            }`}
          >
            {progress === 100 ? "مكتملة ✓" : "قيد التقدم"}
          </span>
        </div>
      </Link>
    </li>
  );
})}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
