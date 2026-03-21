'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BackButton from '@/components/BackButton';
import { useAppData } from '@/context/AppDataContext';

const TYPES = [
  { id: 'FINISHED_GOOD', label: 'منتجات نهائية', icon: '💊' },
  { id: 'RAW_MATERIAL',  label: 'مواد خام',      icon: '🧪' },
  { id: 'PACKAGING',     label: 'تعبئة وتغليف',  icon: '📦' },
  { id: 'CONSUMABLE',    label: 'مستهلكات أخرى', icon: '⚡' },
];

export default function InventoryPage() {
  const { products: globalProducts, warehouses: globalWarehouses, batches: globalBatches,
          productsLoaded, fetchProducts, fetchWarehouses, fetchBatches } = useAppData();

  const [stockData, setStockData] = useState([]);
  const [batches, setBatches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('FINISHED_GOOD');
  const [viewMode, setViewMode] = useState('TABLE');
  const [filter, setFilter] = useState({ warehouse: '', search: '' });
  const [isClient, setIsClient] = useState(false);

  // Sync from global context whenever it changes
  useEffect(() => {
    setIsClient(true);
    if (globalProducts.length > 0) {
      setStockData(globalProducts);
      setWarehouses(globalWarehouses);
      setBatches(globalBatches);
      setLoading(false);
    }
    // Trigger silent background refresh from server
    fetchProducts();
    fetchWarehouses();
    fetchBatches();
  }, []);

  // Keep local view in sync with global cache changes after refresh
  useEffect(() => {
    if (globalProducts.length > 0) {
      setStockData(globalProducts);
      setWarehouses(globalWarehouses);
      setBatches(globalBatches);
      setLoading(false);
    }
  }, [globalProducts, globalWarehouses, globalBatches]);

  const loadData = () => {
    // Force refresh from server
    fetchProducts(true);
    fetchWarehouses(true);
    fetchBatches(true);
  };

  const filteredProducts = stockData.filter(p => {
    if (activeTab === 'FINISHED_GOOD') {
      if (p.productType && p.productType !== 'FINISHED_GOOD') return false;
    } else {
      if (p.productType !== activeTab) return false;
    }
    if (filter.search && !(
      p.productNameAr?.includes(filter.search) || 
      p.productName?.toLowerCase().includes(filter.search.toLowerCase()) ||
      p.productCode?.includes(filter.search)
    )) return false;
    return true;
  });

  const filteredBatches = batches.filter(b => {
    if (activeTab === 'FINISHED_GOOD') {
      if (b.product?.productType && b.product?.productType !== 'FINISHED_GOOD') return false;
    } else {
      if (b.product?.productType !== activeTab) return false;
    }
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
        <p className="text-sm">تاريخ التقرير: {isClient ? new Date().toLocaleString('ar-SD') : ''}</p>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 no-print">
        <div className="flex flex-col gap-2">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏢 مستودع SCI والتحكم</h1>
            <p className="text-sm text-gray-500 mt-1">إدارة المخزون حسب التصنيف المؤسسي</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <span>🖨️</span> طباعة التقرير
          </button>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setViewMode('TABLE')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'TABLE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            📑 جدول
          </button>
          <button onClick={() => setViewMode('GRID')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'GRID' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            🖼️ أشكال
          </button>
          <button onClick={() => setViewMode('BATCH')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'BATCH' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            تتبع التشغيلات (GMP)
          </button>
        </div>
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
              {viewMode === 'TABLE' ? (
                <>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">كود الصنف</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">اسم المادة/المنتج</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-center">الرصيد المتاح</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-center">العملة الأصلية</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-center">الحالة</th>
                </>
              ) : viewMode === 'BATCH' ? (
                <>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">رقم التشغيلة</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">الصنف</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">تاريخ الإنتاج</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider">تاريخ الانتهاء</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-center">الكمية</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-center">المستودع</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && stockData.length === 0 && batches.length === 0 ? (
              [1, 2, 3, 4, 5].map((skeleton) => (
                <tr key={skeleton} className="animate-pulse">
                  <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  <td className="px-5 py-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </td>
                  <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
                  <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div></td>
                  <td className="px-5 py-4"><div className="h-6 bg-gray-200 rounded-full w-12 mx-auto"></div></td>
                  {viewMode === 'BATCH' && <td className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>}
                </tr>
              ))
            ) : viewMode === 'TABLE' ? (
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
            ) : viewMode === 'BATCH' ? (
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
            ) : (
                <tr>
                  <td colSpan={10} className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {filteredProducts.map(p => (
                        <div key={p._id} className="bg-white rounded-2xl p-4 border-2 border-gray-100 hover:border-blue-400 hover:shadow-lg transition-all text-right">
                          <div className="flex justify-between items-start mb-2">
                            <span className="badge-blue text-[10px]">{p.productCode}</span>
                            <span className={`text-[10px] font-bold ${(p.stock || 0) <= p.minStock ? 'text-red-500' : 'text-green-600'}`}>
                              {fmt(p.stock)} {p.unitCode || p.unit?.unitCode}
                            </span>
                          </div>
                          <div className="font-bold text-gray-900 text-sm h-10 overflow-hidden line-clamp-2 leading-tight mb-2">
                            {p.productNameAr || p.productName}
                          </div>
                          <div className="text-blue-600 font-bold font-mono text-sm pt-2 border-t">
                            {fmt(p.retailPrice)} <span className="text-[10px]">SDG</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
            )}
            {!loading && (viewMode === 'BATCH' ? filteredBatches : filteredProducts).length === 0 && (
              <tr><td colSpan={10} className="text-center py-20 text-gray-400 font-bold">لا توجد مواد ضمن هذا التصنيف حالياً</td></tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}
