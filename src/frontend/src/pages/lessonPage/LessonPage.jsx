import { useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { getLessonById } from "../../api/Lesson";
import { getEnrollmentByCourse } from "../../api/enrollments";
import { LessonProvider } from "../lessonPage/Lessoncontext";
import "../../css/Lesson.css";
import VideoPlayer from "./Videoplayer";
import ProgressCard from "./Progresscard";
import CourseCurriculum from "./Coursecurriculum";
import InstructorCard from "./Instructorcard";
import AiSummary from "./AiSummary";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

/* ── Mobile Bottom Navigation ── */
function MobileNav() {
  const items = [
    { icon: "play_circle",           label: "الدروس",  active: true  },
    { icon: "format_list_bulleted",  label: "المنهج",  active: false },
    { icon: "chat",                  label: "المساعد", active: false },
    { icon: "person",                label: "حسابي",   active: false },
  ];

  return (
    <nav className="mobile-nav glass-panel">
      {items.map((item) => (
        <a
          key={item.label}
          href="#"
          className={`mobile-nav__item ${
            item.active ? "mobile-nav__item--active" : "mobile-nav__item--default"
          }`}
        >
          <span className={`material-symbols-outlined ${item.active ? "icon-filled" : ""}`}>
            {item.icon}
          </span>
          <span className="mobile-nav__label">{item.label}</span>
        </a>
      ))}
    </nav>
  );
}

/* ── Main Page ── */
export default function LessonPage() {
  const { lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");

  const [lesson,           setLesson]           = useState(null);
  const [completedIds,     setCompletedIds]      = useState([]);
  const [initialProgress,  setInitialProgress]   = useState(0);
  const [totalLessons,     setTotalLessons]      = useState(0);
  const [loading,          setLoading]           = useState(true);



  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch lesson + enrollment in parallel
        const [lessonData, enrollmentRes] = await Promise.all([
          getLessonById(lessonId),
          getEnrollmentByCourse(courseId),
        ]);

        setLesson(lessonData);
        setCompletedIds(enrollmentRes.data.completedLessons ?? []);
        setInitialProgress(enrollmentRes.data.progress ?? 0);
        setTotalLessons(enrollmentRes.data.totalLessons ?? 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    
    

    if (lessonId && courseId) fetchData();
  }, [lessonId, courseId]);

  if (loading) return <div>جاري التحميل...</div>;
  if (!lesson)  return <div className="empty-page">الدرس غير موجود ☹️</div>;

  return (
    // ✅ Provider يغلف الصفحة كلها — كل الـ components تقدر تقرأ من الـ context
    <LessonProvider
      initialCompletedIds={completedIds}
      initialProgress={initialProgress}
      initialTotal={totalLessons}
     > 
      <Navbar />

  
      <div className="lesson-page">
        
        
          <div className="main-column">
            
              
                {/* Left: Video + Chat */}
                <div className="col-main">
                  <VideoPlayer lesson={lesson} courseId={lesson.courseId} />
                  
                </div>

                {/* Right: Sidebar */}
                <aside className="col-sidebar">
                  <ProgressCard />
                  <CourseCurriculum currentLessonId={lesson.id} courseId={lesson.courseId} />
                  <InstructorCard />
                  <AiSummary lessonId={lesson.id} />
                </aside>
              </div>
            
          </div>

        <MobileNav />
        <Footer />
      
    </LessonProvider>
  );
}