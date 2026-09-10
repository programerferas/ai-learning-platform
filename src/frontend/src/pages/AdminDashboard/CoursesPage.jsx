// pages/CoursesPage.js
import { useEffect, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaToggleOn,
  FaToggleOff,
  FaSearch,
  FaUsers,
  FaVideo,
  FaTimes,
  FaImage,
} from "react-icons/fa";
import {
  getCourses,
  togglePublish,
  createCourse,
  deleteCourse,
  updateCourse,
} from "../../api/courses";
import "../../css/CoursesPage.css";
import { getCategories } from "../../api/courses";


const EMPTY_FORM = {
  title: "",
  description: "",
  categoryId: "",
  price: "",
  level: "",
  thumbnail: "",
};

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null); // null = create, obj = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    Promise.all([getCourses(), getCategories()])
      .then(([coursesRes, catsRes]) => {
        setCourses(coursesRes.data.courses);
        setCategories(catsRes.data.data ?? catsRes.data);
      })
      .catch((err) => {
        setError("فشل تحميل البيانات.");
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Publish toggle ──────────────────────────────────────
  const handlePublishToggle = async (id) => {
    try {
      const res = await togglePublish(id);
      setCourses((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, published: res.data.course.published } : c,
        ),
      );
    } catch {
      setError("تعذّر تحديث حالة الكورس.");
    }
  };

  // ── Open create modal ───────────────────────────────────
  const openCreate = () => {
    setEditCourse(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  // ── Open edit modal ─────────────────────────────────────
  const openEdit = (course) => {
    setEditCourse(course);
    setForm({
      title: course.title,
      description: course.description,
      categoryId: course.category?.id?.toString() || "",
      price: course.price?.toString(),
      level: course.level,
      thumbnail: course.thumbnail || "",
    });
    setShowModal(true);
  };

  // ── Save (create or update) ─────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) return setError("عنوان الكورس مطلوب.");
    setSaving(true);
    try {
      const payload = {
        ...form,
        categoryId: form.categoryId ? form.categoryId.toString() : undefined,
        price: form.price ? Number(form.price) : undefined,
        thumbnail: form.thumbnail ? form.thumbnail.trim() : undefined,
      };

      if (editCourse) {
        const res = await updateCourse(editCourse.id, payload);
        setCourses((prev) =>
          prev.map((c) =>
            c.id === editCourse.id ? (res.data.course ?? res.data) : c,
          ),
        );
      } else {
        const res = await createCourse(payload);
        setCourses((prev) => [res.data.course ?? res.data, ...prev]);
      }
      setShowModal(false);
    } catch {
      setError("فشل حفظ الكورس.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCourse(deleteTarget.id);
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } catch {
      setError("فشل حذف الكورس.");
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Remove from category (sets categoryId to null) ─────
  const removeFromCategory = async (course) => {
    try {
      const res = await updateCourse(course.id, { categoryId: null });
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id
            ? { ...c, category: null, ...(res.data.course ?? res.data) }
            : c,
        ),
      );
    } catch {
      setError("فشل إزالة الكورس من التصنيف.");
    }
  };

  // ── Filter & pagination ─────────────────────────────────
  const filteredCourses = (Array.isArray(courses) ? courses : []).filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [5, 10, 25, 50];
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const goToPage = (p) => setCurrentPage(Math.max(1, Math.min(totalPages, p)));

  return (
    <div dir="rtl">
      {/* ── Header ── */}
      <div className="page-header">
        <h1>
          <FaVideo /> إدارة الكورسات
        </h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <FaPlus /> كورس جديد
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
        <div className="card">
          <div className="card-header">
            <h3>جميع الكورسات</h3>
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="ابحث عن كورس أو تصنيف..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الصورة</th>
                  <th>العنوان</th>
                  <th>التصنيف</th>
                  <th>
                    <FaUsers /> المدرّب
                  </th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCourses.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ textAlign: "center", color: "#888" }}
                    >
                      لا توجد كورسات
                    </td>
                  </tr>
                )}
                {paginatedCourses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          style={{
                            width: 48,
                            height: 48,
                            objectFit: "cover",
                            borderRadius: 6,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 6,
                            background: "#f2f2e1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#aaa",
                          }}
                        >
                          <FaImage />
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{course.title}</strong>
                    </td>
                    <td>
                      {course.category ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span className="category-tag">
                            {course.category.name}
                          </span>
                          <button
                            className="btn btn-sm"
                            title="إزالة من التصنيف"
                            style={{
                              padding: "2px 6px",
                              fontSize: 11,
                              background: "#fee2e2",
                              color: "#b91c1c",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                            onClick={() => removeFromCategory(course)}
                          >
                            ✕
                          </button>
                        </span>
                      ) : (
                        <span style={{ color: "#aaa", fontSize: 13 }}>
                          بدون تصنيف
                        </span>
                      )}
                    </td>
                    <td>
                      {course.instructor?.name || course.instructor?.email}
                    </td>
                    <td>
                      <span
                        className={`badge-status ${course.published ? "badge-published" : "badge-unpublished"}`}
                      >
                        {course.published ? "منشور" : "غير منشور"}
                      </span>
                    </td>
                    <td
                      style={{ display: "flex", gap: 6, alignItems: "center" }}
                    >
                      <button
                        className={`btn btn-sm ${course.published ? "btn-success" : "btn-warning"}`}
                        onClick={() => handlePublishToggle(course.id)}
                      >
                        {course.published ? <FaToggleOn /> : <FaToggleOff />}{" "}
                        {course.published ? "إلغاء النشر" : "نشر"}
                      </button>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => openEdit(course)}
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
                        onClick={() => setDeleteTarget(course)}
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="table-footer">
            <span>
              عرض{" "}
              {filteredCourses.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              {" – "}
              {Math.min(currentPage * pageSize, filteredCourses.length)} من{" "}
              {filteredCourses.length} كورس
            </span>
            <div className="pagination">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                السابق
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`btn btn-sm ${currentPage === i + 1 ? "btn-primary" : "btn-outline"}`}
                  onClick={() => goToPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="btn btn-sm btn-outline"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                التالي
              </button>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <label style={{ marginLeft: 8 }}>صفوف:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {pageSizeOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          Modal: Create / Edit Course
      ══════════════════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editCourse ? "تعديل الكورس" : "إضافة كورس جديد"}</h2>
              <FaTimes
                style={{ cursor: "pointer" }}
                onClick={() => setShowModal(false)}
              />
            </div>
            <div className="modal-body">
              {/* ── Thumbnail ── */}
              <label>صورة الكورس</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                {form.thumbnail ? (
                  <img
                    src={form.thumbnail}
                    alt="thumbnail preview"
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #e0dad0",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      background: "#f2f2e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#aaa",
                      fontSize: 22,
                    }}
                  >
                    <FaImage />
                  </div>
                )}
                <input
                  type="text"
                  value={form.thumbnail}
                  placeholder="أدخل رابط الصورة"
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>

              <label>عنوان الكورس *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="أدخل عنوان الكورس"
              />

              <label>الوصف</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="وصف مختصر للكورس"
              />

              <label>التصنيف</label>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
              >
                <option value="">-- بدون تصنيف --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <label>السعر (اختياري)</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
              />

              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
              >
                <option value="">-- اختر المستوى --</option>
                <option value="BEGINNER">مبتدئ</option>
                <option value="INTERMEDIATE">متوسط</option>
                <option value="ADVANCED">خبير</option>
              </select>
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
                  : editCourse
                    ? "حفظ التعديلات"
                    : "إنشاء الكورس"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          Modal: Confirm Delete
      ══════════════════════════════════════════ */}
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
                هل أنت متأكد من حذف كورس <strong>"{deleteTarget.title}"</strong>
                ؟ هذا الإجراء لا يمكن التراجع عنه.
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

export default CoursesPage;