import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../css/AvatarDropdown.css";

export default function AvatarDropdown({ user, onLogout, onOpenMyCourses }) {
  const [open, setOpen] = useState(false);

  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const close = () => setOpen(false);

  return (
    <div className="avatar-dropdown" ref={ref}>
      <button
        className={`avatar-dropdown__trigger ${open ? "avatar-dropdown__trigger--open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        title={user?.name}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span>{user?.name?.charAt(0).toUpperCase()}</span>
      </button>

      {open && (
        <div className="avatar-dropdown__menu" role="menu">
          {/* Header */}
          <div className="avatar-dropdown__header">
            <div className="avatar-dropdown__avatar-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="avatar-dropdown__user-info">
              <span className="avatar-dropdown__name">{user?.name}</span>
              <span className="avatar-dropdown__email">{user?.email}</span>
            </div>
          </div>

          <div className="avatar-dropdown__divider" />

          <Link
            to="/account-settings"
            className="avatar-dropdown__item"
            onClick={close}
            role="menuitem"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            إعدادات الحساب
          </Link>

          <button
            className="avatar-dropdown__item"
            onClick={() => {
              close();
              onOpenMyCourses();
            }}
            role="menuitem"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9l6 3-6 3V9z" />
            </svg>
            دوراتي
          </button>

          <div className="avatar-dropdown__divider" />

          <button
            className="avatar-dropdown__item avatar-dropdown__item--danger"
            onClick={() => {
              onLogout();
              close();
            }}
            role="menuitem"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            تسجيل الخروج
          </button>
        </div>
      )}
    </div>
  );
}
