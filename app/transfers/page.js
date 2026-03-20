'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ items: [] });

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, wRes, pRes] = await Promise.all([
        fetch('/api/transfers'),
        fetch('/api/warehouses'),
        fetch('/api/products')
      ]);
      const [tData, wData, pData] = await Promise.all([
        tRes.json(), wRes.json(), pRes.json()
      ]);
      setTransfers(tData.transfers || []);
      setWarehouses(wData.warehouses || []);
      setProducts(pData.products || []);
    } catch { toast.error('خطأ في تحميل البيانات'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveTransfer = async () => {
    const res = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) { toast.success('✅ تم إنشاء طلب التحويل'); setModal(null); loadData(); }
    else { const d = await res.json(); toast.error(d.error); }
  };

  const handleUpdateStatus = async (id, status) => {
    const res = await fetch(`/api/transfers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) { toast.success('✔️ تم تحديث الحالة والجرد'); loadData(); }
    else { const d = await res.json(); toast.error(d.error); }
  };

  const addItem = () => {
    setForm(p => ({ ...p, items: [...(p.items || []), { product: '', quantity: 0 }] }));
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🚚 تحويلات المخازن</h1>
          <p className="text-sm text-gray-500 mt-1">نقل المواد بين مستودعات المصنع رسمياً</p>
        </div>
        <button onClick={() => { setForm({ items: [], fromWarehouse: warehouses[0]?._id, toWarehouse: warehouses[1]?._id }); setModal('add'); }} 
          className="btn-primary">+ طلب تحويل جديد</button>
      </div>

      <div className="card p-0 overflow-hidden shadow-xl border-none">
        <table className="w-full text-right border-collapse text-sm">
          <thead className="bg-gray-50 border-b font-bold text-gray-700">
            <tr>
              <th className="px-5 py-4">من مستودع</th>
              <th className="px-5 py-4">إلى مستودع</th>
              <th className="px-5 py-4">الأصناف</th>
              <th className="px-5 py-4">الحالة</th>
              <th className="px-5 py-4">التاريخ</th>
              <th className="px-5 py-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transfers.map(t => (
              <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 font-bold text-blue-800">{t.fromWarehouse?.warehouseName || '---'}</td>
                <td className="px-5 py-4 font-bold text-green-800">{t.toWarehouse?.warehouseName || '---'}</td>
                <td className="px-5 py-4">
                  <div className="text-xs text-gray-600">
                    {t.items?.map((it, i) => <div key={i}>{it.product?.productNameAr || it.product?.productName} ({it.quantity})</div>)}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    t.status === 'RECEIVED' ? 'bg-green-100 text-green-700' :
                    t.status === 'SENT' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {t.status === 'PENDING' ? 'قيد الانتظار' : t.status === 'SENT' ? 'تم الإرسال 🚚' : 'تم الاستلام ✅'}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-gray-400">
                  {t.createdAt ? new Date(t.createdAt).toLocaleDateString('ar-SD') : '---'}
                </td>
                <td className="px-5 py-4">
                  {t.status === 'PENDING' && (
                    <button onClick={() => handleUpdateStatus(t._id, 'SENT')} className="text-blue-600 hover:underline">إرسال 🚚</button>
                  )}
                  {t.status === 'SENT' && (
                    <button onClick={() => handleUpdateStatus(t._id, 'RECEIVED')} className="text-green-600 font-bold hover:underline">تأكيد الاستلام ✔️</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'add' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">🚚 إنشاء طلب تحويل</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1">من مستودع</label>
                  <select className="input-field" value={form.fromWarehouse} onChange={e => setForm({...form, fromWarehouse: e.target.value})}>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.warehouseName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">إلى مستودع</label>
                  <select className="input-field" value={form.toWarehouse} onChange={e => setForm({...form, toWarehouse: e.target.value})}>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.warehouseName}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase">الأصناف المراد نقلها</label>
                {form.items?.map((it, i) => (
                  <div key={i} className="flex gap-2">
                    <select className="input-field flex-1" value={it.product} onChange={e => {
                      const newIt = [...form.items]; newIt[i].product = e.target.value; setForm({...form, items: newIt});
                    }}>
                      <option value="">اختر المنتج...</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.productNameAr}</option>)}
                    </select>
                    <input type="number" placeholder="الكمية" className="input-field w-24" value={it.quantity} onChange={e => {
                      const newIt = [...form.items]; newIt[i].quantity = e.target.value; setForm({...form, items: newIt});
                    }} />
                  </div>
                ))}
                <button onClick={addItem} className="text-blue-600 text-xs hover:underline">+ صنف آخر</button>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={handleSaveTransfer} className="btn-primary flex-1 text-sm">حفظ الطلب</button>
                <button onClick={() => setModal(null)} className="btn-secondary text-sm">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
