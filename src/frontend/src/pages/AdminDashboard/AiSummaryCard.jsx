import { useState } from "react";
import { FaRobot, FaSpinner, FaDatabase } from "react-icons/fa";
import { getLessonSummary } from "../../api/ai";

export const AiSummaryCard = ({ lessonId }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);

  const handleGenerate = async () => {
    if (!lessonId) {
      setError("احفظ الدرس أولاً قبل توليد الملخص.");
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const response = await getLessonSummary(lessonId);

      setSummary(response.data.summary);
      setCached(response.data.cached || false);
    } catch (err) {
      setError(
        err.response?.data?.message || "فشل في توليد الملخص. حاول لاحقاً."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-summary-box">
      <button
        type="button"
        className="btn btn-outline"
        onClick={handleGenerate}
        disabled={loading || !lessonId}
      >
        {loading ? (
          <>
            <FaSpinner className="spinner" /> جاري التوليد...
          </>
        ) : (
          <>
            <FaRobot /> توليد ملخص بالذكاء الاصطناعي
          </>
        )}
      </button>

      {error && <p className="error-message">{error}</p>}

      {summary && (
        <div className="ai-summary">
          <strong>{summary}</strong>
          {cached && (
            <span className="stored-badge">
              <FaDatabase /> محفوظ مسبقاً
            </span>
          )}
        </div>
      )}
    </div>
  );
};