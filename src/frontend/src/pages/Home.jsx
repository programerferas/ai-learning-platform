import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../css/Home.css";
import heroImage from "@/assets/fotos/human.png";

const FEATURES = [
  {
    icon: "🎓",
    title: "مدرّسون خبراء",
    desc: "تعلّم من خبراء في المجال لديهم أكثر من 10 سنوات من الخبرة العملية.",
  },
  {
    icon: "🤖",
    title: "مدرّس ذكي بالذكاء الاصطناعي",
    desc: "احصل على مساعدة مخصصة على مدار الساعة من مساعدك الذكي في الدراسة.",
  },
  {
    icon: "🏆",
    title: "شهادات موثّقة",
    desc: "احصل على شهادات معترف بها في المجال تساعدك على تطوير مسارك المهني.",
  },
  {
    icon: "📱",
    title: "تعلّم في أي مكان",
    desc: "ادخل إلى جميع الدورات من أي جهاز وفي أي وقت وبالسرعة التي تناسبك.",
  },
  {
    icon: "👑",
    title: "طور من مهارات القيادية",
    desc: "كن قياديًا بالأفعال قبل الأقوال، فالقائد الحقيقي يُلهم الآخرين بما يفعله لا بما يقوله.",
  },
];

export default function Home() {
  return (
    <div className="home" dir="rtl">
      <Navbar />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero__wrapper">
           <div className="hero-circle c1" />
          <div className="hero-circle c2" />
          <div className="hero-circle c3" />
          <div className="hero__image">
            <img src={heroImage} alt="Hero Image" />
          </div>
          <div className="hero__content">
            <span className="hero__badge">✦ منصة تعليمية متميزة</span>
            <p className="hero__title">
              اجعل مهاراتك تتفوق مع <br /><span>التعليم القيادي</span>
            </p>
            <p className="hero__subtitle">
              دورات من الطبقة الأولى من قادة الصناعة. تعلم بسرعة نفسك، اكسب
              شهادات تهم، وابني مسيرتك التي تستحقها.
            </p>
            <div className="hero__actions">
              <Link to="/courses" className="hero__btn hero__btn--gold">تصفح الدورات</Link>
              <Link to="/category" className="hero__btn hero__btn--outline">ابدأ التعلم الآن مجانا</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            كل ما تحتاجه لتطوير مهاراتك وتحقيق أهدافك المهنية في مكان واحد
          </div>
          <div className="features__grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="feature-card__icon">{f.icon}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-banner">
        <div className="container">
          <h2 className="cta-banner__title">هل أنت مستعد لتحويل مسيرتك؟</h2>
          <p className="cta-banner__sub">انضم إلى أكثر من 340,000 طالب يتعلمون بالفعل</p>
          <Link to="/courses" className="cta-banner__btn">ابدأ التعلم الآن مجانا</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}