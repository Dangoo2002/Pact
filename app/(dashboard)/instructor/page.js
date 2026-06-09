// app/instructor/page.jsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Code, Users, TrendingUp, Award, Target, BookOpen,
  Menu, User, LogOut, Bell, Sparkles, ChevronRight,
  LayoutDashboard, BarChart3, CheckCircle, AlertCircle,
  TrendingDown, Activity, Brain, Loader2,
  Star, Zap, Flame, Medal, LineChart, PieChart,
  Bot, Send, X, HelpCircle, MessageCircle, RefreshCw,
  Settings, FileText
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart as RePieChart, Pie, Cell
} from 'recharts';

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

// Skeleton
const DashboardSkeleton = () => (
  <div className="pt-4 px-4 md:px-6 pb-6 animate-pulse">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 h-28">
          <div className="h-8 w-8 bg-white/10 rounded-lg mb-4" />
          <div className="h-7 w-16 bg-white/10 rounded mb-2" />
          <div className="h-3 w-24 bg-white/5 rounded" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 h-80">
          <div className="h-5 w-40 bg-white/10 rounded mb-6" />
          <div className="h-56 w-full bg-white/5 rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

// Sidebar
const Sidebar = ({ isOpen, onClose }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;
  const handleSignOut = async () => { await signOut({ redirect: false }); router.push('/'); };
  const navItems = [
    { href: '/instructor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/instructor/students', label: 'Students', icon: Users },
    { href: '/instructor/gaps', label: 'Class Gaps', icon: Target },
    { href: '/instructor/assessments', label: 'Assessments', icon: FileText },
    { href: '/instructor/settings', label: 'Settings', icon: Settings },
  ];
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628] backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="bg-purple-500/20 p-2 rounded-xl"><Code className="h-5 w-5 text-purple-400" /></div>
              <span className="text-xl font-bold text-white">PACT</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Instructor Portal</p>
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
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Instructor'}</p>
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

// Stat Card Component with improved responsiveness
const StatCard = ({ title, value, subtitle, icon: Icon, color = 'purple' }) => {
  const colorClasses = {
    purple: 'bg-purple-500/20 text-purple-400',
    green: 'bg-green-500/20 text-green-400',
    blue: 'bg-blue-500/20 text-blue-400',
    red: 'bg-red-500/20 text-red-400',
    orange: 'bg-orange-500/20 text-orange-400',
    yellow: 'bg-yellow-500/20 text-yellow-400'
  };
  
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4 hover:border-purple-500/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className={`p-1.5 sm:p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
        </div>
      </div>
      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{value}</p>
      <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{title}</p>
      {subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
};

// Charts
const ClassPerformanceChart = ({ data }) => {
  const chartData = data.map(item => ({
    name: item.concept?.substring(0, 10),
    mastery: Math.round(item.mastery),
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tick={{ fontSize: 10 }} />
        <YAxis stroke="#9CA3AF" fontSize={10} />
        <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #ffffff20', borderRadius: '8px' }} />
        <Bar dataKey="mastery" fill="#8B5CF6" name="Class Mastery (%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const PerformanceTrendChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
        <XAxis dataKey="week" stroke="#9CA3AF" fontSize={10} />
        <YAxis stroke="#9CA3AF" fontSize={10} />
        <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #ffffff20', borderRadius: '8px' }} />
        <Area type="monotone" dataKey="avg" stroke="#8B5CF6" fill="#8B5CF640" name="Average Performance (%)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const DistributionPieChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RePieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #ffffff20', borderRadius: '8px' }} />
      </RePieChart>
    </ResponsiveContainer>
  );
};

export default function InstructorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    activeStudents: 0,
    averageMastery: 0,
    pendingAssignments: 0,
    classProgress: [],
    performanceTrend: [],
    distributionData: [],
    atRiskStudents: [],
    classGapHeatmap: [],
    totalAtRisk: 0
  });

  // Auth guard
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'instructor') {
        router.replace('/student');
        return;
      }
      fetchDashboardData();
    }
  }, [status, session?.user?.role, router]);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/instructor/dashboard');
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setDataReady(true);
      setRefreshing(false);
    }
  };

  if (status === 'loading' || (!dataReady && status === 'authenticated')) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const { 
    totalStudents, 
    activeStudents, 
    averageMastery, 
    classProgress, 
    performanceTrend, 
    distributionData, 
    atRiskStudents, 
    classGapHeatmap,
    totalAtRisk 
  } = dashboardData;

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:ml-64">
        {/* Header - No Welcome Title */}
        <div className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition">
              <Menu size={20} className="text-white" />
            </button>

            <div className="flex-1 ml-2 md:ml-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">
                Instructor Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={fetchDashboardData} disabled={refreshing} className="p-2 rounded-lg hover:bg-white/10 transition">
                <RefreshCw size={18} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/10 transition relative">
                <Bell size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area - Starts from top */}
        <div className="pt-16 px-3 sm:px-4 md:px-6 pb-6">
          
          {/* Stats Grid - Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <StatCard title="Total Students" value={totalStudents} icon={Users} color="purple" />
            <StatCard 
              title="Active Students" 
              value={activeStudents} 
              subtitle={`${totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}% participation`}
              icon={Activity} 
              color="green" 
            />
            <StatCard
              title="Average Mastery"
              value={`${averageMastery}%`}
              icon={Brain}
              color="blue"
            />
            <StatCard
              title="At Risk Students"
              value={totalAtRisk || atRiskStudents?.length || 0}
              subtitle="Need attention"
              icon={AlertCircle}
              color="red"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Class Performance Chart */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-purple-400" />
                  <h3 className="font-semibold text-white text-sm sm:text-base">Class Performance by Concept</h3>
                </div>
              </div>
              {classProgress?.length > 0 && classProgress[0]?.mastery > 0 ? (
                <ClassPerformanceChart data={classProgress} />
              ) : (
                <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 size={40} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500">No data available yet</p>
                    <p className="text-xs text-gray-600 mt-1">Complete quizzes to see performance</p>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Trend Chart */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-400" />
                  <h3 className="font-semibold text-white text-sm sm:text-base">Performance Trend</h3>
                </div>
              </div>
              {performanceTrend?.length > 0 && performanceTrend[0]?.avg > 0 ? (
                <PerformanceTrendChart data={performanceTrend} />
              ) : (
                <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
                  <div className="text-center">
                    <LineChart size={40} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500">No trend data available</p>
                    <p className="text-xs text-gray-600 mt-1">Complete more quizzes to see trends</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Performance Distribution */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <PieChart size={16} className="text-blue-400" />
                <h3 className="font-semibold text-white text-sm sm:text-base">Student Performance Distribution</h3>
              </div>
              {distributionData?.some(d => d.value > 0) ? (
                <DistributionPieChart data={distributionData} />
              ) : (
                <div className="h-[180px] sm:h-[220px] flex items-center justify-center">
                  <p className="text-sm text-gray-500">No distribution data available</p>
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-2 mt-2 text-xs text-gray-400">
                {distributionData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name.split('(')[0].trim()}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Knowledge Gaps */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Target size={16} className="text-red-400" />
                <h3 className="font-semibold text-white text-sm sm:text-base">Top Knowledge Gaps</h3>
              </div>
              {classGapHeatmap?.length > 0 ? (
                <div className="space-y-3">
                  {classGapHeatmap.slice(0, 5).map((gap, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs sm:text-sm mb-1 flex-wrap gap-1">
                        <span className="text-gray-300 capitalize">{gap.concept?.replace(/_/g, ' ')}</span>
                        <span className="text-red-400 font-medium">{gap.struggling_percentage}% struggling</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full" 
                          style={{ width: `${gap.struggling_percentage}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Target size={32} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500">No gap data available</p>
                  <p className="text-xs text-gray-600 mt-1">Complete more quizzes to identify gaps</p>
                </div>
              )}
            </div>
          </div>

          {/* At Risk Students Section */}
          {atRiskStudents?.length > 0 && (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-red-400 mb-2">
                    Students Needing Attention ({totalAtRisk || atRiskStudents.length} total)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {atRiskStudents.slice(0, 5).map((student, idx) => (
                      <Link key={idx} href={`/instructor/students/${student.id}`}>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs cursor-pointer hover:bg-red-500/30 transition">
                          {student.name} ({student.mastery}%)
                        </span>
                      </Link>
                    ))}
                    {atRiskStudents.length > 5 && (
                      <Link href="/instructor/students">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs cursor-pointer hover:bg-purple-500/30 transition">
                          +{atRiskStudents.length - 5} more
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}