'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Menu, User, LogOut, Bell, LayoutDashboard,
  BookOpen, Target, Sparkles, Code, X
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const SidebarContent = ({ onClose }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const role = session?.user?.role;

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const navItems = [
    { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/quizzes', label: 'Quizzes', icon: BookOpen },
    { href: '/student/gaps', label: 'Knowledge Gaps', icon: Target },
    { href: '/student/recommendations', label: 'Recommendations', icon: Sparkles },
    { href: '/student/profile', label: 'Profile', icon: User },
  ];

  const isActive = (href) => {
    if (href === '/student') {
      return pathname === '/student';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500/20 p-2 rounded-xl">
            <Code className="h-5 w-5 text-blue-400" />
          </div>
          <span className="text-xl font-bold text-white">PACT</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">Student Portal</p>
      </div>
      
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                active
                  ? 'bg-blue-500/20 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {session?.user?.name || 'Student'}
            </p>
            <p className="text-xs text-gray-500 capitalize truncate">{role}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

const Navbar = ({ onMenuClick }) => {
  const { data: session } = useSession();
  const studentName = session?.user?.name?.split(' ')[0] || 'Student';

  return (
    <div className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-white/10"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden md:flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20">
            <LayoutDashboard size={18} className="text-blue-400" />
          </div>
          <h1 className="text-xl font-semibold text-white">Learning Analytics</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg hover:bg-white/10 relative">
            <Bell size={18} className="text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-sm text-white hidden sm:inline">{studentName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // Close sidebar on route change on mobile
  useEffect(() => {
    const handleRouteChange = () => {
      setSidebarOpen(false);
    };
    
    // Close sidebar when children change (route changed)
    setSidebarOpen(false);
  }, [children]);

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
      <div className="hidden md:block fixed inset-y-0 left-0 w-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-r border-white/10">
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="absolute inset-y-0 left-0 w-64 bg-[#0A1628]/95 backdrop-blur-xl border-r border-white/10">
          <div className="flex justify-end p-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          <SidebarContent onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Fixed Navbar */}
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Content with padding for fixed navbar and sidebar */}
      <div className="md:ml-64 pt-16">
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}