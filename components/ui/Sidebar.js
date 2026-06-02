'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  BookOpen, 
  User, 
  BarChart3, 
  GraduationCap, 
  Settings, 
  Users, 
  Library,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

const studentLinks = [
  { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/gaps', label: 'Knowledge Gaps', icon: TrendingUp },
  { href: '/student/quizzes', label: 'Quizzes', icon: BookOpen },
  { href: '/student/recommendations', label: 'Recommendations', icon: Library },
  { href: '/student/profile', label: 'Profile', icon: User },
];

const instructorLinks = [
  { href: '/instructor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/instructor/class-gaps', label: 'Class Gaps', icon: BarChart3 },
  { href: '/instructor/students', label: 'Students', icon: GraduationCap },
];

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/resources', label: 'Resources', icon: Library },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const role = session?.user?.role;
  
  let links = [];
  if (role === 'student') links = studentLinks;
  else if (role === 'instructor') links = instructorLinks;
  else if (role === 'admin') links = adminLinks;
  
  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} border-r bg-card h-screen sticky top-0 transition-all duration-300 flex flex-col`}>
      <div className={`p-6 border-b flex ${collapsed ? 'justify-center' : 'justify-between'} items-center`}>
        {!collapsed && (
          <>
            <h1 className="text-2xl font-bold gradient-text">PACT</h1>
            <p className="text-xs text-muted-foreground hidden lg:block">Adaptive Tutor</p>
          </>
        )}
        {collapsed && <span className="text-2xl font-bold gradient-text">P</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-accent transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                collapsed && 'justify-center'
              )}
              title={collapsed ? link.label : ''}
            >
              <Icon size={18} />
              {!collapsed && <span className="text-sm font-medium">{link.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium">{session?.user?.name?.charAt(0) || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>
            </div>
          )}
          {!collapsed && <ThemeToggle />}
          {collapsed && <ThemeToggle />}
        </div>
      </div>
    </aside>
  );
}