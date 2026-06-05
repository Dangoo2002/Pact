'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import Navbar from '@/components/ui/Navbar';

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A1628]">
      {/* Desktop Sidebar - Fixed */}
      <div className="hidden md:block fixed left-0 top-0 h-full z-40">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-[#0A1628]/95 backdrop-blur-xl border-r border-white/10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area with margin for fixed sidebar */}
      <div className="md:ml-64">
        {/* Fixed Navbar */}
        <div className="fixed top-0 right-0 left-0 md:left-64 z-30 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
        </div>
        
        {/* Main Content with top padding to account for fixed navbar */}
        <main className="pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}