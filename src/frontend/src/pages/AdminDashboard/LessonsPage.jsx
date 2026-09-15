// pages/LessonsPage.js
import { useEffect, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaSearch,
  FaBookOpen,
  FaTimes,
} from "react-icons/fa";
import {
  getAllLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  uploadLessonVideo,
} from "../../api/Lesson";
import { AiSummaryCard } from "./AiSummaryCard";
import { getCourses } from "../../api/courses";
import "../../css/Lessonspage.css";

const EMPTY_FORM = {
  title: "",
  content: "",
  courseId: "",
  order: "",
};

// الحد الأقصى لحجم الفيديو — يطابق MAX_VIDEO_SIZE_BYTES في الباكند
const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024;

const LessonsPage = () => {
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editLesson, setEditLesson] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Video file (uploaded straight to storage on save)
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    Promise.all([getAllLessons(), getCourses()])
      .then(([lessonsData, coursesRes]) => {
        // getAllLessons() already resolves to .data (array, per your earlier log)
        setLessons(
          Array.isArray(lessonsData)
            ? lessonsData
            : (lessonsData?.lessons ?? []),
        );

        // getCourses() is the raw axios response, so unwrap .data here
        setCourses(coursesRes.data?.courses ?? []);
      })
      .catch(() => setError("فشل تحميل البيانات."))
      .finally(() => setLoading(false));
  }, []);

  // ── CRUD ──
  const openCreate = () => {
    setEditLesson(null);
    setForm(EMPTY_FORM);
    setVideoFile(null);
    setUploadProgress(null);
    setFormError("");
    setFieldErrors({});
    setShowModal(true);
  };

  const openEdit = (lesson) => {
    setEditLesson(lesson);
    setForm({
      title: lesson.title || "",
      content: lesson.content || "",
      courseId: lesson.course?.id?.toString() || "",
      order: lesson.order?.toString() || "",
    });
    setVideoFile(null);
    setUploadProgress(null);
    setFormError("");
    setFieldErrors({});
    setShowModal(true);
  };

  const clearFieldError = (name) =>
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });

  const setFieldError = (name, message) =>
    setFieldErrors((prev) => ({ ...prev, [name]: message }));

  // تحديث حقل مع مسح خطئه فور أن يبدأ المستخدم بالتصحيح
  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return setVideoFile(null);
    if (!file.type.startsWith("video/")) {
      e.target.value = "";
      setVideoFile(null);
      return setFieldError("video", "الملف يجب أن يكون فيديو.");
    }
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      e.target.value = "";
      setVideoFile(null);
      return setFieldError("video", "حجم الفيديو يتجاوز الحد المسموح (500 ميجابايت).");
    }
    clearFieldError("video");
    setVideoFile(file);
  };

  // نفس قواعد createLessonSchema في الـ backend
  const validateForm = () => {
    const errors = {};
    const title = form.title.trim();
    if (!title) errors.title = "عنوان الدرس مطلوب.";
    else if (title.length < 3)
      errors.title = "عنوان الدرس يجب أن يكون 3 أحرف على الأقل.";
    else if (title.length > 100)
      errors.title = "عنوان الدرس يجب ألا يتجاوز 100 حرف.";

    if (!form.courseId) errors.courseId = "يجب اختيار الكورس.";

    if (form.order !== "" && form.order !== undefined) {
      const n = Number(form.order);
      if (!Number.isInteger(n) || n < 0)
        errors.order = "الترتيب يجب أن يكون رقماً صحيحاً غير سالب.";
    }

    // الباكند يشترط فيديو عند الإنشاء؛ عند التعديل يبقى الفيديو القديم إن لم يُختر ملف
    if (!editLesson && !videoFile) errors.video = "فيديو الدرس مطلوب.";

    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      return setFormError("يرجى تصحيح الحقول المحددة بالأحمر.");
    }
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        courseId: form.courseId,
        order: form.order ? Number(form.order) : undefined,
      };

      if (videoFile) {
        setUploadProgress(0);
        payload.videoKey = await uploadLessonVideo(videoFile, setUploadProgress);
      }

      if (editLesson) {
        const res = await updateLesson(editLesson.id, payload);
        setLessons((prev) =>
          prev.map((l) => (l.id === editLesson.id ? res : l)),
        );
      } else {
        const res = await createLesson(payload);
        setLessons((prev) => [res, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      // الـ backend يعيد errors: [{ field, message }] من zod — نوزّعها على الحقول
      const data = err?.response?.data;
      const backendErrors = {};
      for (const e of data?.errors ?? []) {
        const field = e.field === "videoKey" ? "video" : e.field;
        if (field && !backendErrors[field]) backendErrors[field] = e.message;
      }
      setFieldErrors(backendErrors);
      setFormError(
        Object.keys(backendErrors).length
          ? "يرجى تصحيح الحقول المحددة بالأحمر."
          : data?.message || "فشل حفظ الدرس.",
      );
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLesson(deleteTarget.id);
      setLessons((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    } catch {
      setError("فشل حذف الدرس.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredLessons = lessons.filter(
    (l) =>
      (l.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.course?.title || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div dir="rtl">
      <div className="page-header">
        <h1>
          <FaBookOpen /> إدارة الدروس
        </h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <FaPlus /> درس جديد
        </button>
      </div>

      {error && (
        <div
          className="card"
          style={{
            color: "#b91c1c",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {error}
          <FaTimes style={{ cursor: "pointer" }} onClick={() => setError("")} />
        </div>
      )}

      {loading ? (
        <div className="card">جاري التحميل...</div>
      ) : (
        <>
          {/* ── Table ── */}
          <div className="card">
            <div className="card-header">
              <h3>جميع الدروس</h3>
              <div className="search-bar">
                <FaSearch />
                <input
                  type="text"
                  placeholder="ابحث عن درس أو كورس..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>العنوان</th>
                    <th>الكورس</th>
                    <th>الترتيب</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLessons.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ textAlign: "center", color: "#888" }}
                      >
                        لا توجد دروس
                      </td>
                    </tr>
                  )}
                  {filteredLessons.map((lesson, i) => (
                    <tr key={lesson.id}>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{lesson.title}</strong>
                      </td>
                      <td>
                        {lesson.course?.title || (
                          <span style={{ color: "#aaa" }}>غير محدد</span>
                        )}
                      </td>
                      <td>{lesson.order ?? "—"}</td>
                      <td style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => openEdit(lesson)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{
                            color: "#b91c1c",
                            background: "#fee2e2",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            padding: "4px 8px",
                          }}
                          onClick={() => setDeleteTarget(lesson)}
                        >
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editLesson ? "تعديل الدرس" : "إضافة درس جديد"}</h2>
              <FaTimes
                style={{ cursor: "pointer" }}
                onClick={() => setShowModal(false)}
              />
            </div>
            <div className="modal-body">
              {formError && (
                <div className="modal-error">
                  {formError}
                  <FaTimes
                    style={{ cursor: "pointer" }}
                    onClick={() => setFormError("")}
                  />
                </div>
              )}

              <label>عنوان الدرس *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="أدخل عنوان الدرس"
                className={fieldErrors.title ? "input-error" : ""}
              />
              {fieldErrors.title && (
                <small className="field-error">{fieldErrors.title}</small>
              )}

              <label>الكورس *</label>
              <select
                value={form.courseId}
                onChange={(e) => setField("courseId", e.target.value)}
                className={fieldErrors.courseId ? "input-error" : ""}
              >
                <option value="">-- اختر الكورس --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              {fieldErrors.courseId && (
                <small className="field-error">{fieldErrors.courseId}</small>
              )}

              <label>الترتيب</label>
              <input
                type="number"
                min="1"
                value={form.order}
                onChange={(e) => setField("order", e.target.value)}
                placeholder="1"
                className={fieldErrors.order ? "input-error" : ""}
              />
              {fieldErrors.order && (
                <small className="field-error">{fieldErrors.order}</small>
              )}

              <label>فيديو الدرس {editLesson ? "" : "*"}</label>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                disabled={saving}
                className={fieldErrors.video ? "input-error" : ""}
              />
              {fieldErrors.video && (
                <small className="field-error">{fieldErrors.video}</small>
              )}
              {videoFile ? (
                <small style={{ color: "#555", display: "block", marginTop: 4 }}>
                  {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                </small>
              ) : (
                editLesson?.videoUrl && (
                  <small style={{ color: "#888", display: "block", marginTop: 4 }}>
                    يوجد فيديو محفوظ — اختر ملفاً جديداً لاستبداله
                  </small>
                )
              )}
              {uploadProgress !== null && (
                <div style={{ marginTop: 6 }}>
                  <div
                    style={{
                      height: 6,
                      background: "#e5e7eb",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${uploadProgress}%`,
                        height: "100%",
                        background: "#2563eb",
                        transition: "width .2s",
                      }}
                    />
                  </div>
                  <small style={{ color: "#555" }}>
                    جاري رفع الفيديو... {uploadProgress}%
                  </small>
                </div>
              )}

              <label>محتوى الدرس</label>
              <textarea
                rows={4}
                value={form.content}
                onChange={(e) => setField("content", e.target.value)}
                placeholder="اكتب محتوى الدرس هنا..."
              />

              {/* ── AI Summary (needs a saved lesson ID) ── */}
              {editLesson ? (
                <AiSummaryCard lessonId={editLesson.id} />
              ) : (
                <small style={{ color: "#888", display: "block", marginTop: 8 }}>
                  احفظ الدرس أولاً ثم افتحه للتعديل لتوليد ملخص بالذكاء الاصطناعي.
                </small>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowModal(false)}
              >
                إلغاء
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? uploadProgress !== null
                    ? "جاري رفع الفيديو..."
                    : "جاري الحفظ..."
                  : editLesson
                    ? "حفظ التعديلات"
                    : "إنشاء الدرس"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div
            className="modal"
            dir="rtl"
            style={{ maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>تأكيد الحذف</h2>
              <FaTimes
                style={{ cursor: "pointer" }}
                onClick={() => setDeleteTarget(null)}
              />
            </div>
            <div className="modal-body">
              <p>
                هل أنت متأكد من حذف درس <strong>"{deleteTarget.title}"</strong>؟
                لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setDeleteTarget(null)}
              >
                إلغاء
              </button>
              <button
                className="btn"
                style={{ background: "#b91c1c", color: "#fff" }}
                onClick={confirmDelete}
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonsPage;
