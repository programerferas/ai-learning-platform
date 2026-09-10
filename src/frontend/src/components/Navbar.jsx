import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import "../css/Navbar.css";
import AvatarDropdown from "./ui/Avatardropdown";
import MyCoursesPanel from "../pages/Mycoursespanel";



export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { user, setUser } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);


  const isActive = (path) => location.pathname === path;

  const logout = async () => {
    await api.post("/auth/logout"); // clears the httpOnly cookie
    setUser(null);
  };

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`} dir="rtl">
      <div className="navbar__container">
        {/* Brand */}
        <div>
          <Link to="/" className="navbar__brand">
            <span>SQUARES</span>
          </Link>
        </div>
        {/* Desktop Links */}

        

        <div className="navbar__links">  {user && (user.role?.toUpperCase?.() === "ADMIN") && (
            <Link
              to="/admin"
              className={`navbar__link ${isActive("/admin") ? "navbar__link--active" : ""}`}
            >
              لوحة التحكم
            </Link>
          )}
          
          <Link
            to="/"
            className={`navbar__link ${isActive("/") ? "navbar__link--active" : ""}`}
          >
            الصفحة الرئيسية
          </Link>

          <Link
            to="/category"
            className={`navbar__link ${isActive("/category") ? "navbar__link--active" : ""}`}
          >
            الفئات
          </Link>

          <Link
            to="/courses"
            className={`navbar__link ${isActive("/courses") ? "navbar__link--active" : ""}`}
          >
            الدورات
          </Link>

        

          <Link
            to="/aboutme"
            className={`navbar__link ${isActive("/aboutme") ? "navbar__link--active" : ""}`}
          >
            من نحن
          </Link>

          <Link
            to="/contact"
            className={`navbar__link ${isActive("/contact") ? "navbar__link--active" : ""}`}
          >
            اتصل بنا
          </Link>
        </div>

        {/* Desktop Actions */}
        <div className="navbar__actions">
          {user ? (
            <>
              <AvatarDropdown
                user={user}
                onLogout={() => {
                  logout();
                  window.location.reload();
                }}
                onOpenMyCourses={() => setPanelOpen(true)}
              />
              <MyCoursesPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__btn navbar__btn--outline">
                تسجيل الدخول
              </Link>
              <Link to="/register" className="navbar__btn navbar__btn--primary">
                ابدأ التعلم الآن
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Hamburger */}
      <button
        className="navbar__hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar__mobile">
          <Link
            to="/"
            className="navbar__mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            الصفحة الرئيسية
          </Link>
          <Link
            to="/category"
            className="navbar__mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            الفئات
          </Link>
          <Link
            to="/courses"
            className="navbar__mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            الدورات
          </Link>
          {user && (user.role?.toUpperCase?.() === "ADMIN") && (
            <Link
              to="/admin"
              className="navbar__mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              لوحة التحكم
            </Link>
          )}
          <Link
            to="/aboutme"
            className="navbar__mobile-link"
            onClick={() => setMenuOpen(false)}
          >
            من نحن
          </Link>

          <div className="navbar__mobile-divider" />
          {user ? (
            <button onClick={logout} className="navbar__mobile-link">
              تسجيل الخروج
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="navbar__mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="navbar__mobile-link navbar__mobile-link--primary"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
