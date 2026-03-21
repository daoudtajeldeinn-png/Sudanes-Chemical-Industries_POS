'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BackButton from '@/components/BackButton';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = () => {
    setLoading(true);
    const params = search ? `?q=${search}` : '';
    fetch(`/api/customers${params}`).then(r => r.json()).then(d => { setCustomers(d.customers || []); setLoading(false); });
  };

  useEffect(() => { load(); }, [search]);
  useEffect(() => { fetch('/api/seed').catch(() => {}); }, []); // trigger groups load via a simple approach

  const openAdd = () => { setForm({ customerType: 'retail', creditLimit: 0 }); setModal('add'); };
  const openEdit = (c) => { setForm({ ...c, group: c.group?._id || c.group }); setModal('edit'); };

  const handleSave = async () => {
    const isEdit = modal === 'edit';
    const res = await fetch(isEdit ? `/api/customers/${form._id}` : '/api/customers', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) { toast.success(isEdit ? 'تم التعديل' : 'تمت الإضافة'); setModal(null); load(); }
    else toast.error(data.error);
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف هذا العميل؟')) return;
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    toast.success('تم الحذف'); load();
  };

  const fmt = (n) => new Intl.NumberFormat('ar-SD').format(Math.round(n || 0));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900">👥 العملاء</h1>
        </div>
        <button onClick={openAdd} className="btn-primary">+ إضافة عميل</button>
      </div>
      <input type="text" placeholder="بحث بالاسم أو الهاتف أو الكود..." className="input-field w-80" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['الكود','الاسم','الهاتف','المدينة','المجموعة','حد الائتمان','الرصيد',''].map((h,i) => (
                <th key={i} className="text-right py-3 px-4 font-medium text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                [1, 2, 3, 4, 5].map((skeleton) => (
                  <tr key={skeleton} className="animate-pulse border-b border-gray-50">
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="py-4 px-4"><div className="h-5 bg-gray-200 rounded-lg w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                  </tr>
                ))
              ) : customers.length === 0 ? <tr><td colSpan="8" className="text-center py-12 text-gray-400">لا يوجد عملاء</td></tr>
              : customers.map(c => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-blue-600 text-xs">{c.customerCode}</td>
                  <td className="py-3 px-4 font-medium">{c.customerName}</td>
                  <td className="py-3 px-4 text-gray-600">{c.phone || '-'}</td>
                  <td className="py-3 px-4 text-gray-600">{c.city || '-'}</td>
                  <td className="py-3 px-4"><span className="badge-blue">{c.group?.groupName || '-'}</span></td>
                  <td className="py-3 px-4">{fmt(c.creditLimit)} SDG</td>
                  <td className="py-3 px-4"><span className={c.currentBalance > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>{fmt(c.currentBalance)} SDG</span></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-800 text-xs">تعديل</button>
                      <button onClick={() => handleDelete(c._id)} className="text-red-500 hover:text-red-700 text-xs">حذف</button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">{modal === 'add' ? '+ إضافة عميل' : 'تعديل العميل'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
                <input type="text" value={form.customerName || ''} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} className="input-field" />
              </div>
              {[
                { label: 'الهاتف', key: 'phone' },
                { label: 'الهاتف 2', key: 'phone2' },
                { label: 'البريد الإلكتروني', key: 'email' },
                { label: 'المدينة', key: 'city' },
                { label: 'الرقم الضريبي', key: 'taxNumber' },
                { label: 'حد الائتمان', key: 'creditLimit', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="input-field" />
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
