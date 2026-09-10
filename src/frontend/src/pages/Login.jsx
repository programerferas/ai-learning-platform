import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { login as loginApi } from "../api/auth"; 
import "../css/login.css";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ── تحقق frontend ──
    if (!form.email || !form.password) {
      setError("يرجى تعبئة جميع الحقول");
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi({
        email: form.email,
        password: form.password,
      });

      setUser(res.data.user);
      const role = res.data.user.role?.toUpperCase?.();
      navigate(role === "ADMIN" ? "/admin" : "/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-brand">SQUARES</div>

        <p className="login-subtitle">يرجى تسجيل الدخول للمتابعة</p>

        {error && <div className="login-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit} dir="rtl">
          {/* البريد الإلكتروني */}
          <div className="login-field">
            <label className="login-label">البريد الإلكتروني</label>
            <input
              type="email"
              name="email"
              className="login-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* كلمة المرور */}
          <div className="login-field">
            <label className="login-label">كلمة المرور</label>
            <div className="login-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="login-input"
                placeholder="ادخل كلمة المرور"
                value={form.password}
                onChange={handleChange}
                required
              />
              <span
                className="login-eye"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁"}
              </span>
            </div>
          </div>

          {/* نسيت كلمة المرور */}
          <div className="login-forgot-wrap">
            <Link to="/auth/forgot-password" className="login-forgot">
              نسيت كلمة المرور؟
            </Link>
          </div>

          {/* زر الدخول */}
          <button
            type="submit"
            disabled={loading}
            className={`login-btn ${loading ? "login-btn--loading" : ""}`}
          >
            {loading ? "جارِ تسجيل الدخول..." : "تسجيل الدخول"}
          </button>

          <p className="login-switch">
            لا تملك حساباً؟{" "}
            <Link to="/register" className="login-link">
              أنشئ واحداً
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
