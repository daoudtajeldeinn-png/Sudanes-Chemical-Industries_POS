'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`مرحباً ${data.user.name}!`);
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'خطأ في تسجيل الدخول');
      }
    } catch {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-900 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-bold">SCI</span>
          </div>
          <h1 className="text-xl font-bold text-white">الصناعات الكيميائية السودانية</h1>
          <p className="text-blue-200 text-sm mt-1">نظام إدارة المبيعات والمخازن</p>
        </div>

        {/* Form */}
        <div className="p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المستخدم / البريد الإلكتروني</label>
            <input
              type="text" required autoFocus
              className="input-field" placeholder="admin"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور</label>
            <input
              type="password" required
              className="input-field" placeholder="••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full py-3 text-base font-semibold"
          >
            {loading ? '⏳ جاري تسجيل الدخول...' : '🔐 تسجيل الدخول'}
          </button>

          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 text-center space-y-1">
            <div>المستخدم: <strong>admin</strong></div>
            <div>كلمة المرور: <strong>123456</strong></div>
          </div>
        </div>

        <div className="px-8 pb-6 text-center text-xs text-gray-400">
          Sudanese Chemical Industries POS © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
