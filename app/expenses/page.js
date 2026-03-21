'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BackButton from '@/components/BackButton';

export default function ExpensesPage() {
  const [isClient, setIsClient] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ paymentMethod: 'CASH', amount: '' });

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    fetch(`/api/expenses?${params}`).then(r => r.json()).then(d => {
      setExpenses(d.expenses || []);
      setCategories(d.categories || []);
      setLoading(false);
    });
  };
  useEffect(() => { 
    setIsClient(true);
    load(); 
  }, [from, to]);

  const handleSave = async () => {
    if (!form.category || !form.amount) return toast.error('أدخل الفئة والمبلغ');
    const res = await fetch('/api/expenses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) { toast.success('✅ تم الحفظ'); setModal(false); setForm({ paymentMethod: 'CASH', amount: '' }); load(); }
    else toast.error(data.error);
  };

  const fmt = (n) => new Intl.NumberFormat('ar-SD').format(Math.round(n || 0));
  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💸 المصروفات</h1>
            <p className="text-sm text-gray-500 mt-1">{expenses.length} مصروف</p>
          </div>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">+ إضافة مصروف</button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2"><label className="text-sm text-gray-600">من:</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field w-40" /></div>
        <div className="flex items-center gap-2"><label className="text-sm text-gray-600">إلى:</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field w-40" /></div>
        {(from || to) && <button onClick={() => { setFrom(''); setTo(''); }} className="btn-secondary text-sm">مسح</button>}
        <div className="mr-auto bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
          <span className="text-gray-600">إجمالي المصروفات: </span>
          <span className="font-bold text-red-700">{fmt(total)} SDG</span>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['الفئة','المبلغ','طريقة الدفع','الوصف','التاريخ'].map((h,i) => (
                <th key={i} className="text-right py-3 px-4 font-medium text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {loading && expenses.length === 0 ? (
                [1, 2, 3, 4, 5].map((skeleton) => (
                  <tr key={skeleton} className="animate-pulse border-b border-gray-50">
                    <td className="py-4 px-4"><div className="h-5 bg-gray-200 rounded-full w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                  </tr>
                ))
              ) : expenses.length === 0 ? <tr><td colSpan="5" className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">💸</div>لا توجد مصروفات</td></tr>
              : expenses.map(e => (
                <tr key={e._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4"><span className="badge-red">{e.category?.categoryName || e.categoryName || '-'}</span></td>
                  <td className="py-3 px-4 font-bold text-red-600">{fmt(e.amount)} SDG</td>
                  <td className="py-3 px-4 text-gray-600">{e.paymentMethod === 'CASH' ? 'نقدي' : e.paymentMethod === 'CARD' ? 'بطاقة' : 'تحويل'}</td>
                  <td className="py-3 px-4 text-gray-600 text-xs max-w-48 truncate">{e.description || e.notes || '-'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{isClient ? new Date(e.expenseDate).toLocaleDateString('ar-SD') : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">💸 إضافة مصروف</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 text-2xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفئة *</label>
                <select value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                  <option value="">-- اختر الفئة --</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.categoryName}</option>)}
                  <option value="OTHER">أخرى (إضافة فئة جديدة غير المدرجة بالقائمة)</option>
                </select>
              </div>
              {form.category === 'OTHER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم الفئة الجديدة *</label>
                  <input type="text" placeholder="مثال: ضيافة، إصلاحات طارئة..." value={form.customCategoryName || ''} onChange={e => setForm(f => ({ ...f, customCategoryName: e.target.value }))} className="input-field" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ *</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input-field text-xl text-center font-bold" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} className="input-field">
                  <option value="CASH">💵 نقدي</option>
                  <option value="CARD">💳 بطاقة</option>
                  <option value="TRANSFER">🏦 تحويل</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea rows={2} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => setModal(false)} className="btn-secondary">إلغاء</button>
              <button onClick={handleSave} className="btn-danger">💾 حفظ المصروف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
