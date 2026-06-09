// app/admin/system/page.jsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, Server, Activity, Database, Cpu, HardDrive, Wifi, 
  LayoutDashboard, Settings, Shield, Bell, User, Menu, LogOut,
  Loader2, RefreshCw, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const StarBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    setSize();
    window.addEventListener('resize', setSize);
    const stars = [];
    for (let i = 0; i < 200; i++) stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 1.5, alpha: Math.random() * 0.5 + 0.2 });
    const draw = () => {
      ctx.fillStyle = '#0A1628';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => { ctx.beginPath(); ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`; ctx.fill(); });
    };
    draw();
    return () => window.removeEventListener('resize', setSize);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
};

const Sidebar = ({ isOpen, onClose }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;
  const handleSignOut = async () => { await signOut({ redirect: false }); router.push('/'); };
  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/system', label: 'System Health', icon: Server },
    { href: '/admin/security', label: 'Security', icon: Shield },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628] backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2"><div className="bg-blue-500/20 p-2 rounded-xl"><Code className="h-5 w-5 text-blue-400" /></div><span className="text-xl font-bold text-white">PACT</span></div>
            <p className="text-xs text-gray-500 mt-2">Admin Portal</p>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
                  <Icon size={18} /><span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-blue-400" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Admin'}</p><p className="text-xs text-gray-500 capitalize truncate">{role}</p></div>
            </div>
            <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"><LogOut size={16} />Sign Out</button>
          </div>
        </div>
      </div>
    </>
  );
};

const HealthMetric = ({ title, value, status, icon: Icon }) => {
  const statusColors = {
    healthy: 'text-green-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400'
  };
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-blue-400" />
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
        <span className={`text-xs ${statusColors[status]}`}>● {status}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
};

export default function AdminSystemPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState({
    database: { status: 'healthy', latency: '24ms', connections: 12 },
    api: { status: 'healthy', uptime: '99.98%', requests: 1234 },
    cache: { status: 'healthy', hitRate: '87%', memory: '256MB' },
    queue: { status: 'healthy', pending: 3, processed: 1234 }
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.replace('/student');
        return;
      }
      fetchSystemHealth();
    }
  }, [session, status, router]);

  const fetchSystemHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/system-health');
      const data = await response.json();
      setSystemHealth(data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        <div className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition">
              <Menu size={20} className="text-white" />
            </button>
            <div className="flex-1 ml-2 md:ml-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">System Health</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchSystemHealth} disabled={loading} className="p-2 rounded-lg hover:bg-white/10 transition">
                <RefreshCw size={18} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/10 transition relative">
                <Bell size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-16 px-3 sm:px-4 md:px-6 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <HealthMetric title="Database" value={`${systemHealth.database?.latency || '24ms'} · ${systemHealth.database?.connections || 12} conn`} status={systemHealth.database?.status || 'healthy'} icon={Database} />
            <HealthMetric title="API Gateway" value={`${systemHealth.api?.uptime || '99.98%'} · ${systemHealth.api?.requests || 1234} req`} status={systemHealth.api?.status || 'healthy'} icon={Activity} />
            <HealthMetric title="Redis Cache" value={`Hit Rate: ${systemHealth.cache?.hitRate || '87%'} · ${systemHealth.cache?.memory || '256MB'}`} status={systemHealth.cache?.status || 'healthy'} icon={Database} />
            <HealthMetric title="Message Queue" value={`${systemHealth.queue?.processed || 1234} processed · ${systemHealth.queue?.pending || 3} pending`} status={systemHealth.queue?.status || 'healthy'} icon={Activity} />
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Server size={16} className="text-blue-400" /> Service Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2"><Database size={14} className="text-green-400" /><span className="text-sm text-white">PostgreSQL Database</span></div>
                <span className="text-xs text-green-400">● Operational</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2"><Activity size={14} className="text-green-400" /><span className="text-sm text-white">Next.js API Routes</span></div>
                <span className="text-xs text-green-400">● Operational</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2"><Cpu size={14} className="text-green-400" /><span className="text-sm text-white">AI Service (Mistral API)</span></div>
                <span className="text-xs text-green-400">● Operational</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2"><Shield size={14} className="text-green-400" /><span className="text-sm text-white">Authentication Service</span></div>
                <span className="text-xs text-green-400">● Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}