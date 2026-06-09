// app/admin/security/page.jsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, Shield, Lock, Eye, EyeOff, Key, 
  LayoutDashboard, Server, Settings, Bell, User, Menu, LogOut,
  Loader2, RefreshCw, CheckCircle, AlertCircle, Clock, Terminal
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

export default function AdminSecurityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    apiRateLimit: 100
  });
  const [recentLogins, setRecentLogins] = useState([]);

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
      fetchSecurityData();
    }
  }, [session, status, router]);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/security-data');
      const data = await response.json();
      setSecuritySettings(data.securitySettings || securitySettings);
      setRecentLogins(data.recentLogins || []);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTwoFactor = async () => {
    const newValue = !securitySettings.twoFactorEnabled;
    setSecuritySettings({ ...securitySettings, twoFactorEnabled: newValue });
    try {
      await fetch('/api/admin/security-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twoFactorEnabled: newValue })
      });
    } catch (error) {
      console.error('Failed to update 2FA setting:', error);
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
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">Security</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchSecurityData} disabled={loading} className="p-2 rounded-lg hover:bg-white/10 transition">
                <RefreshCw size={18} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/10 transition relative">
                <Bell size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-16 px-3 sm:px-4 md:px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Lock size={16} className="text-blue-400" /> Security Settings
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <button onClick={toggleTwoFactor} className={`relative w-11 h-6 rounded-full transition-all duration-300 ${securitySettings.twoFactorEnabled ? 'bg-blue-500' : 'bg-gray-600'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 ${securitySettings.twoFactorEnabled ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Session Timeout (minutes)</label>
                  <input type="number" value={securitySettings.sessionTimeout} onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Max Login Attempts</label>
                  <input type="number" value={securitySettings.maxLoginAttempts} onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">API Rate Limit (requests per minute)</label>
                  <input type="number" value={securitySettings.apiRateLimit} onChange={(e) => setSecuritySettings({...securitySettings, apiRateLimit: parseInt(e.target.value)})} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50" />
                </div>
              </div>
              <button className="w-full mt-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition text-sm">Save Security Settings</button>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Clock size={16} className="text-blue-400" /> Recent Login Activity
              </h2>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {recentLogins.length > 0 ? recentLogins.map((login, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition border border-white/10">
                    <div className="p-2 rounded-lg bg-blue-500/20"><Terminal size={14} className="text-blue-400" /></div>
                    <div className="flex-1"><p className="text-sm font-medium text-white">{login.user}</p><p className="text-xs text-gray-500">{login.location || 'Unknown location'} • {login.ip}</p></div>
                    <p className="text-xs text-gray-500">{login.time}</p>
                  </div>
                )) : <p className="text-gray-500 text-center py-6">No recent login activity</p>}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Key size={16} className="text-blue-400" /> API Keys</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input type={showApiKey ? 'text' : 'password'} value="sk-pact_live_xxxxxxxxxxxxxxxxxxxx" readOnly className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono pr-10" />
                <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition text-sm whitespace-nowrap">Regenerate Key</button>
            </div>
            <p className="text-xs text-gray-500 mt-3">This API key has access to system-level endpoints. Keep it secure and rotate regularly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}