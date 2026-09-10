// src/pages/VerifyEmail.jsx
// الخادم هو من يتحقق من التوكن ثم يعيد التوجيه إلى هذه الصفحة بنتيجة جاهزة
import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const FAILURE_TEXT = {
  expired: "انتهت صلاحية رابط التفعيل، يمكنك طلب رابط جديد",
  already: "هذا الحساب مفعّل بالفعل، يمكنك تسجيل الدخول",
  invalid: "الرابط غير صالح أو تم استخدامه بالفعل",
};

export default function VerifyEmail() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isSuccess = pathname === "/verify-success";
  const reason = searchParams.get("reason") || "invalid";

  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => navigate("/"), 3000);
    return () => clearTimeout(timer);
  }, [isSuccess, navigate]);

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "100px",
        fontFamily: "Tajawal, sans-serif",
      }}
    >
      {isSuccess ? (
        <>
          <h2 style={{ color: "#482349" }}>✅ تم تفعيل حسابك بنجاح!</h2>
          <p>سيتم تحويلك للصفحة الرئيسية...</p>
        </>
      ) : (
        <>
          <h2 style={{ color: "red" }}>❌ {FAILURE_TEXT[reason] ?? FAILURE_TEXT.invalid}</h2>
          <p>
            <a href="/login" style={{ color: "#482349" }}>
              العودة لتسجيل الدخول
            </a>
          </p>
        </>
      )}
    </div>
  );
}
