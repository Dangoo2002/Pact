'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar'; // Assuming this is your standalone Sidebar component
import Navbar from '@/components/ui/Navbar';

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Only redirect if we are SURE there is no session (not just loading)
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 1. Show loading spinner while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. If unauthenticated, return null (redirect is already triggered above)
  // This prevents the "flash" of content before the router pushes
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A1628] relative">
      {/* 
         Note: If your StarBackground was global, put it here. 
         If it was inside the page, keep it in the page. 
         Since we removed it from the page, you might want to add it back here 
         if you want stars on all dashboard pages.
      */}
      
      {/* Desktop Sidebar - Fixed */}
      <div className="hidden md:block fixed left-0 top-0 h-full z-40">
        {/* Pass isOpen/close props if your Sidebar component needs them, 
            otherwise assume it's static for desktop */}
        <Sidebar /> 
      </div>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-[#0A1628]/95 backdrop-blur-xl border-r border-white/10">
             {/* Pass onClose prop to your Sidebar if it handles its own closing logic internally, 
                 or wrap it as you did before */}
            <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Fixed Navbar */}
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Content */}
      <div className="md:ml-64 pt-16 min-h-screen">
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}