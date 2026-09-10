import { useState } from "react";
import { forgotPasswordRequest } from "../api/auth";
import "../css/forgotpass.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({
    loading: false,
    sent: false,
    error: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, sent: false, error: "" });

    try {
      await forgotPasswordRequest(email);
      setStatus({ loading: false, sent: true, error: "" });
    } catch (err) {
      setStatus({
        loading: false,
        sent: false,
        error: err.response?.data?.message || "حدث خطأ، حاول مرة أخرى",
      });
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>نسيت كلمة المرور؟</h2>

      {status.sent ? (
        <p className="success-msg">
          إذا كان البريد الإلكتروني مسجلاً لدينا، تم إرسال رابط إعادة التعيين
          إليه.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {status.error && <p className="error-msg">{status.error}</p>}
          <button type="submit" disabled={status.loading}>
            {status.loading ? "جارٍ الإرسال..." : "إرسال رابط إعادة التعيين"}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
