import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/contact.css";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { sendContactForm } from "../api/notifications";

// بعد إرسال ناجح يُقفل الزر لهذه المدة — يُحفظ في localStorage حتى لا يفيد تحديث الصفحة
const COOLDOWN_MS = 60 * 1000;
const COOLDOWN_KEY = "contact:lastSentAt";

const EMPTY_FORM = {
  fname: "",
  lname: "",
  email: "",
  phone: "",
  message: "",
  website: "", // honeypot — مخفي عن البشر، البوتات تملؤه
};

const readLastSentAt = () => {
  try {
    return Number(localStorage.getItem(COOLDOWN_KEY)) || 0;
  } catch {
    return 0;
  }
};

export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(() =>
    Math.max(0, readLastSentAt() + COOLDOWN_MS - Date.now()),
  );
  const socialRef = useRef(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  // لا يُسمح بإرسال الرسائل إلا للمستخدمين المسجّلين دخولهم
  const isGuest = !authLoading && !user;

  /* ── Cooldown countdown ── */
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = setInterval(() => {
      setCooldownLeft(Math.max(0, readLastSentAt() + COOLDOWN_MS - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownLeft]);

  /* ── Scroll reveal ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.15 }
    );
    if (socialRef.current) observer.observe(socialRef.current);
    return () => observer.disconnect();
  }, []);

  /* ── Handlers ── */
  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (loading || cooldownLeft > 0) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (!form.fname || !form.email || !form.message) {
      setFeedback({
        type: "error",
        text: "⚠️ يرجى تعبئة الحقول المطلوبة: الاسم، البريد الإلكتروني، والرسالة.",
      });
      return;
    }
    if (form.message.trim().length < 10) {
      setFeedback({
        type: "error",
        text: "⚠️ الرسالة قصيرة جداً — اكتب 10 أحرف على الأقل.",
      });
      return;
    }

    setLoading(true);
    setFeedback({ type: "", text: "" });

    try {
      await sendContactForm(form);
      setFeedback({
        type: "success",
        text: "✅ شكراً لتواصلكم! سنرد عليكم في أقرب وقت ممكن.",
      });
      setForm(EMPTY_FORM);
      try {
        localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      } catch {
        /* التخزين المحلي غير متاح — نكتفي بالحد في الباكند */
      }
      setCooldownLeft(COOLDOWN_MS);
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      setFeedback({
        type: "error",
        text:
          status === 429
            ? `⏳ ${serverMsg || "لقد أرسلت رسائل كثيرة. يرجى المحاولة لاحقاً."}`
            : status === 400 && serverMsg
              ? `⚠️ ${serverMsg}`
              : "❌ حدث خطأ أثناء إرسال الرسالة. حاول مرة أخرى.",
      });
    } finally {
      setLoading(false);
    }
  };

  const cooldownSeconds = Math.ceil(cooldownLeft / 1000);

  /* ── Info items data ── */
  const infoItems = [
    { icon: "📞", label: "الهاتف",             value: "+966 5X XXX XXXX" },
    { icon: "✉️", label: "البريد الإلكتروني",  value: "info@yourbrand.com" },
    { icon: "🕐", label: "ساعات العمل",         value: "الأحد – الخميس\n٩:٠٠ ص – ٦:٠٠ م" },
    { icon: "📍", label: "الموقع",              value: "الرياض، المملكة العربية السعودية" },
  ];

  const socialLinks = [
    { icon: "🔗", label: "لينكدإن",  href: "#" },
    { icon: "📸", label: "انستغرام", href: "#" },
    { icon: "💬", label: "واتساب",   href: "#" },
  ];

  /* ── JSX ── */
  return (
    <div className="contact-page">
      <Navbar />

      {/* ── HERO ── */}
      <section className="contact-hero">
        <div className="hero-circle c1" />
        <div className="hero-circle c2" />
        <div className="hero-circle c3" />

        <div className="hero-badge">
          <div className="hero-dot" />
          نحن هنا لمساعدتكم
        </div>

        <h1>
          تواصل <em>معنا</em>
        </h1>
        <p>
          لا تتردد في التواصل معنا — فريقنا جاهز للإجابة على استفساراتكم وتقديم أفضل الحلول.
        </p>

        <div className="hero-float-icons">
          {["📞", "✉️", "💬"].map((ico, i) => (
            <div className="hero-float-icon" key={i}>{ico}</div>
          ))}
        </div>
      </section>

      {/* ── MAIN GRID ── */}
      <div className="contact-main">

        {/* INFO COLUMN */}
        <div className="info-col">

          {/* contact info card */}
          <div className="info-card">
            <div className="info-card-title">✦ معلومات التواصل</div>
            {infoItems.map((item, i) => (
              <div className="info-item" key={i}>
                <div className="info-icon">{item.icon}</div>
                <div>
                  <div className="info-label">{item.label}</div>
                  <div className="info-value" style={{ whiteSpace: "pre-line" }}>
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* social card */}
          <div className="social-card reveal" ref={socialRef}>
            <div className="social-title">تابعنا على منصات التواصل</div>
            <div className="social-row">
              {socialLinks.map((s, i) => (
                <a href={s.href} className="social-btn" key={i}>
                  <span className="social-ico">{s.icon}</span>
                  {s.label}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* FORM COLUMN */}
        <div className="form-col">
          <div className="form-card">

            <div className="form-header">
              <div className="form-title">أرسل لنا رسالة</div>
              <div className="form-sub">
                سنقوم بالرد عليكم خلال ساعات العمل في أقرب وقت ممكن.
              </div>
              <div className="gold-line" />
            </div>

            {/* name row */}
            <div className="form-row">
              <div className="field">
                <label>الاسم الأول</label>
                <input
                  type="text"
                  name="fname"
                  value={form.fname}
                  onChange={handleChange}
                  placeholder="محمد"
                  disabled={isGuest}
                />
              </div>
              <div className="field">
                <label>الاسم الأخير</label>
                <input
                  type="text"
                  name="lname"
                  value={form.lname}
                  onChange={handleChange}
                  placeholder="أحمد"
                  disabled={isGuest}
                />
              </div>
            </div>

            {/* email */}
            <div className="field field-ltr">
              <label>البريد الإلكتروني</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@domain.com"
                disabled={isGuest}
              />
            </div>

            {/* phone */}
            <div className="field field-ltr">
              <label>رقم الجوال</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="05X XXX XXXX"
                disabled={isGuest}
              />
            </div>

            {/* message */}
            <div className="field">
              <label>رسالتك</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="اكتب تفاصيل احتياجاتكم هنا..."
                maxLength={2000}
                disabled={isGuest}
              />
            </div>

            {/* honeypot — لا يُعرض للبشر ولا يصل إليه Tab؛ البوتات تملؤه فيرفضه الباكند بصمت */}
            <div className="hp-field" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                type="text"
                name="website"
                value={form.website}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* submit — للزوار نعرض دعوة لتسجيل الدخول بدلاً من زر الإرسال */}
            {isGuest ? (
              <div className="login-required">
                <span className="login-required-ico">🔒</span>
                <div>
                  <div className="login-required-title">يجب تسجيل الدخول لإرسال رسالة</div>
                  <div className="login-required-sub">
                    <Link to="/login">سجّل الدخول</Link> أو{" "}
                    <Link to="/register">أنشئ حساباً جديداً</Link> للتواصل معنا.
                  </div>
                </div>
              </div>
            ) : (
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={loading || authLoading || cooldownLeft > 0}
            >
              <span>
                {loading
                  ? "جاري الإرسال..."
                  : cooldownLeft > 0
                    ? `يمكنك الإرسال مجدداً بعد ${cooldownSeconds} ث`
                    : "إرسال الرسالة"}
              </span>
              <span className="submit-icon">✦</span>
            </button>
            )}

            {/* feedback */}
            {feedback.text && (
              <div className={`feedback ${feedback.type}`}>
                {feedback.text}
              </div>
            )}

          </div>
        </div>

      </div>

      <Footer />

    </div>
  );
}