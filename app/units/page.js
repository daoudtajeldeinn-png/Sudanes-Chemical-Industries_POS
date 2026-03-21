'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BackButton from '@/components/BackButton';

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ unitName: '', unitCode: '' });

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/units');
      const data = await res.json();
      setUnits(data.units || []);
    } catch (err) {
      toast.error('خطأ في تحميل الوحدات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `/api/units/${editId}` : '/api/units';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success(editId ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح');
        setShowModal(false);
        setEditId(null);
        setFormData({ unitName: '', unitCode: '' });
        fetchUnits();
      } else {
        const d = await res.json();
        toast.error(d.error || 'حدث خطأ');
      }
    } catch (err) {
      toast.error('خطأ في الاتصال');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col gap-2">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-800">📏 وحدات القياس</h1>
        </div>
        <button onClick={() => { setEditId(null); setFormData({ unitName: '', unitCode: '' }); setShowModal(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          + إضافة وحدة جديدة
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">اسم الوحدة</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">الرمز (Code)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">العمليات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {units.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.unitName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{u.unitCode}</td>
                  <td className="px-6 py-4 text-sm flex gap-3">
                    <button onClick={() => { setEditId(u._id); setFormData({ unitName: u.unitName, unitCode: u.unitCode }); setShowModal(true); }}
                      className="text-blue-600 hover:text-blue-800 font-medium">تعديل</button>
                  </td>
                </tr>
              ))}
              {units.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-10 text-center text-gray-400">لا يوجد وحدات مضافة بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{editId ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1 mr-1">اسم الوحدة (مثلاً: حبة، قطعة، كرتون)</label>
                <input type="text" required value={formData.unitName} onChange={e => setFormData({ ...formData, unitName: e.target.value })}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 focus:border-indigo-400 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 mr-1">رمز الوحدة (مثلاً: PCS, KG, CTN)</label>
                <input type="text" required value={formData.unitCode} onChange={e => setFormData({ ...formData, unitCode: e.target.value })}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 focus:border-indigo-400 outline-none transition-colors font-mono" />
              </div>
              <div className="flex gap-3 pt-4 font-bold">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors">حفظ</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl hover:bg-gray-200 transition-colors">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
