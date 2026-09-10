import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Navbar from "./../../components/Navbar";
import "../../css/Admindashboard.css";

const navItems = [
  { path: "", label: "الكل" },
  { path: "users", label: "المستخدمون" },
  { path: "courses", label: "الدورات" },
  { path: "lessons", label: "الدروس" },
  { path: "reviews", label: "التقيمات" },
  { path: "categories", label: "الفئات" },
  { path: "notifications", label: "الإشعارات" }
];

export default function AdminDashboard() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-loading">
        جاري تحميل لوحة التحكم...
      </div>
    );
  }

  return (
    
    <div className="admin-dashboard" 
    dir="rtl">
      <Navbar />
      <div className="admin-header1">
      
      </div>
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div>
            <h2>لوحة التحكم</h2>
            <p className="admin-subtitle">إدارة المستخدمين والدورات والدروس والتقييمات والفئات.</p>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              end={item.path === ""}
              to={item.path}
              className={({ isActive }) =>
                "admin-nav-link" + (isActive ? " admin-nav-link--active" : "")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="admin-content">
        
        <Outlet />
      </main>
    </div>
    
  );
}
