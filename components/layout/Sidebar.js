'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard',  label: 'لوحة التحكم',  icon: '📊' },
  { href: '/pos',        label: 'نقطة البيع',    icon: '🛒' },
  { href: '/sales',      label: 'المبيعات',      icon: '🧾' },
  { href: '/purchases',  label: 'المشتريات',     icon: '🏭' },
  { href: '/expenses',   label: 'المصروفات',     icon: '💸' },
   { href: '/products',   label: 'المنتجات',      icon: '📦' },
  { href: '/warehouses', label: 'المستودعات',   icon: '🏠' },
  { href: '/units',      label: 'وحدات القياس', icon: '📏' },
  { href: '/customers',  label: 'العملاء',       icon: '👥' },
  { href: '/suppliers',  label: 'الموردون',      icon: '🤝' },
  { href: '/reports',    label: 'التقارير',      icon: '📈' },
  { href: '/settings',   label: 'الإعدادات',     icon: '⚙️' },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('تم تسجيل الخروج');
    router.push('/');
  };

  return (
    <aside className={`bg-slate-900 text-white flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} min-h-screen flex-shrink-0`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!collapsed && (
          <div>
            <div className="font-bold text-base text-blue-400 leading-tight">SCI POS</div>
            <div className="text-xs text-slate-400 leading-tight">الصناعات الكيميائية</div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-sm flex-shrink-0">
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}>
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-700">
        {!collapsed && (
          <div className="mb-2 px-2">
            <div className="text-sm font-medium text-white truncate">{user?.name}</div>
            <div className="text-xs text-slate-400">{user?.role || 'مستخدم'}</div>
          </div>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors text-sm">
          <span className="flex-shrink-0">🚪</span>
          {!collapsed && 'تسجيل الخروج'}
        </button>
      </div>
    </aside>
  );
}
