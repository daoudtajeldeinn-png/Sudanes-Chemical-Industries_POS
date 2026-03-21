'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BackButton from '@/components/BackButton';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [warehouses, setWarehouses] = useState([]);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (catFilter) params.set('category', catFilter);
    fetch(`/api/products?${params}`, { cache: 'no-store' }).then(r => r.json()).then(d => { setProducts(d.products || []); setLoading(false); });
  };

  useEffect(() => { load(); }, [search, catFilter]);
  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || []));
    fetch('/api/units').then(r => r.json()).then(d => setUnits(d.units || []));
    fetch('/api/warehouses').then(r => r.json()).then(d => setWarehouses(d.warehouses || []));
  }, []);

  const openAdd = () => {
    setForm({ taxRate: 0, minStock: 0, maxStock: 0, costPrice: 0, wholesalePrice: 0, retailPrice: 0 });
    setModal('add');
  };
  const openEdit = (p) => {
    setForm({
      ...p,
      category: p.category?._id || p.category,
      unit: p.unit?._id || p.unit,
    });
    setModal('edit');
  };

  const handleSave = async () => {
    const isEdit = modal === 'edit';
    const res = await fetch(isEdit ? `/api/products/${form._id}` : '/api/products', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) { toast.success(isEdit ? '✅ تم التعديل' : '✅ تمت الإضافة'); setModal(null); load(); }
    else toast.error(data.error);
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف هذا المنتج؟')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    toast.success('تم الحذف'); load();
  };

  const fmt = (n) => new Intl.NumberFormat('ar-SD').format(Math.round(n || 0));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📦 المنتجات</h1>
            <p className="text-sm text-gray-500 mt-1">{products.length} منتج</p>
          </div>
        </div>
        <button onClick={openAdd} className="btn-primary">+ إضافة منتج</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input type="text" placeholder="بحث بالاسم أو الكود أو الباركود..." className="input-field w-72"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input-field w-52" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">كل الفئات</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.categoryNameAr || c.categoryName}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['الكود','الباركود','الاسم','الفئة','الوحدة','سعر التكلفة','سعر الجملة','سعر التجزئة','المخزون',''].map((h,i) => (
                  <th key={i} className="text-right py-3 px-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && products.length === 0 ? (
                [1, 2, 3, 4, 5, 6].map((skeleton) => (
                  <tr key={skeleton} className="animate-pulse border-b border-gray-50">
                    <td className="py-4 px-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="py-4 px-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-4 px-3"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                    <td className="py-4 px-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-4 px-3"><div className="h-5 bg-gray-200 rounded-full w-12 text-center"></div></td>
                    <td className="py-4 px-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="py-4 px-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="py-4 px-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="py-4 px-3"><div className="h-5 bg-gray-200 rounded-lg w-16"></div></td>
                    <td className="py-4 px-3"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan="10" className="text-center py-16 text-gray-400">
                  <div className="text-4xl mb-2">📦</div>
                  لا توجد منتجات — اضغط "إضافة منتج" أو أضف بيانات تجريبية من الإعدادات
                </td></tr>
              ) : products.map(p => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="py-3 px-3 font-mono text-blue-600 text-xs whitespace-nowrap">{p.productCode}</td>
                  <td className="py-3 px-3 font-mono text-gray-400 text-xs">{p.barcode || '-'}</td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-gray-900">{p.productNameAr || p.productName}</div>
                    {p.productNameAr && <div className="text-gray-400 text-xs">{p.productName}</div>}
                  </td>
                  <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{p.category?.categoryNameAr || p.category?.categoryName || '-'}</td>
                  <td className="py-3 px-3 whitespace-nowrap"><span className="badge-blue">{p.unit?.unitCode || '-'}</span></td>
                  <td className="py-3 px-3 text-gray-600">{fmt(p.costPrice)}</td>
                  <td className="py-3 px-3 text-gray-600">{fmt(p.wholesalePrice)}</td>
                  <td className="py-3 px-3 font-semibold text-blue-600">{fmt(p.retailPrice)}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`font-medium ${(p.stock || 0) <= p.minStock ? 'text-red-600' : 'text-green-600'}`}>
                      {fmt(p.stock || 0)}
                    </span>
                    {(p.stock || 0) <= p.minStock && <span className="badge-red mr-1 text-xs">منخفض</span>}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">تعديل</button>
                      <button onClick={() => handleDelete(p._id)} className="text-red-500 hover:text-red-700 text-xs">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold">{modal === 'add' ? '+ إضافة منتج جديد' : '✏️ تعديل المنتج'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كود المنتج *</label>
                <input type="text" placeholder="ACID-001" value={form.productCode || ''} onChange={e => setForm(p => ({ ...p, productCode: e.target.value.toUpperCase() }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الباركود</label>
                <input type="text" placeholder="6001234567890" value={form.barcode || ''} onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم بالإنجليزية *</label>
                <input type="text" value={form.productName || ''} onChange={e => setForm(p => ({ ...p, productName: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم بالعربية</label>
                <input type="text" value={form.productNameAr || ''} onChange={e => setForm(p => ({ ...p, productNameAr: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
                <select value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input-field">
                  <option value="">-- اختر الفئة --</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.categoryNameAr || c.categoryName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الصنف *</label>
                <select value={form.productType || 'FINISHED_GOOD'} onChange={e => setForm(p => ({ ...p, productType: e.target.value }))} className="input-field bg-yellow-50/30">
                  <option value="FINISHED_GOOD">🏠 منتج نهائي (للبيع)</option>
                  <option value="RAW_MATERIAL">🧪 مادة خام (للشراء)</option>
                  <option value="PACKAGING">📦 مواد تعبئة (للشراء)</option>
                  <option value="CONSUMABLE">⚡ مستهلكات/وقود (للشراء)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وحدة القياس</label>
                <select value={form.unit || ''} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="input-field">
                  <option value="">-- اختر الوحدة --</option>
                  {units.map(u => <option key={u._id} value={u._id}>{u.unitName} ({u.unitCode})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سعر التكلفة *</label>
                <input type="number" min="0" step="0.01" value={form.costPrice || ''} onChange={e => setForm(p => ({ ...p, costPrice: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سعر الجملة</label>
                <input type="number" min="0" step="0.01" value={form.wholesalePrice || ''} onChange={e => setForm(p => ({ ...p, wholesalePrice: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">سعر التجزئة *</label>
                <input type="number" min="0" step="0.01" value={form.retailPrice || ''} onChange={e => setForm(p => ({ ...p, retailPrice: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نسبة الضريبة %</label>
                <input type="number" min="0" max="100" value={form.taxRate || 0} onChange={e => setForm(p => ({ ...p, taxRate: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى للمخزون</label>
                <input type="number" min="0" value={form.minStock || 0} onChange={e => setForm(p => ({ ...p, minStock: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى للمخزون</label>
                <input type="number" min="0" value={form.maxStock || 0} onChange={e => setForm(p => ({ ...p, maxStock: e.target.value }))} className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea rows={2} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field" />
              </div>
              {modal === 'add' && (
                <>
                  <div className="col-span-2 border-t pt-4 mt-2">
                    <h3 className="text-sm font-bold text-blue-600 mb-3">📦 الرصيد الافتتاحي (اختياري)</h3>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الكمية الأولية</label>
                    <input type="number" min="0" value={form.initialStock || 0} onChange={e => setForm(p => ({ ...p, initialStock: e.target.value }))} className="input-field bg-blue-50/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المستودع</label>
                    <select value={form.warehouseId || ''} onChange={e => setForm(p => ({ ...p, warehouseId: e.target.value }))} className="input-field bg-blue-50/30">
                      <option value="">-- اختر المستودع --</option>
                      {warehouses.map(w => <option key={w._id} value={w._id}>{w.warehouseName}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="p-6 border-t flex gap-3 justify-end sticky bottom-0 bg-white">
              <button onClick={() => setModal(null)} className="btn-secondary">إلغاء</button>
              <button onClick={handleSave} className="btn-primary">💾 حفظ المنتج</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
