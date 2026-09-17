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
  getManagedCourses,
  togglePublish,
  createCourse,
  deleteCourse,
  updateCourse,
  uploadCourseImage,
} from "../../api/courses";
import "../../css/Coursespage.css";
import { getCategories } from "../../api/courses";


const EMPTY_FORM = {
  title: "",
  description: "",
  categoryId: "",
  price: "",
  level: "",
};

// الحد الأقصى لحجم الصورة — يطابق MAX_IMAGE_SIZE_BYTES في الباكند
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState("");
  // أخطاء كل حقل على حدة — تُعرض تحت الحقل نفسه
  const [fieldErrors, setFieldErrors] = useState({});
  const [editCourse, setEditCourse] = useState(null); // null = create, obj = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Image file (uploaded straight to storage on save)
  const [imageFile, setImageFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  // قائمة الإدارة (/courses/manage) لا القائمة العامة: تشمل غير المنشور وبلا ترقيم
  const fetchCourses = () => getManagedCourses().then((res) => res.data.courses);

  useEffect(() => {
    Promise.all([fetchCourses(), getCategories()])
      .then(([courseList, catsRes]) => {
        setCourses(courseList);
        setCategories(catsRes.data.data ?? catsRes.data);
      })
      .catch(() => {
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
    setImageFile(null);
    setUploadProgress(null);
    setFormError("");
    setFieldErrors({});
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
    });
    setImageFile(null);
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return setImageFile(null);
    if (!file.type.startsWith("image/")) {
      e.target.value = "";
      return setFieldError("thumbnail", "الملف يجب أن يكون صورة.");
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      e.target.value = "";
      return setFieldError("thumbnail", "حجم الصورة يتجاوز الحد المسموح (5 ميجابايت).");
    }
    clearFieldError("thumbnail");
    setImageFile(file);
  };

  // نفس قواعد التحقق الموجودة في الـ backend (createCourseSchema)
  const validateForm = () => {
    const errors = {};
    const title = form.title.trim();
    const description = (form.description || "").trim();

    if (!title) errors.title = "عنوان الكورس مطلوب.";
    else if (title.length < 3)
      errors.title = "عنوان الكورس يجب أن يكون 3 أحرف على الأقل.";
    else if (title.length > 100)
      errors.title = "عنوان الكورس يجب ألا يتجاوز 100 حرف.";

    if (!description) errors.description = "وصف الكورس مطلوب.";
    else if (description.length < 10)
      errors.description = "وصف الكورس يجب أن يكون 10 أحرف على الأقل.";

    if (!form.categoryId) errors.categoryId = "يرجى اختيار تصنيف الكورس.";
    if (!form.level) errors.level = "يرجى اختيار مستوى الكورس.";

    if (form.price !== "" && form.price !== undefined && Number(form.price) < 0)
      errors.price = "السعر لا يمكن أن يكون سالباً.";

    if (!editCourse && !imageFile) errors.thumbnail = "صورة الكورس مطلوبة.";

    return errors;
  };

  // ── Save (create or update) ─────────────────────────────
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
        categoryId: form.categoryId ? form.categoryId.toString() : undefined,
        price: form.price ? Number(form.price) : undefined,
      };

      // الصورة تُرفع مباشرة إلى التخزين ثم يُرسل مفتاحها فقط — كما في فيديو الدرس
      if (imageFile) {
        setUploadProgress(0);
        payload.thumbnailKey = await uploadCourseImage(imageFile, setUploadProgress);
      }

      if (editCourse) {
        await updateCourse(editCourse.id, payload);
      } else {
        await createCourse(payload);
      }
      // نعيد الجلب من الخادم بدل تعديل الحالة محلياً حتى تطابق القائمة قاعدة البيانات
      setCourses(await fetchCourses());
      setShowModal(false);
    } catch (err) {
      // الـ backend يعيد errors: [{ field, message }] من zod — نوزّعها على الحقول
      const data = err.response?.data;
      const backendErrors = {};
      for (const e of data?.errors ?? []) {
        if (e.field && !backendErrors[e.field]) backendErrors[e.field] = e.message;
      }
      setFieldErrors(backendErrors);
      setFormError(
        Object.keys(backendErrors).length
          ? "يرجى تصحيح الحقول المحددة بالأحمر."
          : data?.message || "فشل حفظ الكورس.",
      );
    } finally {
      setSaving(false);
      setUploadProgress(null);
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
              {formError && (
                <div className="modal-error">
                  {formError}
                  <FaTimes
                    style={{ cursor: "pointer" }}
                    onClick={() => setFormError("")}
                  />
                </div>
              )}

              {/* ── Thumbnail ── */}
              <label>صورة الكورس {editCourse ? "" : "*"}</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                {imageFile || editCourse?.thumbnail ? (
                  <img
                    src={imageFile ? URL.createObjectURL(imageFile) : editCourse.thumbnail}
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
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={saving}
                    className={fieldErrors.thumbnail ? "input-error" : ""}
                  />
                  {fieldErrors.thumbnail && (
                    <small className="field-error">{fieldErrors.thumbnail}</small>
                  )}
                  {imageFile ? (
                    <small style={{ color: "#555", display: "block", marginTop: 4 }}>
                      {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
                    </small>
                  ) : (
                    editCourse?.thumbnail && (
                      <small style={{ color: "#888", display: "block", marginTop: 4 }}>
                        توجد صورة محفوظة — اختر ملفاً جديداً لاستبدالها
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
                        جاري رفع الصورة... {uploadProgress}%
                      </small>
                    </div>
                  )}
                </div>
              </div>

              <label>عنوان الكورس *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="أدخل عنوان الكورس"
                className={fieldErrors.title ? "input-error" : ""}
              />
              {fieldErrors.title && (
                <small className="field-error">{fieldErrors.title}</small>
              )}

              <label>الوصف *</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="وصف مختصر للكورس"
                className={fieldErrors.description ? "input-error" : ""}
              />
              {fieldErrors.description && (
                <small className="field-error">{fieldErrors.description}</small>
              )}

              <label>التصنيف *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setField("categoryId", e.target.value)}
                className={fieldErrors.categoryId ? "input-error" : ""}
              >
                <option value="">-- اختر التصنيف --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId && (
                <small className="field-error">{fieldErrors.categoryId}</small>
              )}

              <label>السعر (اختياري)</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                placeholder="0"
                className={fieldErrors.price ? "input-error" : ""}
              />
              {fieldErrors.price && (
                <small className="field-error">{fieldErrors.price}</small>
              )}

              <label>المستوى *</label>
              <select
                value={form.level}
                onChange={(e) => setField("level", e.target.value)}
                className={fieldErrors.level ? "input-error" : ""}
              >
                <option value="">-- اختر المستوى --</option>
                <option value="BEGINNER">مبتدئ</option>
                <option value="INTERMEDIATE">متوسط</option>
                <option value="ADVANCED">خبير</option>
              </select>
              {fieldErrors.level && (
                <small className="field-error">{fieldErrors.level}</small>
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