// app/admin/page.js
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, Users, BookOpen, Server, Activity, Database, Shield,
  LayoutDashboard, Settings, FileText, Bell, User, Menu, X,
  LogOut, TrendingUp, AlertCircle, CheckCircle, RefreshCw,
  Loader2, ChevronRight, BarChart3, Clock, Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { signOut } from 'next-auth/react';

// Static star background
const StarBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
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

// Sidebar Component
const Sidebar = ({ isOpen, onClose }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/resources', label: 'Resources', icon: BookOpen },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628]/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="bg-green-500/20 p-2 rounded-xl">
              <Code className="h-5 w-5 text-green-400" />
            </div>
            <span className="text-xl font-bold text-white">PACT</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Admin Portal</p>
        </div>
        
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <Icon size={18} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <User className="h-4 w-4 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{session?.user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, change, color = 'green' }) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400',
    red: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4 hover:border-green-500/30 transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <p className="text-xl md:text-2xl font-bold text-white">{value}</p>
            {change && <span className="text-xs text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded-full">{change}</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{title}</p>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalResources: 0,
    totalQuestions: 0,
    totalResponses: 0
  });
  const [userDistribution, setUserDistribution] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    fetchDashboardData();
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      const data = await response.json();
      setStats(data.stats);
      setUserDistribution(data.userDistribution);
      setRecentActivity(data.recentActivity);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    );
  }

  const apiUsageData = [
    { hour: '00:00', calls: 45 },
    { hour: '04:00', calls: 32 },
    { hour: '08:00', calls: 89 },
    { hour: '12:00', calls: 156 },
    { hour: '16:00', calls: 203 },
    { hour: '20:00', calls: 178 },
  ];

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        <div className="sticky top-0 z-30 bg-[#0A1628]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-white/10 relative">
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-green-400" />
                </div>
                <span className="text-sm text-white hidden sm:inline">{session?.user?.name?.split(' ')[0] || 'Admin'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">System overview and management</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="blue" />
            <StatCard title="Total Resources" value={stats.totalResources} icon={BookOpen} color="green" />
            <StatCard title="Total Questions" value={stats.totalQuestions} icon={FileText} color="purple" />
            <StatCard title="Total Responses" value={stats.totalResponses} icon={Activity} color="orange" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-5">
              <h2 className="text-base md:text-lg font-semibold text-white mb-4">User Distribution</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {userDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {userDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-400">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-5">
              <h2 className="text-base md:text-lg font-semibold text-white mb-4">API Usage (Last 24 Hours)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={apiUsageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                    <Area type="monotone" dataKey="calls" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-5">
            <h2 className="text-base md:text-lg font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition">
                  <div className={`p-2 rounded-lg bg-${activity.color}-500/20`}>
                    {activity.icon === 'user' && <Users size={14} className={`text-${activity.color}-400`} />}
                    {activity.icon === 'resource' && <BookOpen size={14} className={`text-${activity.color}-400`} />}
                    {activity.icon === 'quiz' && <FileText size={14} className={`text-${activity.color}-400`} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.details}</p>
                  </div>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}