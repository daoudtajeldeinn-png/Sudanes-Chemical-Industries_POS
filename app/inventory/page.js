'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const TYPES = [
  { id: 'FINISHED_GOOD', label: 'منتجات نهائية', icon: '💊' },
  { id: 'RAW_MATERIAL',  label: 'مواد خام',      icon: '🧪' },
  { id: 'PACKAGING',     label: 'تعبئة وتغليف',  icon: '📦' },
  { id: 'CONSUMABLE',    label: 'مستهلكات أخرى', icon: '⚡' },
];

export default function InventoryPage() {
  const [stockData, setStockData] = useState([]);
  const [batches, setBatches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('FINISHED_GOOD');
  const [viewMode, setViewMode] = useState('PRODUCT'); // 'PRODUCT' or 'BATCH'
  const [filter, setFilter] = useState({ warehouse: '', search: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pRes, wRes, bRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/warehouses'),
        fetch('/api/batches')
      ]);
      const [pData, wData, bData] = await Promise.all([
        pRes.json(), wRes.json(), bRes.json()
      ]);
      
      setStockData(pData.products || []);
      setWarehouses(wData.warehouses || []);
      setBatches(bData.batches || []);
    } catch (err) {
      toast.error('خطأ في تحميل بيانات المخزن');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = stockData.filter(p => {
    if (p.productType !== activeTab) return false;
    if (filter.search && !(
      p.productNameAr?.includes(filter.search) || 
      p.productName?.toLowerCase().includes(filter.search.toLowerCase()) ||
      p.productCode?.includes(filter.search)
    )) return false;
    return true;
  });

  const filteredBatches = batches.filter(b => {
    if (b.product?.productType !== activeTab) return false;
    if (filter.warehouse && b.warehouse?._id !== filter.warehouse) return false;
    if (filter.search && !(
      b.batchNumber?.includes(filter.search) || 
      b.product?.productNameAr?.includes(filter.search) ||
      b.product?.productName?.toLowerCase().includes(filter.search.toLowerCase())
    )) return false;
    return true;
  });

  const fmt = (n) => new Intl.NumberFormat('ar-SD').format(Math.round(n || 0));
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('ar-SD') : '-';

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="print-header">
        <h1 className="text-2xl font-bold">الصناعات الكيميائية السودانية (SCI)</h1>
        <h2 className="text-xl">تقرير المخزن والجرد - {TYPES.find(t => t.id === activeTab)?.label}</h2>
        <p className="text-sm">تاريخ التقرير: {new Date().toLocaleString('ar-SD')}</p>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏢 مستودع SCI والتحكم</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة المخزون حسب التصنيف المؤسسي</p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <span>🖨️</span> طباعة التقرير
          </button>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setViewMode('PRODUCT')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'PRODUCT' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            عرض حسب النوع
          </button>
          <button onClick={() => setViewMode('BATCH')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'BATCH' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            تتبع التشغيلات (GMP)
          </button>
        </div>
      </div>

      {/* Classification Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {TYPES.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === t.id ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4 flex-wrap bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <input type="text" placeholder="🔍 بحث بالاسم أو الكود..." className="input-field w-64 text-sm" 
          value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} />
        <select className="input-field w-44 text-sm" value={filter.warehouse} onChange={e => setFilter({ ...filter, warehouse: e.target.value })}>
          <option value="">كل المستودعات</option>
          {warehouses.map(w => <option key={w._id} value={w._id}>{w.warehouseName}</option>)}
        </select>
        <button onClick={loadData} className="mr-auto text-blue-600 hover:rotate-180 transition-transform duration-500">🔄 تحديث</button>
      </div>

      <div className="card p-0 overflow-hidden shadow-lg border-none">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
              {viewMode === 'PRODUCT' ? (
                <>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">كود الصنف</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">اسم المادة/المنتج</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-center">الرصيد المتاح</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-center">العملة الأصلية</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-center">الحالة</th>
                </>
              ) : (
                <>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">رقم التشغيلة</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">الصنف</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">تاريخ الإنتاج</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">تاريخ الانتهاء</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-center">الكمية</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-center">المستودع</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={10} className="text-center py-20 text-gray-400 font-bold">جاري تحميل البيانات...</td></tr>
            ) : viewMode === 'PRODUCT' ? (
              filteredProducts.map(p => (
                <tr key={p._id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-5 py-4 text-sm font-mono text-blue-600 font-medium">{p.productCode}</td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-bold text-gray-900">{p.productNameAr || p.productName}</div>
                    <div className="text-[10px] text-gray-400 font-mono uppercase">{p.productName}</div>
                  </td>
                  <td className="px-5 py-4 text-center font-bold text-base">
                    <span className={(p.stock || 0) <= (p.minStock || 0) ? 'text-red-500' : 'text-blue-700'}>
                      {fmt(p.stock)} <span className="text-[10px] font-normal text-gray-400">{p.unitCode || p.unit?.unitCode}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.currency === 'USD' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                       {p.currency || 'SDG'}
                     </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {(p.stock || 0) <= 0 ? <span className="status-badge-red">نفد</span>
                     : (p.stock || 0) <= (p.minStock || 0) ? <span className="status-badge-yellow">منخفض</span>
                     : <span className="status-badge-green">متوفر</span>}
                  </td>
                </tr>
              ))
            ) : (
              filteredBatches.map(b => {
                const isNearExpiry = new Date(b.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                const isExpired = new Date(b.expiryDate) < new Date();
                return (
                  <tr key={b._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-5 py-4 text-sm font-bold text-indigo-700 bg-indigo-50/30">{b.batchNumber}</td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-gray-900">{b.product?.productNameAr || b.product?.productName}</div>
                      <div className="text-[10px] text-gray-400">{b.product?.productCode}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">{formatDate(b.productionDate)}</td>
                    <td className="px-5 py-4">
                      <div className={`text-xs font-bold ${isExpired ? 'text-red-600' : isNearExpiry ? 'text-orange-500' : 'text-gray-700'}`}>
                        {formatDate(b.expiryDate)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-blue-600 text-sm">{fmt(b.currentQty)}</td>
                    <td className="px-5 py-4 text-center text-xs text-gray-500">{b.warehouse?.warehouseName}</td>
                  </tr>
                );
              })
            )}
            {!loading && (viewMode === 'PRODUCT' ? filteredProducts : filteredBatches).length === 0 && (
              <tr><td colSpan={10} className="text-center py-20 text-gray-400 font-bold">لا توجد مواد ضمن هذا التصنيف حالياً</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
