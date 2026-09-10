import { useState, useEffect } from "react";
import "../css/category.css";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getAllCategories } from "../api/category";

const EMOJI_MAP = {
  default: "🎨",
};

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await getAllCategories();
        setCategories(data ?? []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <div className="loading">جاري التحميل...</div>;
  if (!categories.length)
    return <div className="loading">لا توجد فئات متاحة</div>;
  const categoriesCount = categories.length;

  return (
    <div className="category" dir="rtl">
      <Navbar />

      <div className="category-hero">
        <div className="category-hero__bg">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
          <span className="orb orb-3" />
        </div>
        <div className="container category-hero__content">
          <h1 className="category-hero__title">استكشف الفئات</h1>
          <p className="category-hero__sub">
            اختر الفئة التي تريدها من بين الفئات التالية
          </p>
          <div className="category-hero__stats">
            <div className="hero-stat">
              <span className="category-hero-stat__num">
                {categoriesCount}+
              </span>
              <span className="category-hero-stat__label"> فئة متاحة </span>
            </div>
          </div>
        </div>
      </div>

      <section className="category-preview">
        <div className="container-category">
          <div className="section-header">
            <p className="section-header__title-category">
              اختر الفئة التي تريدها من بين الفئات التالية
            </p>
          </div>

          <div className="category-preview__grid">
            {categories.map((c) => (
              <Link
                to={`/courses?categoryId=${c.id}`}
                key={c.id}
                className="category-card"
              >
                <div className="category-card__img">
                  <div className="category-card__img">
                    {c.thumbnail ? (
                      <img src={c.thumbnail} alt={c.name} loading="lazy" />
                    ) : (
                      <span className="category-card__emoji">
                        {EMOJI_MAP.default}
                      </span>
                    )}
                  </div>
                </div>
                <div className="category-card__body">
                  <div className="category-card__top">
                    <span className="category-card__category">{c.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
