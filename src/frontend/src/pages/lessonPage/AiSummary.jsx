import { useState } from "react";
import { getLessonSummary } from "../../api/ai";
import "../../css/AiSummary.css";

export default function AISummary({ lessonId }) {
  const [open, setOpen] = useState(false);``
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpen = async () => {
    setOpen(true);
    if (summary) return; // already fetched

    setLoading(true);
    setError(null);
    try {
      const res = await getLessonSummary(lessonId);
      setSummary(res.data.data.summary);
    } catch (err) {
      setError("تعذّر تحميل الملخص. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setOpen(false);

  return (
    <>
      {/* Trigger Button */}
      <button className="summary-btn" onClick={handleOpen}>
        <span className="material-symbols-outlined">summarize</span>
        ملخص الدرس
      </button>

      {/* Modal Overlay */}
      {open && (
        <div className="summary-overlay" onClick={handleClose}>
          <div
            className="summary-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="summary-modal__header">
              <div className="summary-modal__title">
                <span className="material-symbols-outlined">auto_awesome</span>
                ملخص الدرس
              </div>
              <button className="summary-modal__close" onClick={handleClose}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="summary-modal__body">
              {loading && (
                <div className="summary-loading">
                  <div className="summary-spinner" />
                  <p>جاري توليد الملخص...</p>
                </div>
              )}

              {error && !loading && (
                <div className="summary-error">
                  <span className="material-symbols-outlined">error</span>
                  {error}
                </div>
              )}

              {summary && !loading && (
                <div className="summary-content">
                  {summary.split("\n").filter(Boolean).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}