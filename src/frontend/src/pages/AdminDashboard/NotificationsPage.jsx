// pages/NotificationsPage.js
import { useEffect, useState } from "react";
import { FaBell, FaTrashAlt, FaEnvelopeOpen, FaEnvelope, FaClock } from "react-icons/fa";
import {
  getAllNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../../api/notifications";
import "../../css/NotificationsPage.css";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = () => {
    setLoading(true);
    getAllNotifications()
      .then((res) => setNotifications(res.data))
      .catch(() => setError("Failed to load notifications."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
  let ignore = false;

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllNotifications();
      if (!ignore) setNotifications(res.data);
    } catch {
      if (!ignore) setError("Failed to load notifications.");
    } finally {
      if (!ignore) setLoading(false);
    }
  };

  load();

  return () => {
    ignore = true;
  };
}, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((current) =>
        current.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      setError("Failed to mark as read.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((current) => current.filter((n) => n.id !== id));
    } catch {
      setError("Failed to delete notification.");
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="page-header">
        <h1><FaBell /> الاشعارات</h1>
        <div className="header-actions">
          <span className="pending-badge">{unreadCount} غير مقروءة</span>
          <button className="btn btn-outline" onClick={fetchNotifications}>
            تحديث
          </button>
        </div>
      </div>

      {error && <div className="card" style={{ color: "#b91c1c" }}>{error}</div>}

      {loading ? (
        <div className="card">جاري تحميل الاشعارات...</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3>كل الرسائل</h3>
            <div className="review-filters">
              <button
                className={`filter-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                الكل
              </button>
              <button
                className={`filter-btn ${filter === "unread" ? "active" : ""}`}
                onClick={() => setFilter("unread")}
              >
                غير مقروءة
              </button>
              <button
                className={`filter-btn ${filter === "read" ? "active" : ""}`}
                onClick={() => setFilter("read")}
              >
                مقروءة
              </button>
            </div>
          </div>

          <div className="reviews-list">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                className="review-item"
                style={{ opacity: n.isRead ? 0.7 : 1 }}
              >
                <div className="review-header">
                  <div className="reviewer-info">
                    <span className="reviewer-name">
                      <strong>{n.fname} {n.lname}</strong>
                    </span>
                    <span style={{ fontSize: "13px", color: "#666" }}>
                      {n.email} {n.phone && `· ${n.phone}`}
                    </span>
                  </div>
                  <div className="review-actions">
                    {!n.isRead && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleMarkAsRead(n.id)}
                        title="Mark as read"
                      >
                        <FaEnvelopeOpen /> تحديد كمقروء
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(n.id)}
                    >
                      <FaTrashAlt /> احذف
                    </button>
                  </div>
                </div>
                <p className="review-text">{n.message}</p>
                <div className="review-footer">
                  <span className="review-time">
                    <FaClock /> {new Date(n.createdAt).toLocaleString()}
                  </span>
                  <span className="review-status">
                    {n.isRead ? (
                      <><FaEnvelopeOpen /> مقروء</>
                    ) : (
                      <><FaEnvelope /> غير مقروء</>
                    )}
                  </span>
                </div>
              </div>
            ))}
            {filteredNotifications.length === 0 && (
              <div>لا توجد اشعارات تطابق الفلتر الحالي.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;