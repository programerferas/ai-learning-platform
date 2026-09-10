// pages/CategoriesPage.js
import { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrashAlt, FaSearch, FaTags, FaTimes } from 'react-icons/fa';
import {
  getAllCategories, createCategory,
  updateCategory, deleteCategory
} from '../../api/category';
import '../../css/CategoriesPage.css';


const EMPTY_FORM = { name: "", description: "", thumbnail: "" };

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const [showModal, setShowModal]   = useState(false);
  const [editCat, setEditCat]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

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
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditCat(cat);
    setForm({
      name: cat.name || "",
      description: cat.description || "",
      thumbnail: cat.thumbnail || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError("اسم التصنيف مطلوب.");
    setSaving(true);
    try {
      if (editCat) {
        const res = await updateCategory(editCat.id, form);
        setCategories(prev => prev.map(c => c.id === editCat.id ? (res.data.category ?? res.data) : c));
      } else {
        const res = await createCategory(form);
        setCategories(prev => [res.data.category ?? res.data, ...prev]);
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch {
      setError("فشل حفظ التصنيف.");
    } finally {
      setSaving(false);
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
              <label>اسم التصنيف *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: برمجة، تصميم، تسويق..."
              />

              <label>الوصف</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="وصف مختصر للتصنيف (اختياري)"
              />

              <label>رابط الصورة (thumbnail)</label>
              <input
                type="url"
                value={form.thumbnail}
                onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />

              {form.thumbnail && (
                <div className="thumb-preview-wrap">
                  <label>معاينة الصورة:</label>
                  <div className="thumb-preview">
                    <img
                      src={form.thumbnail}
                      alt="معاينة"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '⚠️ رابط غير صحيح';
                      }}
                    />
                  </div>
                </div>
              )}
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