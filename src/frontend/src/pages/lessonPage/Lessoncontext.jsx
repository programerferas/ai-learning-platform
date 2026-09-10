import { createContext, useContext, useState, useCallback } from "react";

const LessonContext = createContext(null);

export function LessonProvider({ children, initialCompletedIds = [], initialProgress = 0, initialTotal = 0 }) {
  const [completedIds, setCompletedIds] = useState(initialCompletedIds);
  const [progress, setProgress]         = useState(initialProgress);
  const [total]                         = useState(initialTotal);

  // Called by VideoPlayer after API success
  const markCompleted = useCallback((lessonId) => {
    setCompletedIds((prev) => {
      if (prev.includes(lessonId)) return prev;
      const updated = [...prev, lessonId];
      // Recalculate progress locally — no extra API call needed
      const newProgress = total > 0 ? Math.round((updated.length / total) * 100) : 0;
      setProgress(newProgress);
      return updated;
    });
  }, [total]);

  return (
    <LessonContext.Provider value={{ completedIds, progress, total, markCompleted }}>
      {children}
    </LessonContext.Provider>
  );
}

export function useLessonContext() {
  const ctx = useContext(LessonContext);
  if (!ctx) throw new Error("useLessonContext must be used inside <LessonProvider>");
  return ctx;
}