'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ROLES = ['مدير النظام', 'مدير الإنتاج', 'أمين المخزن', 'مسؤول مبيعات', 'محاسب'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/users');
      const d = await r.json();
      setUsers(d.users || []);
    } catch { toast.error('خطأ في تحميل المستخدمين'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    const isEdit = modal === 'edit';
    const res = await fetch(isEdit ? `/api/users/${form._id}` : '/api/users', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      toast.success(isEdit ? '✅ تم التعديل' : '✅ تم إنشاء المستخدم');
      setModal(null);
      load();
    } else {
      const d = await res.json();
      toast.error(d.error);
    }
  };

  const toggleStatus = async (u) => {
    const res = await fetch(`/api/users/${u._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !u.isActive })
    });
    if (res.ok) { toast.success('تم تحديث الحالة'); load(); }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 إدارة المستخدمين والصلاحيات</h1>
          <p className="text-sm text-gray-500 mt-1">التحكم في وصول الموظفين لأقسام النظام</p>
        </div>
        <button onClick={() => { setForm({ roleName: 'مسؤول مبيعات', isActive: true }); setModal('add'); }} 
          className="btn-primary">+ إضافة موظف جديد</button>
      </div>

      <div className="card p-0 overflow-hidden shadow-xl border-none">
        <table className="w-full text-right border-collapse text-sm">
          <thead className="bg-gray-50 border-b font-bold text-gray-700">
            <tr>
              <th className="px-5 py-4">الاسم الكامل</th>
              <th className="px-5 py-4">اسم المستخدم</th>
              <th className="px-5 py-4">الصلاحية</th>
              <th className="px-5 py-4">الحالة</th>
              <th className="px-5 py-4">آخر دخول</th>
              <th className="px-5 py-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u._id} className={`hover:bg-gray-50 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>
                <td className="px-5 py-4 font-bold text-gray-900">{u.fullName}</td>
                <td className="px-5 py-4 font-mono text-blue-600">{u.username}</td>
                <td className="px-5 py-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold">{u.roleName}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-gray-400">
                   {u.lastLogin ? new Date(u.lastLogin).toLocaleString('ar-SD') : 'لم يدخل بعد'}
                </td>
                <td className="px-5 py-4 flex gap-2">
                  <button onClick={() => { setForm(u); setModal('edit'); }} className="text-blue-600 hover:underline">تعديل</button>
                  <button onClick={() => toggleStatus(u)} className={u.isActive ? 'text-red-600' : 'text-green-600'}>
                    {u.isActive ? 'تعطيل' : 'تنشيط'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{modal === 'add' ? '👥 إضافة موظف' : '📝 تعديل بيانات موظف'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1">الاسم الكامل *</label>
                <input type="text" className="input-field" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs mb-1">اسم المستخدم *</label>
                <input type="text" className="input-field font-mono" value={form.username} onChange={e => setForm({...form, username: e.target.value.toLowerCase()})} />
              </div>
              <div>
                <label className="block text-xs mb-1">كلمة المرور {modal === 'edit' && '(اتركها فارغة للتجاوز)'}</label>
                <input type="password" Name="passwordHash" className="input-field" onChange={e => setForm({...form, passwordHash: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs mb-1">الصلاحية (الدور الوظيفي) *</label>
                <select className="input-field" value={form.roleName} onChange={e => setForm({...form, roleName: e.target.value})}>
                   {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={handleSave} className="btn-primary flex-1 text-sm">حفظ</button>
                <button onClick={() => setModal(null)} className="btn-secondary text-sm">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
