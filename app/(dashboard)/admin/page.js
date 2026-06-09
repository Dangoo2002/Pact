// app/admin/page.jsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, Users, Server, Activity, Database, Shield,
  LayoutDashboard, Settings, FileText, Bell, User, Menu,
  LogOut, TrendingUp, AlertCircle, CheckCircle, RefreshCw,
  Loader2, ChevronRight, BarChart3, Clock, Zap, Cpu, 
  HardDrive, Wifi, Lock, Eye, EyeOff, Terminal, BookOpen, GraduationCap
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
// app/admin/page.jsx - Updated Sidebar
const Sidebar = ({ isOpen, onClose }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;
  const handleSignOut = async () => { await signOut({ redirect: false }); router.push('/'); };
  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
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
const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-blue-500/30 transition-all duration-300">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg bg-${color}-500/20`}>
        <Icon size={18} className={`text-${color}-400`} />
      </div>
    </div>
    <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
    <p className="text-xs text-gray-400 mt-1">{title}</p>
  </div>
);

// Activity Item
const ActivityItem = ({ activity }) => {
  const getIcon = () => {
    switch(activity.type) {
      case 'user_registration': return <User size={14} className="text-green-400" />;
      case 'quiz_completed': return <GraduationCap size={14} className="text-blue-400" />;
      default: return <Activity size={14} className="text-gray-400" />;
    }
  };
  
  const getColor = () => {
    switch(activity.type) {
      case 'user_registration': return 'green';
      case 'quiz_completed': return 'blue';
      default: return 'gray';
    }
  };
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition">
      <div className={`p-2 rounded-lg bg-${getColor()}-500/20`}>
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{activity.action}</p>
        <p className="text-xs text-gray-500">{activity.details}</p>
      </div>
      <p className="text-xs text-gray-500">{activity.time}</p>
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
    totalStudents: 0,
    totalInstructors: 0,
    totalAdmins: 0,
    totalQuizzes: 0,
    totalResponses: 0,
    totalQuestions: 0,
    totalResources: 0
  });
  const [userDistribution, setUserDistribution] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);

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
      fetchDashboardData();
    }
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      const data = await response.json();
      setStats(data.stats || stats);
      setUserDistribution(data.userDistribution || []);
      setRecentActivities(data.recentActivities || []);
      setDailyActivity(data.dailyActivity || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
        {/* Fixed Header - No welcome title */}
        <div className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition">
              <Menu size={20} className="text-white" />
            </button>
            <div className="flex-1 ml-2 md:ml-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchDashboardData} disabled={loading} className="p-2 rounded-lg hover:bg-white/10 transition">
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
          
          {/* Stats Cards - Real data */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard title="Total Users" value={stats.totalUsers || 0} icon={Users} color="blue" />
            <StatCard title="Total Quizzes" value={stats.totalQuizzes || 0} icon={Activity} color="green" />
            <StatCard title="Total Responses" value={stats.totalResponses || 0} icon={Database} color="purple" />
            <StatCard title="Total Questions" value={stats.totalQuestions || 0} icon={FileText} color="orange" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* User Distribution Pie Chart */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart size={16} className="text-blue-400" /> User Distribution
              </h2>
              {userDistribution.length > 0 && userDistribution.some(d => d.value > 0) ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={userDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {userDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {userDistribution.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-gray-400">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[250px] flex items-center justify-center">
                  <p className="text-gray-500">No user data available</p>
                </div>
              )}
            </div>

            {/* Daily Activity Chart */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-400" /> Daily Activity (Last 7 Days)
              </h2>
              {dailyActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                    <Bar dataKey="count" fill="#3b82f6" name="Activities" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center">
                  <p className="text-gray-500">No activity data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-blue-400" /> Recent Activity
            </h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, idx) => (
                  <ActivityItem key={idx} activity={activity} />
                ))
              ) : (
                <p className="text-gray-500 text-center py-6">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}