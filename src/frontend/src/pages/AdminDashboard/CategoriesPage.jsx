// pages/CategoriesPage.js
import { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrashAlt, FaSearch, FaTags, FaTimes, FaImage } from 'react-icons/fa';
import {
  getAllCategories, createCategory,
  updateCategory, deleteCategory, uploadCategoryImage
} from '../../api/category';
import '../../css/CategoriesPage.css';


const EMPTY_FORM = { name: "", description: "" };

// الحد الأقصى لحجم الصورة — يطابق MAX_IMAGE_SIZE_BYTES في الباكند
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const [showModal, setShowModal]   = useState(false);
  const [editCat, setEditCat]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // صورة التصنيف — تُرفع مباشرة إلى التخزين كما في صورة الكورس
  const [imageFile, setImageFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    getAllCategories()
      .then(res => setCategories(res.data))
      .catch(() => setError('فشل تحميل التصنيفات.'))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditCat(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setUploadProgress(null);
    setFormError('');
    setFieldErrors({});
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditCat(cat);
    setForm({
      name: cat.name || "",
      description: cat.description || "",
    });
    setImageFile(null);
    setUploadProgress(null);
    setFormError('');
    setFieldErrors({});
    setShowModal(true);
  };

  const clearFieldError = (name) =>
    setFieldErrors(prev => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });

  const setFieldError = (name, message) =>
    setFieldErrors(prev => ({ ...prev, [name]: message }));

  // تحديث حقل مع مسح خطئه فور أن يبدأ المستخدم بالتصحيح
  const setField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
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

  // نفس قواعد createCategorySchema في الـ backend
  const validateForm = () => {
    const errors = {};
    const name = form.name.trim();
    if (!name) errors.name = "اسم التصنيف مطلوب.";
    else if (name.length < 3) errors.name = "يجب أن يتكون الاسم من 3 حروف على الأقل.";
    else if (name.length > 10) errors.name = "يجب ألا يتجاوز الاسم 10 أحرف.";

    // الصورة مطلوبة عند الإنشاء؛ عند التعديل تبقى الصورة القديمة إن لم يُختر ملف
    if (!editCat && !imageFile) errors.thumbnail = "صورة التصنيف مطلوبة.";
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      return setFormError("يرجى تصحيح الحقول المحددة بالأحمر.");
    }
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
      };

      // الصورة تُرفع مباشرة إلى التخزين ثم يُرسل مفتاحها فقط — كما في صورة الكورس
      if (imageFile) {
        setUploadProgress(0);
        payload.thumbnailKey = await uploadCategoryImage(imageFile, setUploadProgress);
      }

      if (editCat) {
        const res = await updateCategory(editCat.id, payload);
        setCategories(prev => prev.map(c => c.id === editCat.id ? (res.data.category ?? res.data) : c));
      } else {
        const res = await createCategory(payload);
        setCategories(prev => [res.data.category ?? res.data, ...prev]);
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
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
          : data?.message || "فشل حفظ التصنيف.",
      );
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
    } catch {
      setError("فشل حذف التصنيف.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div dir="rtl">
      <div className="page-header">
        <h1><FaTags /> إدارة التصنيفات</h1>
        <button className="btn btn-primary" onClick={openCreate}><FaPlus /> إضافة تصنيف</button>
      </div>

      {error && (
        <div className="card error-banner">
          {error}
          <FaTimes className="icon-btn" onClick={() => setError('')} />
        </div>
      )}

      {loading ? (
        <div className="card">جاري التحميل...</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3>جميع التصنيفات</h3>
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="ابحث عن تصنيف..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>الصورة</th>
                  <th>اسم التصنيف</th>
                  <th>الوصف</th>
                  <th>تاريخ الإنشاء</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-cell">لا توجد تصنيفات</td>
                  </tr>
                )}
                {filteredCategories.map((cat, i) => (
                  <tr key={cat.id}>
                    <td>{i + 1}</td>
                    <td>
                      {cat.thumbnail ? (
                        <img
                          src={cat.thumbnail}
                          alt={cat.name}
                          className="cat-thumb"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '📷';
                          }}
                        />
                      ) : (
                        <span className="cat-thumb-placeholder">📷</span>
                      )}
                    </td>
                    <td><strong>{cat.name}</strong></td>
                    <td>{cat.description || '—'}</td>
                    <td>{new Date(cat.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td className="actions-cell">
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(cat)}>
                        <FaEdit />
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => setDeleteTarget(cat)}
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
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editCat ? "تعديل التصنيف" : "إضافة تصنيف جديد"}</h2>
              <FaTimes className="icon-btn" onClick={() => setShowModal(false)} />
            </div>
            <div className="modal-body">
              {formError && (
                <div className="modal-error">
                  {formError}
                  <FaTimes className="icon-btn" onClick={() => setFormError('')} />
                </div>
              )}

              <label>اسم التصنيف *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="مثال: برمجة، تصميم، تسويق..."
                className={fieldErrors.name ? 'input-error' : ''}
              />
              {fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}

              <label>الوصف</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                placeholder="وصف مختصر للتصنيف (اختياري)"
              />

              <label>صورة التصنيف {editCat ? "" : "*"}</label>
              <div className="thumb-picker">
                {imageFile || editCat?.thumbnail ? (
                  <img
                    className="thumb-picker__preview"
                    src={imageFile ? URL.createObjectURL(imageFile) : editCat.thumbnail}
                    alt="thumbnail preview"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="thumb-picker__placeholder"><FaImage /></div>
                )}
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={saving}
                    className={fieldErrors.thumbnail ? 'input-error' : ''}
                  />
                  {fieldErrors.thumbnail && <small className="field-error">{fieldErrors.thumbnail}</small>}
                  {imageFile ? (
                    <small className="thumb-picker__hint">
                      {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
                    </small>
                  ) : (
                    editCat?.thumbnail && (
                      <small className="thumb-picker__hint thumb-picker__hint--muted">
                        توجد صورة محفوظة — اختر ملفاً جديداً لاستبدالها
                      </small>
                    )
                  )}
                  {uploadProgress !== null && (
                    <div className="upload-progress">
                      <div className="upload-progress__bar">
                        <div className="upload-progress__fill" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <small className="thumb-picker__hint">جاري رفع الصورة... {uploadProgress}%</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "جاري الحفظ..." : editCat ? "حفظ التعديلات" : "إنشاء التصنيف"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal modal-sm" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>تأكيد الحذف</h2>
              <FaTimes className="icon-btn" onClick={() => setDeleteTarget(null)} />
            </div>
            <div className="modal-body">
              <p>هل أنت متأكد من حذف تصنيف <strong>"{deleteTarget.name}"</strong>؟ سيتم إزالته من جميع الكورسات المرتبطة به.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>إلغاء</button>
              <button className="btn btn-danger-solid" onClick={confirmDelete}>حذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;