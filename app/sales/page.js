'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

export default function SalesPage() {
  const [isClient, setIsClient] = useState(false);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    fetch(`/api/sales?${params}`, { cache: 'no-store' }).then(r => r.json()).then(d => { setSales(d.sales || []); setLoading(false); });
  };
  useEffect(() => { 
    setIsClient(true);
    load(); 
  }, [from, to]);

  const fmt = (n) => new Intl.NumberFormat('ar-SD').format(Math.round(n || 0));
  const totalRevenue = sales.filter(s => s.status !== 'CANCELLED').reduce((s, i) => s + (i.totalAmount || 0), 0);

  const statusMap = { PAID: { label: 'مدفوع', cls: 'badge-green' }, PARTIAL: { label: 'جزئي', cls: 'badge-yellow' }, CREDIT: { label: 'آجل', cls: 'badge-red' }, CANCELLED: { label: 'ملغي', cls: 'badge-red' } };
  const payMap = { CASH: '💵 نقدي', CARD: '💳 بطاقة', CREDIT: '📝 آجل', TRANSFER: '🏦 تحويل' };

  return (
    <div className="p-6 space-y-5">
      <div className="print-header">
        <h1 className="text-2xl font-bold">الصناعات الكيميائية السودانية (SCI)</h1>
        <h2 className="text-xl">تقرير المبيعات</h2>
        <p className="text-sm">بتاريخ: {isClient ? new Date().toLocaleString('ar-SD') : ''}</p>
      </div>

      <div className="flex justify-between items-center no-print">
        <div className="flex flex-col gap-2">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🧾 المبيعات</h1>
            <p className="text-sm text-gray-500 mt-1">عرض وإدارة فواتير المبيعات</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/pos" className="btn-primary">🛒 فاتورة جديدة</Link>
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <span>🖨️</span> طباعة القائمة
          </button>
        </div>
      </div>

      <div className="flex gap-3 items-center flex-wrap no-print">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">من:</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field w-40" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">إلى:</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field w-40" />
        </div>
        {(from || to) && <button onClick={() => { setFrom(''); setTo(''); }} className="btn-secondary text-sm">مسح</button>}
        <div className="mr-auto bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm">
          <span className="text-gray-600">الإجمالي: </span>
          <span className="font-bold text-blue-700">{fmt(totalRevenue)} SDG</span>
          <span className="text-gray-400 mr-2">({sales.length} فاتورة)</span>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['رقم الفاتورة','العميل','الإجمالي','المدفوع','طريقة الدفع','الحالة','التاريخ',''].map((h,i) => (
                <th key={i} className="text-right py-3 px-4 font-medium text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {loading && sales.length === 0 ? (
                [1, 2, 3, 4, 5].map((skeleton) => (
                  <tr key={skeleton} className="animate-pulse border-b border-gray-50">
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="py-4 px-4"><div className="h-5 bg-gray-200 rounded-lg w-16"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                  </tr>
                ))
              ) : sales.length === 0 ? <tr><td colSpan="8" className="text-center py-12 text-gray-400">لا توجد فواتير</td></tr>
              : sales.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-blue-600 text-xs">{s.invoiceNumber}</td>
                  <td className="py-3 px-4 font-medium">{s.customerName || s.customer?.customerName || 'نقدي'}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{fmt(s.totalAmount)} SDG</td>
                  <td className="py-3 px-4 text-gray-600">{fmt(s.paidAmount)} SDG</td>
                  <td className="py-3 px-4 text-gray-600">{payMap[s.paymentMethod] || s.paymentMethod}</td>
                  <td className="py-3 px-4"><span className={(statusMap[s.status] || statusMap.PAID).cls}>{(statusMap[s.status] || statusMap.PAID).label}</span></td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{new Date(s.invoiceDate).toLocaleDateString('ar-SD')}</td>
                  <td className="py-3 px-4">
                    <Link href={`/sales/${s._id}`} className="text-blue-600 hover:text-blue-800 text-xs">عرض</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
