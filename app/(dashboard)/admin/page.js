// app/admin/page.jsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, Users, Server, Activity, Database, Shield,
  LayoutDashboard, Settings, FileText, Bell, User, Menu, X,
  LogOut, TrendingUp, AlertCircle, CheckCircle, RefreshCw,
  Loader2, ChevronRight, BarChart3, Clock, Zap, Cpu, 
  HardDrive, Wifi, Lock, Eye, EyeOff, Terminal
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { signOut } from 'next-auth/react';

// Star Background
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
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
    const draw = () => {
      ctx.fillStyle = '#0A1628';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();
      });
    };
    draw();
    return () => window.removeEventListener('resize', setSize);
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
};

// Sidebar
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
            <div className="flex items-center gap-2">
              <div className="bg-blue-500/20 p-2 rounded-xl"><Code className="h-5 w-5 text-blue-400" /></div>
              <span className="text-xl font-bold text-white">PACT</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Admin Portal</p>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 capitalize truncate">{role}</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm">
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Stat Card
const StatCard = ({ title, value, icon: Icon, status, color = 'blue' }) => {
  const statusColors = {
    healthy: 'text-green-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400'
  };
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-blue-500/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-${color}-500/20`}>
          <Icon size={18} className={`text-${color}-400`} />
        </div>
        {status && <span className={`text-xs ${statusColors[status]}`}>● {status}</span>}
      </div>
      <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{title}</p>
    </div>
  );
};

// System Health Card
const SystemHealthCard = ({ title, metrics, color = 'blue' }) => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
      <Activity size={14} className={`text-${color}-400`} />
      {title}
    </h3>
    <div className="space-y-3">
      {metrics.map((metric, idx) => (
        <div key={idx}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">{metric.label}</span>
            <span className="text-white font-medium">{metric.value}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full bg-${color}-500 rounded-full`} style={{ width: `${metric.percentage}%` }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Activity Item
const ActivityItem = ({ activity }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition">
    <div className={`p-2 rounded-lg bg-${activity.color}-500/20`}>
      {activity.icon === 'user' && <Users size={14} className={`text-${activity.color}-400`} />}
      {activity.icon === 'shield' && <Shield size={14} className={`text-${activity.color}-400`} />}
      {activity.icon === 'settings' && <Settings size={14} className={`text-${activity.color}-400`} />}
      {activity.icon === 'database' && <Database size={14} className={`text-${activity.color}-400`} />}
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-white">{activity.action}</p>
      <p className="text-xs text-gray-500">{activity.details}</p>
    </div>
    <p className="text-xs text-gray-500">{activity.time}</p>
  </div>
);

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({
    cpuUsage: 23,
    memoryUsage: 45,
    diskUsage: 38,
    activeConnections: 156,
    apiCallsToday: 1234,
    errorRate: 0.3,
    uptime: '99.98%'
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);

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
      fetchSystemData();
    }
  }, [session, status, router]);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/system-stats');
      const data = await response.json();
      setSystemStats(data.systemStats || systemStats);
      setRecentActivities(data.recentActivities || []);
      setSecurityEvents(data.securityEvents || []);
    } catch (error) {
      console.error('Failed to fetch system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const apiUsageData = [
    { hour: '00:00', calls: 45 },
    { hour: '04:00', calls: 32 },
    { hour: '08:00', calls: 89 },
    { hour: '12:00', calls: 156 },
    { hour: '16:00', calls: 203 },
    { hour: '20:00', calls: 178 },
  ];

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
        {/* Fixed Header - No welcome title */}
        <div className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition">
              <Menu size={20} className="text-white" />
            </button>
            <div className="flex-1 ml-2 md:ml-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">
                System Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchSystemData} disabled={loading} className="p-2 rounded-lg hover:bg-white/10 transition">
                <RefreshCw size={18} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/10 transition relative">
                <Bell size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area - Starts from top */}
        <div className="pt-16 px-3 sm:px-4 md:px-6 pb-6">
          
          {/* System Health Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard title="CPU Usage" value={`${systemStats.cpuUsage}%`} icon={Cpu} status={systemStats.cpuUsage > 80 ? 'critical' : systemStats.cpuUsage > 60 ? 'warning' : 'healthy'} color="blue" />
            <StatCard title="Memory Usage" value={`${systemStats.memoryUsage}%`} icon={Database} status={systemStats.memoryUsage > 80 ? 'critical' : systemStats.memoryUsage > 60 ? 'warning' : 'healthy'} color="green" />
            <StatCard title="Disk Usage" value={`${systemStats.diskUsage}%`} icon={HardDrive} status={systemStats.diskUsage > 80 ? 'critical' : systemStats.diskUsage > 60 ? 'warning' : 'healthy'} color="orange" />
            <StatCard title="System Uptime" value={systemStats.uptime} icon={Activity} color="purple" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-400" /> API Usage (Last 24 Hours)
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={apiUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                  <Area type="monotone" dataKey="calls" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Total API Calls Today: {systemStats.apiCallsToday}</span>
                <span>Error Rate: {systemStats.errorRate}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SystemHealthCard 
                title="System Resources" 
                color="blue"
                metrics={[
                  { label: 'CPU Usage', value: `${systemStats.cpuUsage}%`, percentage: systemStats.cpuUsage },
                  { label: 'Memory Usage', value: `${systemStats.memoryUsage}%`, percentage: systemStats.memoryUsage },
                  { label: 'Disk Usage', value: `${systemStats.diskUsage}%`, percentage: systemStats.diskUsage }
                ]}
              />
              <SystemHealthCard 
                title="Network & Connections" 
                color="green"
                metrics={[
                  { label: 'Active Connections', value: systemStats.activeConnections, percentage: Math.min(100, (systemStats.activeConnections / 500) * 100) },
                  { label: 'Active Sessions', value: Math.floor(systemStats.activeConnections * 0.6), percentage: 60 },
                  { label: 'Database Pool', value: Math.floor(systemStats.activeConnections * 0.3), percentage: 30 }
                ]}
              />
            </div>
          </div>

          {/* Recent Activity & Security Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Clock size={16} className="text-blue-400" /> Recent System Activity
              </h2>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, idx) => (
                    <ActivityItem key={idx} activity={activity} />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-6">No recent activity</p>
                )}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Shield size={16} className="text-red-400" /> Security Events
              </h2>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {securityEvents.length > 0 ? (
                  securityEvents.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition border border-red-500/20">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <AlertCircle size={14} className="text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{event.event}</p>
                        <p className="text-xs text-gray-500">{event.details}</p>
                      </div>
                      <p className="text-xs text-gray-500">{event.time}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-6">No security events detected</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/admin/security">
              <button className="w-full py-2.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition text-sm flex items-center justify-center gap-2">
                <Shield size={14} />
                Security Audit
              </button>
            </Link>
            <Link href="/admin/system">
              <button className="w-full py-2.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition text-sm flex items-center justify-center gap-2">
                <Server size={14} />
                System Health
              </button>
            </Link>
            <Link href="/admin/settings">
              <button className="w-full py-2.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition text-sm flex items-center justify-center gap-2">
                <Settings size={14} />
                System Settings
              </button>
            </Link>
            <button onClick={fetchSystemData} className="w-full py-2.5 rounded-lg bg-gray-500/20 border border-gray-500/30 text-gray-400 hover:bg-gray-500/30 transition text-sm flex items-center justify-center gap-2">
              <RefreshCw size={14} />
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}