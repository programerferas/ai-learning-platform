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
} from "../../api/Lesson";
import { AiSummaryCard } from "./AiSummaryCard";
import { getCourses } from "../../api/courses";
import "../../css/LessonsPage.css";

const EMPTY_FORM = {
  title: "",
  content: "",
  courseId: "",
  order: "",
  videoUrl: "",
};

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
    setShowModal(true);
  };

  const openEdit = (lesson) => {
    setEditLesson(lesson);
    setForm({
      title: lesson.title || "",
      content: lesson.content || "",
      courseId: lesson.course?.id?.toString() || "",
      order: lesson.order?.toString() || "",
      videoUrl: lesson.videoUrl || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return setError("عنوان الدرس مطلوب.");
    if (!form.courseId) return setError("يجب اختيار الكورس.");
    setSaving(true);
    try {
      const payload = {
        ...form,
        courseId: form.courseId,
        order: form.order ? Number(form.order) : undefined,
      };

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
    } catch {
      setError("فشل حفظ الدرس.");
    } finally {
      setSaving(false);
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
          {/* ── AI Summary Card ── */}
          <label>محتوى الدرس</label>
          <textarea
            rows={4}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="اكتب محتوى الدرس هنا..."
          />

          {editLesson && <AiSummaryCard lessonId={editLesson.id} />}

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
              <label>عنوان الدرس *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="أدخل عنوان الدرس"
              />

              <label>الكورس *</label>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              >
                <option value="">-- اختر الكورس --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <label>الترتيب</label>
              <input
                type="number"
                min="1"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                placeholder="1"
              />

              <label>رابط الفيديو</label>
              <input
                type="text"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://..."
              />

              <label>محتوى الدرس</label>
              <textarea
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="اكتب محتوى الدرس هنا..."
              />
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
                  ? "جاري الحفظ..."
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
