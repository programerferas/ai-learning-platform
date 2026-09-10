// AccountSettings.jsx
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { updateProfile, changePassword } from "../api/auth";
import { useNavigate } from "react-router-dom";
import "../css/AccountSettings.css";

export default function AccountSettings() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phoneNumber: user?.phoneNumber || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await updateProfile(profileForm);
      setUser((prev) => ({ ...prev, ...res.data.user }));
      setProfileMsg({ type: "success", text: "تم تحديث الملف الشخصي بنجاح" });
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || "حدث خطأ ما",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setPasswordMsg({
        type: "error",
        text: "كلمتا المرور غير متطابقتين",
      });
    }
    setPasswordLoading(true);
    try {
      (await changePassword(passwordForm),
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        });
      setPasswordMsg({ type: "success", text: "تم تغيير كلمة المرور بنجاح" });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "حدث خطأ ما",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        {" "}
        <button
          className="settings-close"
          onClick={() => navigate(-1)}
          title="إغلاق"
        >
          ✕
        </button>
        <h1 className="settings-title">إعدادات الحساب</h1>
        {/* Profile Section */}
        <section className="settings-card">
          <h2 className="card-title">المعلومات الشخصية</h2>
          <form onSubmit={handleProfileSubmit} className="settings-form">
            <div className="form-group">
              <label htmlFor="name">الاسم الكامل</label>
              <input
                id="name"
                name="name"
                type="text"
                value={profileForm.name}
                onChange={handleProfileChange}
                placeholder="أدخل اسمك"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber">رقم الهاتف</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={profileForm.phoneNumber}
                onChange={handleProfileChange}
                placeholder="+963 9XX XXX XXX"
              />
            </div>
            {profileMsg && (
              <p className={`form-msg ${profileMsg.type}`}>{profileMsg.text}</p>
            )}
            <button
              type="submit"
              className="btn-save"
              disabled={profileLoading}
            >
              {profileLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </form>
        </section>
        {/* Password Section */}
        <section className="settings-card">
          <h2 className="card-title">تغيير كلمة المرور</h2>
          <form onSubmit={handlePasswordSubmit} className="settings-form">
            <div className="form-group">
              <label htmlFor="currentPassword">كلمة المرور الحالية</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">كلمة المرور الجديدة</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">تأكيد كلمة المرور</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
              />
            </div>
            {passwordMsg && (
              <p className={`form-msg ${passwordMsg.type}`}>
                {passwordMsg.text}
              </p>
            )}
            <button
              type="submit"
              className="btn-save"
              disabled={passwordLoading}
            >
              {passwordLoading ? "جاري التغيير..." : "تغيير كلمة المرور"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
