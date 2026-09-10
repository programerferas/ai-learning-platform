// components/InstructorCard.jsx

export default function InstructorCard() {
  return (
    <section className="instructor-card glass-panel anim-enter anim-delay-2">
      <p className="instructor-card__label">المحاضر</p>
      <div className="instructor-card__row">
        <div className="instructor-card__avatar">
          <div className="instructor-card__avatar-inner">
            <span className="material-symbols-outlined">person</span>
          </div>
        </div>
        <div>
          <p className="instructor-card__name">م. أحمد خالد</p>
          <p className="instructor-card__role">خبير واجهات أمامية</p>
        </div>
        <button className="instructor-card__mail-btn" aria-label="إرسال بريد">
          <span className="material-symbols-outlined">mail</span>
        </button>
      </div>
    </section>
  );
}