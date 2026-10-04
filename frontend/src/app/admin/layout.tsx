'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = useState(260);

  // Watch sidebar collapse
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        setSidebarWidth(sidebar.offsetWidth);
      }
    });

    const sidebar = document.querySelector('aside');
    if (sidebar) {
      setSidebarWidth(sidebar.offsetWidth);
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--admin-content)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--admin-content)' }}>
      <AdminSidebar />
      <div
        className="transition-all duration-300 min-h-screen flex flex-col"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <AdminTopbar />
        <main className="flex-1 p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
