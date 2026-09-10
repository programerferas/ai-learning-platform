import "../css/course.css";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import { getCourses } from "../api/courses";

export default function Courses() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("categoryId");

  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses()
      .then((res) => {
        const all = res.data.courses ?? [];
        setCourses(all);
        if (categoryId) {
          setFiltered(all.filter((c) => String(c.categoryId) === String(categoryId)));
        } else {
          setFiltered(all);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [categoryId]);

  const HeroSection = () => (
    <section className="courses-hero">
      <div className="courses-hero__bg">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>
      <div className="container courses-hero__content">
        <h1 className="courses-hero__title">استكشف الدورات</h1>
        <p className="courses-hero__sub">
          دورات مُعدة من قبل الخبراء العالميين لتطوير مهاراتك
        </p>
        <div className="courses-hero__stats">
          <div className="hero-stat">
            <span className="hero-stat__num">{filtered.length}+</span>
            <span className="hero-stat__label">دورة متاحة</span>
          </div>
          <div className="hero-stat__divider" />
          <div className="hero-stat">
            <span className="hero-stat__num">٥٠٠+</span>
            <span className="hero-stat__label">طالب مسجل</span>
          </div>
          <div className="hero-stat__divider" />
          <div className="hero-stat">
            <span className="hero-stat__num">٩٨٪</span>
            <span className="hero-stat__label">نسبة الرضا</span>
          </div>
        </div>
      </div>
    </section>
  );

  // ── SKELETON ──
  if (loading) {
    return (
      <div className="courses" dir="rtl">
        <Navbar />
        <HeroSection />
        <section className="courses-preview">
          <div className="container">
            <div className="courses-preview__grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="course-card skeleton">
                  <div className="skeleton-img" />
                  <div className="skeleton-body">
                    <div className="skeleton-line short" />
                    <div className="skeleton-line long" />
                    <div className="skeleton-line medium" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // ── MAIN ──
  return (
    <div className="courses" dir="rtl">
      <Navbar />
      <HeroSection />

      <section className="courses-preview">
        <div className="container">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state__icon">📭</p>
              <p className="empty-state__text">لا توجد دورات في هذه الفئة</p>
            </div>
          ) : (
            <div className="courses-preview__grid">
              {filtered.map((c) => (
                <Link to={`/courses/${c.id}`} key={c.id} className="course-card">
                  <div className="course-card__img">
                    {c.thumbnail
                      ? <img src={c.thumbnail} alt={c.title} />
                      : "📚"}
                  </div>
                  <div className="course-card__body">
                    <div className="course-card__top">
                      <span className="course-card__category">
                        {c.category?.name}
                      </span>
                      {c.badge && (
                        <span className="course-card__badge">{c.badge}</span>
                      )}
                    </div>
                    <h3 className="course-card__title">{c.title}</h3>
                    <div className="course-card__meta">
                      <span className="course-card__rating">★ {c.rating ?? "0"}</span>
                      <span className="course-card__students">
                        {c._count?.enrollments ?? 0} طالب
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}