'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const [stockData, setStockData] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', warehouse: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pRes, wRes, cRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/warehouses'),
        fetch('/api/categories')
      ]);
      const [pData, wData, cData] = await Promise.all([pRes.json(), wRes.json(), cRes.json()]);
      
      setStockData(pData.products || []);
      setWarehouses(wData.warehouses || []);
      setCategories(cData.categories || []);
    } catch (err) {
      toast.error('خطأ في تحميل بيانات المخزن');
    } finally {
      setLoading(false);
    }
  };

  const filtered = stockData.filter(p => {
    if (filter.category && p.category?._id !== filter.category) return false;
    // Add warehouse filter logic here if the API provides per-warehouse stock in products list
    return true;
  });

  const fmt = (n) => new Intl.NumberFormat('ar-SD').format(Math.round(n || 0));

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">📦 المخزن والجرد</h1>
        <div className="flex gap-3">
          <select className="input-field w-48 text-sm" value={filter.warehouse} onChange={e => setFilter({ ...filter, warehouse: e.target.value })}>
            <option value="">كل المخازن</option>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.warehouseName}</option>)}
          </select>
          <select className="input-field w-48 text-sm" value={filter.category} onChange={e => setFilter({ ...filter, category: e.target.value })}>
            <option value="">كل التصنيفات</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.categoryNameAr || c.categoryName}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 bg-blue-50 border-blue-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-600 font-bold mb-1">إجمالي الأصناف</div>
            <div className="text-2xl font-bold text-blue-900">{filtered.length}</div>
          </div>
          <div className="text-3xl opacity-20">📦</div>
        </div>
        <div className="card p-4 bg-green-50 border-green-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-green-600 font-bold mb-1">قيمة المخزون (بيع)</div>
            <div className="text-xl font-bold text-green-900">{fmt(filtered.reduce((s, p) => s + (p.stock * p.retailPrice), 0))} <span className="text-xs">SDG</span></div>
          </div>
          <div className="text-3xl opacity-20">💰</div>
        </div>
        <div className="card p-4 bg-yellow-50 border-yellow-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-yellow-600 font-bold mb-1">أصناف منخفضة</div>
            <div className="text-2xl font-bold text-yellow-900">{filtered.filter(p => (p.stock || 0) <= (p.minStock || 0)).length}</div>
          </div>
          <div className="text-3xl opacity-20">⚠️</div>
        </div>
        <div className="card p-4 bg-red-50 border-red-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-red-600 font-bold mb-1">أصناف نفدت</div>
            <div className="text-2xl font-bold text-red-900">{filtered.filter(p => (p.stock || 0) <= 0).length}</div>
          </div>
          <div className="text-3xl opacity-20">⛔</div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden shadow-md">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-5 py-3 text-xs font-bold text-gray-600">كود المنتج</th>
              <th className="px-5 py-3 text-xs font-bold text-gray-600">اسم المنتج</th>
              <th className="px-5 py-3 text-xs font-bold text-gray-600">التصنيف</th>
              <th className="px-5 py-3 text-xs font-bold text-gray-600">سعر التكلفة</th>
              <th className="px-5 py-3 text-xs font-bold text-gray-600">الرصيد الحالي</th>
              <th className="px-5 py-3 text-xs font-bold text-gray-600">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="6" className="text-center py-10 text-gray-400">جاري التحميل...</td></tr>
            ) : filtered.map(p => (
              <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-sm font-mono text-blue-600">{p.productCode}</td>
                <td className="px-5 py-3">
                  <div className="text-sm font-bold text-gray-900">{p.productNameAr || p.productName}</div>
                  <div className="text-xs text-gray-400">{p.productName}</div>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">{p.category?.categoryNameAr || 'غير مصنف'}</td>
                <td className="px-5 py-3 text-sm text-gray-500">{fmt(p.costPrice)} {p.currency}</td>
                <td className="px-5 py-3 font-bold text-sm">
                  <span className={(p.stock || 0) <= (p.minStock || 0) ? 'text-red-600' : 'text-green-600'}>
                    {p.stock || 0} {p.unit?.unitCode}
                  </span>
                </td>
                <td className="px-5 py-3 px-3 italic">
                  {(p.stock || 0) <= 0 ? (
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">⛔ نفد</span>
                  ) : (p.stock || 0) <= (p.minStock || 0) ? (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-[10px] font-bold">⚠️ منخفض</span>
                  ) : (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">✅ متوفر</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
