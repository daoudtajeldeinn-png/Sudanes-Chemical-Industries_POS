'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BackButton from '@/components/BackButton';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ warehouseName: '', location: '', isDefault: false });

  useEffect(() => {
    fetchWarehouses(true);
  }, []);

  const fetchWarehouses = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch('/api/warehouses', { cache: 'no-store' });
      const data = await res.json();
      setWarehouses(data.warehouses || []);
    } catch (err) {
      toast.error('خطأ في تحميل المستودعات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `/api/warehouses/${editId}` : '/api/warehouses';
    
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
        setFormData({ warehouseName: '', location: '', isDefault: false });
        fetchWarehouses();
      } else {
        const d = await res.json();
        toast.error(d.error || 'حدث خطأ');
      }
    } catch (err) {
      toast.error('خطأ في الاتصال');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col gap-2">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-800">🏠 إدارة المستودعات</h1>
        </div>
        <button onClick={() => { setEditId(null); setFormData({ warehouseName: '', location: '', isDefault: false }); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + إضافة مستودع جديد
        </button>
      </div>

      {loading && warehouses.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map(w => (
            <div key={w._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="text-lg font-bold text-gray-900">{w.warehouseName}</div>
                {w.isDefault && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">المستودع الافتراضي</span>}
              </div>
              <div className="text-gray-500 text-sm mb-4 flex items-center gap-2">
                📍 {w.location || 'لا يوجد موقع محدد'}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditId(w._id); setFormData({ warehouseName: w.warehouseName, location: w.location, isDefault: w.isDefault }); setShowModal(true); }}
                  className="flex-1 bg-gray-50 text-blue-600 text-xs py-2 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all font-medium">
                  تعديل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{editId ? 'تعديل مستودع' : 'إضافة مستودع جديد'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1 mr-1">اسم المستودع</label>
                <input type="text" required value={formData.warehouseName} onChange={e => setFormData({ ...formData, warehouseName: e.target.value })}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 focus:border-blue-400 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 mr-1">الموقع</label>
                <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 focus:border-blue-400 outline-none transition-colors" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <input type="checkbox" checked={formData.isDefault} onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="text-sm text-gray-700">تعيين كمستودع افتراضي</span>
              </label>
              <div className="flex gap-3 pt-4 font-bold">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors">حفظ</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl hover:bg-gray-200 transition-colors">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
