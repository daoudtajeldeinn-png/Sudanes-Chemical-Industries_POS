'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#2563eb','#16a34a','#dc2626','#d97706','#7c3aed','#0891b2','#db2777'];
const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    const p = from || to ? `?from=${from}&to=${to}` : '';
    const [dash, sales, purchases, expenses] = await Promise.all([
      fetch('/api/dashboard').then(r => r.json()),
      fetch(`/api/sales${p}`).then(r => r.json()),
      fetch(`/api/purchases${p}`).then(r => r.json()),
      fetch(`/api/expenses${p}`).then(r => r.json()),
    ]);
    setData({ dash, sales: sales.sales || [], purchases: purchases.purchases || [], expenses: expenses.expenses || [] });
  };

  useEffect(() => { load(); }, [from, to]);

  const fmt = (n) => new Intl.NumberFormat('ar-SD').format(Math.round(n || 0));

  if (!data) return <div className="flex items-center justify-center h-64 text-gray-400">جاري التحميل...</div>;

  const { dash, sales, purchases, expenses } = data;
  const totalSales = sales.filter(s => s.status !== 'CANCELLED').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalCOGS = sales.reduce((s, i) => s + (i.items || []).reduce((t, it) => t + ((it.costPrice || 0) * it.quantity), 0), 0);
  const totalPurchases = purchases.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const grossProfit = totalSales - totalCOGS;
  const netProfit = grossProfit - totalExpenses;

  // Monthly chart
  const monthlyData = (dash.monthlySalesData || []).map(m => ({
    name: MONTHS[m._id.month - 1],
    مبيعات: Math.round(m.total),
    فواتير: m.count,
  }));

  // Product breakdown from sales
  const prodMap = {};
  sales.forEach(s => (s.items || []).forEach(item => {
    const name = item.productName || 'أخرى';
    prodMap[name] = (prodMap[name] || 0) + (item.totalPrice || 0);
  }));
  const prodData = Object.entries(prodMap).map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value).slice(0, 7);

  // Expense by category
  const expMap = {};
  expenses.forEach(e => { expMap[e.categoryName || 'أخرى'] = (expMap[e.categoryName || 'أخرى'] || 0) + e.amount; });
  const expData = Object.entries(expMap).map(([name, value]) => ({ name, value: Math.round(value) }));

  return (
    <div className="p-6 space-y-6">
      <div className="print-header">
        <h1 className="text-2xl font-bold">الصناعات الكيميائية السودانية (SCI)</h1>
        <h2 className="text-xl">تقرير الأداء المالي والإحصائي</h2>
        <p className="text-sm">بتاريخ: {new Date().toLocaleString('ar-SD')}</p>
        <p className="text-xs">الفترة من: {from || '-'} إلى: {to || '-'}</p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <h1 className="text-2xl font-bold text-gray-900">📈 التقارير والإحصائيات</h1>
        <div className="flex gap-3 items-center flex-wrap">
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <span>🖨️</span> طباعة التقرير (PDF)
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">من:</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field w-36" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">إلى:</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field w-36" />
          </div>
          {(from || to) && <button onClick={() => { setFrom(''); setTo(''); }} className="btn-secondary text-sm">مسح</button>}
        </div>
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المبيعات', value: fmt(totalSales) + ' SDG', icon: '💰', color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'إجمالي المشتريات', value: fmt(totalPurchases) + ' SDG', icon: '🏭', color: 'bg-orange-50 border-orange-200 text-orange-700' },
          { label: 'إجمالي المصروفات', value: fmt(totalExpenses) + ' SDG', icon: '💸', color: 'bg-red-50 border-red-200 text-red-700' },
          { label: 'صافي الربح', value: fmt(netProfit) + ' SDG', icon: netProfit >= 0 ? '📈' : '📉', color: netProfit >= 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700' },
        ].map((s, i) => (
          <div key={i} className={`card border-2 ${s.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-75">{s.label}</p>
                <p className="text-xl font-bold mt-1">{s.value}</p>
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* More KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'هامش الربح الإجمالي', value: totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) + '%' : '0%', icon: '📊' },
          { label: 'عدد الفواتير', value: sales.length, icon: '🧾' },
          { label: 'متوسط الفاتورة', value: fmt(sales.length ? totalSales / sales.length : 0) + ' SDG', icon: '📋' },
          { label: 'منتجات منخفضة المخزون', value: dash.lowStockCount || 0, icon: '⚠️' },
        ].map((s, i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">{s.label}</p><p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p></div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">المبيعات الشهرية</h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [fmt(v) + ' SDG']} />
                <Bar dataKey="مبيعات" fill="#2563eb" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-52 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl">لا توجد بيانات بعد</div>}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">توزيع المبيعات بالمنتج</h2>
          {prodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={prodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {prodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend formatter={(v) => v.length > 20 ? v.slice(0,20) + '...' : v} />
                <Tooltip formatter={(v) => [fmt(v) + ' SDG']} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-52 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl">لا توجد بيانات بعد</div>}
        </div>
      </div>

      {/* Expenses by category */}
      {expData.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">المصروفات حسب الفئة</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={expData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [fmt(v) + ' SDG']} />
              <Bar dataKey="value" fill="#dc2626" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
