import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { register as registerApi } from "../api/auth";
import "../css/Register.css";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber:"",
    password: "",
    confirmPassword: "",
  });
  const [error, setError]   = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrors({});

    // ── تحقق frontend ──
    if (form.name.trim().length < 3) {
  setError("الاسم يجب أن يكون على الأقل 3 أحرف");
  return;
}

if (form.phoneNumber.length < 10) {
  setError("رقم الهاتف يجب أن يكون 10 أرقام");
  return;
}

if (form.password.length < 8) {
  setError("كلمة المرور يجب أن تكون على الأقل 8 أحرف");
  return;
}

if (form.password !== form.confirmPassword) {
  setError("كلمتا المرور غير متطابقتين");
  return;
}

    setLoading(true);
    try {
      const res = await registerApi({
        name:     form.name,
        email:    form.email,
        phoneNumber: form.phoneNumber,
        password: form.password,
      });
      setUser(res.data.user);
      navigate("/loginE") 
    } catch (err) {
      const data = err.response?.data;

      if (data?.errors) {
        // أخطاء الـ zod — تظهر تحت كل حقل
        const fieldErrors = {};
        data.errors.forEach((e) => {
          fieldErrors[e.field] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        // خطأ عام زي "البريد مستخدم بالفعل"
        setError(data?.message || "فشل التسجيل");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        <div className="auth-brand">
          <span>SQUARES</span>
        </div>
        <p className="auth-subtitle">أنشئ حسابك وابدأ التعلم</p>

        {error && <div className="auth-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit} dir="rtl">
          <Field
            label="الاسم الكامل"
            name="name"
            type="text"
            placeholder="الاسم الكامل"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />


          <Field
            label="عنوان البريد الإلكتروني"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />

          <Field
            label="رقم الهاتف"
            name="phoneNumber"
            type="string"
            placeholder="0912345678"
            value={form.phoneNumber}
            onChange={handleChange}
            error={errors.phoneNumber}/>

          <Field
            label="كلمة المرور"
            name="password"
            type="password"
            placeholder="كلمة المرور"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          <Field
            label="تأكيد كلمة المرور"
            name="confirmPassword"
            type="password"
            placeholder="تأكيد كلمة المرور"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          <div className="auth-terms">
            *يجب أن تكون كلمة المرور على الأقل 8 أحرف وأن تحتوي على حرف كبير وحرف صغير ورقم.
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`auth-btn ${loading ? "auth-btn--loading" : ""}`}
          >
            {loading ? "جاري انشاء الحساب..." : "انشئ حساب"}
          </button>
        </form>

        <p className="auth-switch">
          انا لدي حساب بالفعل{" "}
          <Link to="/login" className="auth-link">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, name, type, placeholder, value, onChange, error }) {
  return (
    <div className="auth-field">
      <label className="auth-label">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className={`auth-input ${error ? "auth-input--error" : ""}`}
      />
      {error && <span className="auth-field-error">⚠ {error}</span>}
    </div>
  );
}