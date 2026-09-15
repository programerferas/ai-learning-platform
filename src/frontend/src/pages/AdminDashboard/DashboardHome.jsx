import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaBookOpen, FaVideo, FaStar,  FaGlobe   } from "react-icons/fa";
import { getDashboardOverview } from "../../api/dashboard";
import "../../css/Dashboardhome.css";

const DashboardHome = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalLessons: 0,
    totalReviews: 0,
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardOverview()
      .then((res) => setOverview(res.data.data))
      .catch(() => setError("Unable to load dashboard overview."))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "عدد المستخدمين", value: overview.totalUsers, icon: <FaUsers />, color: "#c19025" },
    { label: "عدد الدروس", value: overview.totalLessons, icon: <FaBookOpen />, color: "#482349" },
    { label: "عدد الدورات", value: overview.totalCourses, icon: <FaVideo />, color: "#2b7a4b" },
    { label: "التقيمات", value: overview.totalReviews, icon: <FaStar />, color: "#b13e4b" },
  ];

  const quickActions = [
    {
      label: "إضافة درس",
      icon: <FaBookOpen />,
      onClick: () => navigate("lessons?action=create"),
    },
    {
      label: "إضافة دورة",
      icon: <FaVideo />,
      onClick: () => navigate("courses?action=create"),
    },
    {
      label: "اعدادات المستخدم",
      icon: <FaUsers />,
      onClick: () => navigate("users?action=create"),
    },
    {
      label: " اضف فئاة",
      icon:  <FaGlobe />,
      onClick: () => navigate("categories?action=create"),
     
    },
  ];

  return (
    <div>
      <h1 className="page-heading">لوحة التحكم</h1>

      {error && <div className="card" style={{ color: "#b91c1c" }}>{error}</div>}

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: stat.color + "20", color: stat.color }}
            >
              {stat.icon}
            </div>
            <div className="stat-info">
              <span className="stat-value">{loading ? "..." : stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3><FaUsers /> النشاط الأخير</h3>
          {loading ? (
            <div>جاري تحميل النشاط الأخير...</div>
          ) : (
            <div className="activity-list">
              {overview.recentActivities?.length > 0 ? (
                overview.recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-user">{activity.user}</div>
                    <div className="activity-action">{activity.action}</div>
                    <div className="activity-time">
                      {activity.time === "just now"
                        ? activity.time
                        : new Date(activity.time).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div>لم يتم إيجاد نشاط حديث.</div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h2>إجراءات سريعة</h2>
          <div className="quick-actions">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className={action.outline ? "btn btn-outline" : "btn btn-primary"}
                onClick={action.onClick}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;