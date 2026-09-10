// pages/ReviewsPage.js
import { useEffect, useState } from "react";
import { FaStar, FaTrashAlt, FaSearch, FaClock } from "react-icons/fa";
import { getAllReviews, deleteReview } from "../../api/reviews";
import "../../css/ReviewsPage.css";

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllReviews()
      .then((res) => setReviews(res.data))
      .catch(() => setError("Failed to load reviews."))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (courseId, reviewId) => {
    try {
      await deleteReview(courseId, reviewId);
      setReviews((current) => current.filter((review) => review.id !== reviewId));
    } catch {
      setError("Failed to delete review.");
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === "all") return true;
    if (filter === "top") return review.rating >= 4;
    if (filter === "low") return review.rating <= 2;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h1><FaStar /> تقيمات الطلاب</h1>
        <div className="header-actions">
          <span className="pending-badge">{reviews.length} التقيمات</span>
          <button className="btn btn-outline"><FaSearch /> تحديث</button>
        </div>
      </div>

      {error && <div className="card" style={{ color: "#b91c1c" }}>{error}</div>}
      {loading ? (
        <div className="card">جاري تحميل التقيمات...</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3>كل التقيمات</h3>
            <div className="review-filters">
              <button
                className={`filter-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                الكل
              </button>
              <button
                className={`filter-btn ${filter === "top" ? "active" : ""}`}
                onClick={() => setFilter("top")}
              >
                الأعلى
              </button>
              <button
                className={`filter-btn ${filter === "low" ? "active" : ""}`}
                onClick={() => setFilter("low")}
              >
                الأدنى
              </button>
            </div>
          </div>

          <div className="reviews-list">
            {filteredReviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <span className="reviewer-name"><strong>{review.user?.name || review.user?.email}</strong></span>
                    <span className="review-rating">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <FaStar key={i} color={i < review.rating ? "#c19025" : "#ddd"} />
                        ))}
                    </span>
                  </div>
                  <div className="review-actions">
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(review.course.id, review.id)}
                    >
                      <FaTrashAlt /> احذف
                    </button>
                  </div>
                </div>
                <p className="review-text">{review.comment || "No comment provided."}</p>
                <div className="review-footer">
                  <span className="review-time"><FaClock /> {new Date(review.createdAt).toLocaleString()}</span>
                  <span className="review-status">{review.course?.title}</span>
                </div>
              </div>
            ))}
            {filteredReviews.length === 0 && <div>لا توجد تقيمات تطابق الفلتر الحالي.</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
