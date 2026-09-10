import "../css/aboutme.css";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  FaDatabase,
  FaUsersCog,
  FaBriefcase,
} from "react-icons/fa";

const services = [
  {
    icon: <FaDatabase />,
    title: "أنظمة معلومات مخصصة",
    desc: "نقدم أنظمة معلومات تناسب حجم وطبيعة عمل الشركات، مصممة لتلبية احتياجاتكم بدقة.",
  },
  {
    icon: <FaUsersCog />,
    title: "تدريب الموظفين",
    desc: "تدريب الموظفين على العمل داخل هذه الأنظمة باحترافية عالية وكفاءة مثبتة.",
  },
  {
    icon: <FaBriefcase />,
    title: "تكليف المهام التخصصية",
    desc: "الحصول على تكاليف عمل المهام الخاصة بالشركات — محاسبة، موارد بشرية، وتسويق.",
  },
];

export default function AboutSection() {
  return (

    <div className="about-page"
    >
        <Navbar />
        
      {/* Background Effects */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      {/* WHO WE ARE */}
      <section className="who-we-are">

        <motion.div
          className="pattern-grid"
          initial={{ opacity: 0, x: -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {[...Array(9)].map((_, index) => (
            <div key={index} className="pattern-box">
              <span></span>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="who-content"
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >

          <h2>من نحن</h2>

          <p>
            نحن فريق من اختصاصات مختلفة لتقديم حلول متكاملة ومتنوعة تساعد
            الأفراد والشركات في تحقيق أهدافهم باحترافية عالية.
          </p>
        </motion.div>
      </section>

      {/* SERVICES */}
      <section className="services-section">

        <div className="section-heading">
          <h2>خدماتنا</h2>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <motion.div
              className="service-card"
              key={index}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
              }}
              viewport={{ once: true }}
            >
              <div className="service-icon">
                {service.icon}
              </div>

              <h3>{service.title}</h3>

              <p>{service.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MESSAGE */}
      <section className="message-section">

        <div className="section-heading center">
          <h2>رسالتنا</h2>
        </div>

        <motion.div
          className="message-card"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="quote">❝</div>

          <p>
            استثمار الخبرة العملية والمهنية الاحترافية وتقديمها للأفراد
            والشركات على شكل حلول جاهزة للتطبيق.
          </p>

          <div className="line"></div>
        </motion.div>
      </section>
      <Footer />
    </div>
  );
}