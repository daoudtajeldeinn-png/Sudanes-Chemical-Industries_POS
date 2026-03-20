'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!confirm('إضافة البيانات التجريبية؟ (منتجات كيميائية، عملاء، موردون، وحدات، تصنيفات)')) return;
    setSeeding(true);
    try {
      const r = await fetch('/api/seed', { method: 'POST' });
      const d = await r.json();
      if (r.ok) toast.success(d.message);
      else toast.error(d.error);
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setSeeding(false); }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">⚙️ الإعدادات</h1>

      {/* Company Info */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">🏢 معلومات الشركة</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'اسم الشركة بالعربية', value: 'الصناعات الكيميائية السودانية' },
            { label: 'اسم الشركة بالإنجليزية', value: 'Sudanese Chemical Industries' },
            { label: 'الهاتف', value: '+249912345678' },
            { label: 'البريد الإلكتروني', value: 'info@sci.sd' },
            { label: 'العنوان', value: 'الخرطوم، السودان' },
            { label: 'الرقم الضريبي', value: 'SCI-TAX-001' },
          ].map((f, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input type="text" defaultValue={f.value} className="input-field" />
            </div>
          ))}
        </div>
        <button onClick={() => toast.success('تم الحفظ ✅')} className="btn-primary text-sm">💾 حفظ</button>
      </div>

      {/* System Settings */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">🔧 إعدادات النظام</h2>
        <div className="space-y-3 text-sm">
          {[
            { label: 'العملة', value: 'جنيه سوداني (SDG)' },
            { label: 'نسبة الضريبة الافتراضية %', value: '0', type: 'number' },
            { label: 'حد المخزون الأدنى الافتراضي', value: '10', type: 'number' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-4">
              <label className="w-52 text-gray-700 font-medium">{f.label}</label>
              <input type={f.type || 'text'} defaultValue={f.value} className="input-field w-48" />
            </div>
          ))}
        </div>
      </div>

      {/* Seed Data */}
      <div className="card border-2 border-yellow-200 bg-yellow-50 space-y-3">
        <h2 className="text-lg font-semibold text-yellow-800">🧪 البيانات التجريبية</h2>
        <p className="text-sm text-yellow-700">يضيف بيانات تجريبية مناسبة للصناعات الكيميائية:</p>
        <ul className="text-sm text-yellow-700 space-y-1 mr-4 list-disc">
          <li>12 منتج كيميائي (أحماض، قواعد، مذيبات، أسمدة، كلور، بوليمرات)</li>
          <li>وحدات قياس (KG, L, TON, PCS...)</li>
          <li>تصنيفات المنتجات</li>
          <li>4 عملاء مع مجموعاتهم</li>
          <li>2 مورد</li>
          <li>مخزن رئيسي + مخزون ابتدائي</li>
          <li>فئات المصروفات</li>
        </ul>
        <button onClick={handleSeed} disabled={seeding}
          className="btn-primary bg-yellow-600 hover:bg-yellow-700 text-sm">
          {seeding ? '⏳ جاري الإضافة...' : '+ إضافة البيانات التجريبية'}
        </button>
      </div>

      {/* Login Info */}
      <div className="card border-2 border-blue-200 bg-blue-50">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">🔐 بيانات تسجيل الدخول</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {[
            { label: 'مدير النظام', value: 'admin', pass: 'admin@123' },
            { label: 'مدير الإنتاج', value: 'prod_mgr', pass: '123456' },
            { label: 'أمين المخزن', value: 'wh_mgr', pass: '123456' },
            { label: 'محاسب', value: 'acc_mgr', pass: '123456' },
            { label: 'مبيعات', value: 'sales_rep', pass: '123456' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-lg px-3 py-2 border border-blue-100">
              <div className="text-[10px] text-gray-500 font-bold">{f.label}</div>
              <div className="font-mono text-blue-800 text-xs">User: {f.value}</div>
              <div className="font-mono text-gray-400 text-[10px]">Pass: {f.pass}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="card bg-slate-900 text-white">
        <h2 className="text-lg font-semibold mb-3">🛠️ التقنيات المستخدمة</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            ['الواجهة', 'Next.js 14 + React'],
            ['قاعدة البيانات', 'MongoDB Atlas'],
            ['الاستضافة', 'Vercel'],
            ['التصميم', 'Tailwind CSS'],
            ['المصادقة', 'JWT + Cookies'],
            ['الرسوم البيانية', 'Recharts'],
          ].map(([k, v], i) => (
            <div key={i} className="bg-slate-800 rounded-lg px-3 py-2">
              <div className="text-xs text-slate-400">{k}</div>
              <div className="font-medium text-blue-300">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
