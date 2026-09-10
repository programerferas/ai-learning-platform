import { useState, useRef } from "react";
import { completeLesson } from "../../api/Lesson";
import { useLessonContext } from "../lessonPage/Lessoncontext";

export default function VideoPlayer({ lesson, courseId }) {
  const { markCompleted } = useLessonContext(); // ✅ من الـ context

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [duration,    setDuration]    = useState("00:00");
  const [completed,   setCompleted]   = useState(false);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.pause() : videoRef.current.play();
    setIsPlaying((p) => !p);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setProgress((video.currentTime / video.duration) * 100);
    setCurrentTime(formatTime(video.currentTime));
  };

  const handleLoadedMetadata = () => {
    setDuration(formatTime(videoRef.current.duration));
  };

  const handleProgressClick = (e) => {
    const bar  = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const ratio = 1 - (e.clientX - rect.left) / rect.width; // RTL
    videoRef.current.currentTime = ratio * videoRef.current.duration;
  };

  const handleEnded = async () => {
  console.log("video ended, completed:", completed, "lesson:", lesson.id);
  setIsPlaying(false);
  if (completed) return;
  try {
    await completeLesson({ courseId, lessonId: lesson.id });
    setCompleted(true);
    console.log("calling markCompleted with:", lesson.id); // 👈
    markCompleted(lesson.id);
  } catch (err) {
    console.error("error:", err);
  }
};

  return (
    <section className="video-player glass-panel">
      <video
        ref={videoRef}
        src={lesson.videoUrl}
        className="video-player__video"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="video-player__play-btn">
        <button className="video-player__play-circle" onClick={togglePlay}>
          <span className="material-symbols-outlined icon-filled">
            {isPlaying ? "pause" : "play_arrow"}
          </span>
        </button>
      </div>

      <div className="video-player__controls">
        <div className="video-player__info">
          <div>
            <h2 className="video-player__title">{lesson.title}</h2>
            <p className="video-player__subtitle">{lesson.description}</p>
          </div>
          <span className="video-player__time">
            {duration} / {currentTime}
          </span>
        </div>

        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={progress}
          onClick={handleProgressClick}
        >
          <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
          <div className="progress-bar__thumb" style={{ right: `${100 - progress}%` }} />
        </div>

        <div className="video-player__bottom-bar">
          <div className="video-player__bottom-icons">
            <button className="video-icon-btn" aria-label="الإعدادات">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button className="video-icon-btn" aria-label="الترجمة">
              <span className="material-symbols-outlined">closed_caption</span>
            </button>
            <button className="video-icon-btn" aria-label="سرعة التشغيل">
              <span className="material-symbols-outlined">speed</span>
            </button>
          </div>
          <button
            className="video-icon-btn"
            onClick={() => videoRef.current?.requestFullscreen()}
            aria-label="ملء الشاشة"
          >
            <span className="material-symbols-outlined">fullscreen</span>
          </button>
        </div>
      </div>
    </section>
  );
}