'use client';
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Link from 'next/link';

const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  const handleSeed = async () => {
    if (!confirm('إضافة بيانات تجريبية؟')) return;
    const r = await fetch('/api/seed', { method: 'POST' });
    const d = await r.json();
    alert(d.message || d.error);
    window.location.reload();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">جاري التحميل...</div>;

  const chartData = data.monthlySalesData?.map(m => ({
    name: monthNames[m._id.month - 1],
    مبيعات: Math.round(m.total),
    فواتير: m.count,
  })) || [];

  const fmt = (n) => new Intl.NumberFormat('ar-SD').format(Math.round(n || 0));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('ar-SD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSeed} className="btn-secondary text-sm">+ بيانات تجريبية</button>
          <Link href="/pos" className="btn-primary text-sm">🛒 فتح نقطة البيع</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'مبيعات اليوم', value: fmt(data.todayTotal) + ' SDG', sub: `${data.todayCount} فاتورة`, color: 'blue', icon: '💰' },
          { label: 'مبيعات الشهر', value: fmt(data.monthTotal) + ' SDG', sub: `${data.monthCount} فاتورة`, color: 'green', icon: '📅' },
          { label: 'المنتجات', value: data.totalProducts, sub: data.lowStockProducts > 0 ? `⚠️ ${data.lowStockProducts} منخفض المخزون` : '✅ المخزون جيد', color: 'purple', icon: '📦' },
          { label: 'العملاء', value: data.totalCustomers, sub: 'عميل مسجل', color: 'orange', icon: '👥' },
        ].map((s, i) => (
          <div key={i} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">المبيعات الشهرية</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [fmt(v) + ' SDG', 'المبيعات']} />
              <Area type="monotone" dataKey="مبيعات" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
            لا توجد بيانات مبيعات بعد — ابدأ ببيع أول فاتورة!
          </div>
        )}
      </div>

      {/* Recent Sales */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">آخر الفواتير</h2>
          <Link href="/sales" className="text-blue-600 text-sm hover:underline">عرض الكل</Link>
        </div>
        {data.recentSales?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-gray-500">
                <th className="text-right py-2 font-medium">رقم الفاتورة</th>
                <th className="text-right py-2 font-medium">العميل</th>
                <th className="text-right py-2 font-medium">المبلغ</th>
                <th className="text-right py-2 font-medium">التاريخ</th>
              </tr></thead>
              <tbody>
                {data.recentSales.map(s => (
                  <tr key={s._id} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-mono text-blue-600">{s.invoiceNumber}</td>
                    <td className="py-2">{s.customerName || s.customer?.name || 'نقدي'}</td>
                    <td className="py-2 font-semibold">{fmt(s.total)} SDG</td>
                    <td className="py-2 text-gray-500">{new Date(s.createdAt).toLocaleDateString('ar-SD')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">لا توجد فواتير بعد</div>
        )}
      </div>
    </div>
  );
}
