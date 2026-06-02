// app/instructor/page.js
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, TrendingUp, Award, Clock, Users, BookOpen,
  Brain, Target, Zap, ChevronRight, Star, 
  Calendar, Flame, BarChart3, MessageSquare,
  Sparkles, Loader2, Send, RefreshCw, Menu, X,
  LogOut, Bell, User, GraduationCap, AlertTriangle,
  LayoutDashboard, FileText, Download, Filter, Plus
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell
} from 'recharts';
import { signOut } from 'next-auth/react';

// Static star background component
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
    { href: '/instructor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/instructor/students', label: 'Students', icon: Users },
    { href: '/instructor/gaps', label: 'Class Gaps', icon: Target },
    { href: '/instructor/assessments', label: 'Assessments', icon: FileText },
    { href: '/instructor/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628]/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="bg-purple-500/20 p-2 rounded-xl"><Code className="h-5 w-5 text-purple-400" /></div>
            <span className="text-xl font-bold text-white">PACT</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Instructor Portal</p>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
                <Icon size={18} /><span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center"><User className="h-4 w-4 text-purple-400" /></div>
            <div className="flex-1"><p className="text-sm font-medium text-white">{session?.user?.name || 'Instructor'}</p><p className="text-xs text-gray-500 capitalize">{role}</p></div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"><LogOut size={16} />Sign Out</button>
        </div>
      </div>
    </>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, change, color = 'purple' }) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400',
    red: 'bg-red-500/20 text-red-400',
    yellow: 'bg-yellow-500/20 text-yellow-400'
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4 hover:border-purple-500/30 transition-all duration-300">
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

export default function InstructorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    activeStudents: 0,
    averageMastery: 0,
    pendingAssignments: 0,
    classProgress: [],
    performanceTrend: [],
    distributionData: [],
    atRiskStudents: []
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [session, status, router, selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/instructor/dashboard?period=${selectedPeriod}`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        <div className="sticky top-0 z-30 bg-[#0A1628]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10"><Menu size={20} /></button>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-white/10 relative"><Bell size={18} /><span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span></button>
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center"><User className="h-4 w-4 text-purple-400" /></div><span className="text-sm text-white hidden sm:inline">{session?.user?.name?.split(' ')[0] || 'Instructor'}</span></div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Instructor Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Monitor class progress and student performance</p>
          </div>

          <div className="flex gap-2 mb-6">
            {['week', 'month', 'semester'].map((period) => (
              <button key={period} onClick={() => setSelectedPeriod(period)} className={`px-3 py-1.5 text-xs rounded-lg transition-all ${selectedPeriod === period ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400' : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'}`}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatCard title="Total Students" value={dashboardData.totalStudents} icon={Users} change="+8" color="blue" />
            <StatCard title="Active Students" value={dashboardData.activeStudents} icon={Users} change="+5" color="green" />
            <StatCard title="Average Mastery" value={`${dashboardData.averageMastery}%`} icon={Brain} change="+4%" color="purple" />
            <StatCard title="Pending Reviews" value={dashboardData.pendingAssignments} icon={FileText} change="3 new" color="orange" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base md:text-lg font-semibold text-white">Class Performance by Concept</h2>
                <Link href="/instructor/gaps" className="text-xs text-purple-400 hover:text-purple-300 transition flex items-center gap-1">View Details <ChevronRight size={12} /></Link>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.classProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="concept" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} formatter={(value) => `${value}%`} />
                    <Bar dataKey="mastery" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-5">
              <h2 className="text-base md:text-lg font-semibold text-white mb-4">Average Performance Trend</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis domain={[50, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} formatter={(value) => `${value}%`} />
                    <Line type="monotone" dataKey="avg" name="Class Average" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-5">
              <h2 className="text-base md:text-lg font-semibold text-white mb-4">Student Performance Distribution</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dashboardData.distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {dashboardData.distributionData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-red-500/20 rounded-xl p-4 md:p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base md:text-lg font-semibold text-red-400 flex items-center gap-2"><AlertTriangle size={18} /> Students Needing Attention</h2>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {dashboardData.atRiskStudents.map((student) => (
                  <div key={student.id} className="bg-white/5 backdrop-blur-sm border border-red-500/20 rounded-xl p-3 hover:border-red-500/40 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center"><User className="h-4 w-4 text-red-400" /></div>
                      <div className="flex-1"><h3 className="font-semibold text-sm text-white">{student.name}</h3><p className="text-xs text-gray-500">Last active: {student.lastActive}</p></div>
                      <div className="text-right"><p className="text-sm font-bold text-red-400">{student.mastery}%</p><p className="text-xs text-gray-500">Mastery</p></div>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3"><div className="h-full bg-red-500 rounded-full" style={{ width: `${student.mastery}%` }} /></div>
                    <button className="w-full text-xs px-2 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition">Send Message</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between"><div><h3 className="font-semibold text-white text-sm">Create Assessment</h3><p className="text-xs text-gray-500 mt-1">Design new quizzes and tests</p></div><button className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition text-xs">Create</button></div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between"><div><h3 className="font-semibold text-white text-sm">Review Submissions</h3><p className="text-xs text-gray-500 mt-1">{dashboardData.pendingAssignments} pending reviews</p></div><button className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition text-xs">Review</button></div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between"><div><h3 className="font-semibold text-white text-sm">Generate Report</h3><p className="text-xs text-gray-500 mt-1">Export class performance data</p></div><button className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition text-xs">Generate</button></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.5); border-radius: 10px; }`}</style>
    </div>
  );
}