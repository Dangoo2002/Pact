'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogOut, Bell, Menu, User, Code } from 'lucide-react';

export default function Navbar({ onMenuClick }) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
          >
            <Menu size={20} className="text-gray-400" />
          </button>
          <div className="hidden md:flex items-center gap-2">
            <div className="bg-blue-500/20 p-1.5 rounded-lg">
              <Code className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-sm text-gray-400">Student Dashboard</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors relative">
            <Bell size={18} className="text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-sm font-medium text-white">{session?.user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{session?.user?.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-400" />
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}