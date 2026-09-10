import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPasswordRequest } from "../api/auth";
import "../css/Resetpassword.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ loading: false, error: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus({ loading: false, error: "كلمتا المرور غير متطابقتين" });
      return;
    }

    setStatus({ loading: true, error: "" });

    try {
      await resetPasswordRequest(token, password);
      navigate("/login", {
        state: { message: "تم تغيير كلمة المرور بنجاح، سجل دخولك الآن" },
      });
    } catch (err) {
      setStatus({
        loading: false,
        error:
          err.response?.data?.message || "الرابط غير صالح أو منتهي الصلاحية",
      });
    }
  };

  return (
    <div className="reset-password-container">
      <h2>إعادة تعيين كلمة المرور</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="كلمة المرور الجديدة"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <input
          type="password"
          placeholder="تأكيد كلمة المرور"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />
        {status.error && <p className="error-msg">{status.error}</p>}
        <button type="submit" disabled={status.loading}>
          {status.loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور الجديدة"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
