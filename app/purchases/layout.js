import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
export default function Layout({ children }) {
  const user = getAuthUser();
  if (!user) redirect('/');
  return (
    <div className="flex min-h-screen" dir="rtl">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
}
