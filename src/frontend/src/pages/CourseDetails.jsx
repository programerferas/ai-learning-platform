import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getCourseById } from "../api/courses";
import { useAuth } from "../hooks/useAuth";
import { enrollCourse, checkEnrollment } from "../api/enrollments";
import { getCourseReviews, submitReview } from "../api/reviews";
import "../css/CourseDetails.css";

const LEVEL_MAP = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
};

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="cd-stars" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`cd-star ${star <= (hovered || value) ? "active" : ""}`}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange && onChange(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function CourseDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // ── جلب بيانات الكورس ──
  useEffect(() => {
    getCourseById(id)
      .then((res) => {
        setCourse(res.data);
      })
      .catch(() => setError("تعذّر تحميل بيانات الدورة، حاول مجدداً."))
      .finally(() => setLoading(false));
  }, [id]);

  // ── جلب التقييمات ──
  useEffect(() => {
    getCourseReviews(id)
      .then((res) => setReviews(res.data?.reviews || res.data || []))
      .catch(() => {});
  }, [id]);

  // ── التحقق من التسجيل ──
  useEffect(() => {
    if (!user) return;
    checkEnrollment(id)
      .then((res) => setEnrolled(res.data.enrolled))
      .catch(() => {});
  }, [id, user]);

  // ── التسجيل في الكورس ──
  const handleEnroll = async () => {
    window.location.reload();
    if (!user) {
      navigate("/login");
      return;
    }
    setEnrolling(true);
    try {
      await enrollCourse(id);
      setEnrolled(true);
    } catch (err) {
      setError(err.response?.data?.message || "فشل التسجيل، حاول مجدداً.");
    } finally {
      setEnrolling(false);
    }
  };

  // ── إرسال التقييم ──
  const handleReviewSubmit = async () => {
    if (!reviewRating) {
      setReviewError("يرجى اختيار تقييم بالنجوم.");
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError("يرجى كتابة تعليق.");
      return;
    }
    setReviewLoading(true);
    setReviewError("");
    try {
      const res = await submitReview(id, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviews((prev) => [res.data?.review || res.data, ...prev]);
      setReviewRating(0);
      setReviewComment("");
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err) {
      setReviewError(
        err.response?.data?.message || "فشل إرسال التقييم، حاول مجدداً.",
      );
    } finally {
      setReviewLoading(false);
    }
  };

  // حساب متوسط التقييم
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(
        1,
      )
    : null;


  if (loading)
    return (
      <div className="cd-page">
        <Navbar />
        <div className="cd-loading">
          <div className="cd-spinner" />
          <span>جاري تحميل الدورة...</span>
        </div>
        <Footer />
      </div>
    );

  if (error || !course)
    return (
      <div className="cd-page">
        <Navbar />
        <div className="cd-error">
          <p style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>😕</p>
          <p>{error || "الدورة غير موجودة"}</p>
          <Link
            to="/courses"
            style={{
              color: "#CE9C25",
              fontWeight: 700,
              marginTop: "1rem",
              display: "inline-block",
            }}
          >
            ← العودة للدورات
          </Link>
        </div>
        <Footer />
      </div>
    );

  // متطلبات الدورة — يمكنك لاحقاً جلبها من الـ API
  const requirements = course.requirements || [
    "لا يشترط خبرة مسبقة لهذه الدورة",
    "جهاز كمبيوتر مع اتصال بالإنترنت",
    "الرغبة في التعلم والمثابرة",
  ];

  return (
    <div className="cd-page" dir="rtl">
      <Navbar />

      {/* ── HERO ── */}
      <section className="cd-hero">
        <div className="cd-hero__inner">
          <div className="cd-hero__badge">📚 {course.category?.name}</div>
          <h1 className="cd-hero__title">{course.title}</h1>
          <p className="cd-hero__desc">{course.description}</p>
          <div className="cd-hero__meta">
            <div className="cd-hero__meta-item">
              <span className="ico">👨‍🏫</span>
              <span>{course.instructor?.name}</span>
            </div>
            <div className="cd-hero__meta-item">
              <span className="ico">📖</span>
              <span>{course.lessons?.length ?? 0} درس</span>
            </div>
            <div className="cd-hero__meta-item">
              <span className="ico">🎯</span>
              <span className={`cd-level cd-level--${course.level}`}>
                {LEVEL_MAP[course.level] || course.level}
              </span>
            </div>
            {avgRating && (
              <div className="cd-hero__meta-item">
                <span className="ico">⭐</span>
                <span>
                  {avgRating} / 5 ({reviews.length} تقييم)
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── MAIN GRID ── */}
      <div className="cd-main">
        <div className="cd-content">
          {/* بطاقة السعر والتسجيل */}
          <div className="cd-enroll-card">
            <div className="cd-price">
              {!course.price || course.price === 0
                ? "مجاني"
                : `$${course.price}`}
              {course.price > 0 && <span> / مدى الحياة</span>}
            </div>
            {enrolled ? (
              <div className="cd-enrolled-badge">✅ أنت مسجل في هذه الدورة</div>
            ) : (
              <button
                className="cd-enroll-btn"
                onClick={handleEnroll}
                
                disabled={enrolling}
              >
                {enrolling
                  ? "جاري التسجيل..."
                  : user
                    ? "سجّل الآن"
                    : "سجّل الدخول للتسجيل"}
              </button>
            )}
          </div>

          {/* عن الدورة */}
          <div className="cd-section">
            <div className="cd-section__title">عن هذه الدورة</div>
            <p className="cd-section__text">{course.description}</p>
          </div>

          {/* ── متطلبات الدورة ── */}
          <div className="cd-section">
            <div className="cd-section__title">📋 متطلبات الدورة</div>
            <ul className="cd-requirements">
              {requirements.map((req, i) => (
                <li key={i} className="cd-requirement-item">
                  <span className="cd-req-icon">✓</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* المدرب */}
          <div className="cd-section">
            <div className="cd-section__title">المدرّب</div>
            <div className="cd-instructor">
              <div className="cd-instructor__avatar">
                {course.instructor?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="cd-instructor__name">
                  {course.instructor?.name}
                </div>
                <div className="cd-instructor__role">
                  {course.instructor?.role === "INSTRUCTOR"
                    ? "مدرّب معتمد"
                    : course.instructor?.role}
                </div>
              </div>
            </div>
          </div>

          {/* ── التقييمات ── */}
          <div className="container-reviews">
            <div className="cd-section__title">⭐ آراء الطلاب</div>

            {/* ملخص التقييم */}
            {avgRating && (
              <div className="cd-reviews-summary">
                <div className="cd-reviews-avg">{avgRating}</div>
                <div>
                  <StarRating value={Math.round(avgRating)} />
                  <div className="cd-reviews-count">{reviews.length} تقييم</div>
                </div>
              </div>
            )}

            {/* قائمة التقييمات */}
            {reviews.length === 0 ? (
              <p className="cd-no-reviews">
                لا توجد تقييمات بعد. كن أول من يقيّم!
              </p>
            ) : (
              <div className="cd-reviews-list">
                {reviews.map((rev) => (
                  <div key={rev.id} className="cd-review-card">
                    <div className="cd-review-header">
                      <div className="cd-review-avatar">
                        {rev.user?.name?.charAt(0).toUpperCase() || "م"}
                      </div>
                      <div>
                        <div className="cd-review-author">
                          {rev.user?.name || "مستخدم"}
                        </div>
                        <StarRating value={rev.rating} />
                      </div>
                      <div className="cd-review-date">
                        {rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString("ar-SA")
                          : ""}
                      </div>
                    </div>
                    <p className="cd-review-comment">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* فورم إضافة تقييم */}
            {enrolled && (
              <div className="cd-review-form">
                <div className="cd-review-form__title">أضف تقييمك</div>
                <StarRating value={reviewRating} onChange={setReviewRating} />
                <textarea
                  className="cd-review-textarea"
                  placeholder="شارك تجربتك مع هذه الدورة..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                />
                {reviewError && (
                  <p className="cd-review-error">{reviewError}</p>
                )}
                {reviewSuccess && (
                  <p className="cd-review-success">✅ تم إرسال تقييمك بنجاح!</p>
                )}
                <button
                  className="cd-enroll-btn"
                  onClick={handleReviewSubmit}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? "جاري الإرسال..." : "إرسال التقييم"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="cd-sidebar">
          <div className="cd-sidebar__card">
            <div className="cd-thumbnail">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} />
              ) : (
                <span>📚</span>
              )}
            </div>
            <div className="cd-sidebar__header">
              <span className="cd-sidebar__title">محتوى الدورة</span>
            </div>
            <div className="cd-sidebar__lessons">
              <Link
                to={`/lessons/${course.lessons?.[0]?.id}?courseId=${course.id}`}
                className="cd-sidebar__btn"
              >
                ابدأ الدورة
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
