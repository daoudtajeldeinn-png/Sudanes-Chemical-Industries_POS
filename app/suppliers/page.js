'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = () => {
    setLoading(true);
    const params = search ? `?q=${search}` : '';
    fetch(`/api/suppliers${params}`).then(r => r.json()).then(d => { setSuppliers(d.suppliers || []); setLoading(false); });
  };
  useEffect(() => { load(); }, [search]);

  const openAdd = () => { setForm({ country: 'Sudan' }); setModal('add'); };
  const openEdit = (s) => { setForm({ ...s }); setModal('edit'); };

  const handleSave = async () => {
    const isEdit = modal === 'edit';
    const res = await fetch(isEdit ? `/api/suppliers/${form._id}` : '/api/suppliers', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) { toast.success(isEdit ? 'تم التعديل' : 'تمت الإضافة'); setModal(null); load(); }
    else toast.error(data.error);
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف هذا المورد؟')) return;
    await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    toast.success('تم الحذف'); load();
  };

  const fmt = (n) => new Intl.NumberFormat('ar-SD').format(Math.round(n || 0));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">🏭 الموردون</h1>
        <button onClick={openAdd} className="btn-primary">+ إضافة مورد</button>
      </div>
      <input type="text" placeholder="بحث..." className="input-field w-72" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['الكود','الاسم','الهاتف','المدينة','البلد','الرصيد',''].map((h,i) => (
                <th key={i} className="text-right py-3 px-4 font-medium text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {loading ? <tr><td colSpan="7" className="text-center py-12 text-gray-400">جاري التحميل...</td></tr>
              : suppliers.length === 0 ? <tr><td colSpan="7" className="text-center py-12 text-gray-400">لا يوجد موردون</td></tr>
              : suppliers.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-blue-600 text-xs">{s.supplierCode}</td>
                  <td className="py-3 px-4 font-medium">{s.supplierName}</td>
                  <td className="py-3 px-4 text-gray-600">{s.phone || '-'}</td>
                  <td className="py-3 px-4 text-gray-600">{s.city || '-'}</td>
                  <td className="py-3 px-4 text-gray-600">{s.country || '-'}</td>
                  <td className="py-3 px-4"><span className={s.currentBalance > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>{fmt(s.currentBalance)} SDG</span></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="text-blue-600 text-xs hover:text-blue-800">تعديل</button>
                      <button onClick={() => handleDelete(s._id)} className="text-red-500 text-xs hover:text-red-700">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">{modal === 'add' ? '+ إضافة مورد' : 'تعديل المورد'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
                <input type="text" value={form.supplierName || ''} onChange={e => setForm(p => ({ ...p, supplierName: e.target.value }))} className="input-field" />
              </div>
              {[
                { label: 'الهاتف', key: 'phone' },
                { label: 'الهاتف 2', key: 'phone2' },
                { label: 'البريد الإلكتروني', key: 'email' },
                { label: 'المدينة', key: 'city' },
                { label: 'البلد', key: 'country' },
                { label: 'الرقم الضريبي', key: 'taxNumber' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type="text" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="input-field" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <textarea rows={2} value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="btn-secondary">إلغاء</button>
              <button onClick={handleSave} className="btn-primary">💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
