import { useState, useEffect, useRef } from "react";
import "../css/contact.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { sendContactForm } from "../api/notifications";

export default function Contact() {
  const [form, setForm] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    message: "",
  });
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const socialRef = useRef(null);

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
    if (!form.fname || !form.email || !form.message) {
      setFeedback({
        type: "error",
        text: "⚠️ يرجى تعبئة الحقول المطلوبة: الاسم، البريد الإلكتروني، والرسالة.",
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
      setForm({ fname: "", lname: "", email: "", phone: "", message: "" });
    } catch (err) {
      setFeedback({
        type: "error",
        text: "❌ حدث خطأ أثناء إرسال الرسالة. حاول مرة أخرى.",
      });
    } finally {
      setLoading(false);
    }
  };

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
              />
            </div>

            {/* submit */}
            <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
              <span>{loading ? "جاري الإرسال..." : "إرسال الرسالة"}</span>
              <span className="submit-icon">✦</span>
            </button>

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