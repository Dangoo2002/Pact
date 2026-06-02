// app/instructor/gaps/page.js
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, Target, AlertTriangle, TrendingDown, BarChart3, 
  ChevronRight, Menu, X, LogOut, Bell, User, 
  LayoutDashboard, Users, FileText, Loader2, 
  CheckCircle, XCircle, Clock, BookOpen, RefreshCw
} from 'lucide-react';
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
          <div className="flex items-center gap-2"><div className="bg-purple-500/20 p-2 rounded-xl"><Code className="h-5 w-5 text-purple-400" /></div><span className="text-xl font-bold text-white">PACT</span></div>
          <p className="text-xs text-gray-500 mt-2">Instructor Portal</p>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (<Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"><Icon size={18} /><span className="text-sm">{item.label}</span></Link>);
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center"><User className="h-4 w-4 text-purple-400" /></div><div className="flex-1"><p className="text-sm font-medium text-white">{session?.user?.name || 'Instructor'}</p><p className="text-xs text-gray-500 capitalize">{role}</p></div></div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"><LogOut size={16} />Sign Out</button>
        </div>
      </div>
    </>
  );
};

export default function ClassGapsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState({
    class_gap_heatmap: [],
    common_error_patterns: [],
    recommendations: []
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetchGapInsights();
  }, [session, status, router]);

  const fetchGapInsights = async () => {
    try {
      const response = await fetch('/api/instructor/gap-insights');
      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch gap insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGapInsights();
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
              <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-lg hover:bg-white/10 transition"><RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} /></button>
              <button className="p-2 rounded-lg hover:bg-white/10 relative"><Bell size={18} /><span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span></button>
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center"><User className="h-4 w-4 text-purple-400" /></div><span className="text-sm text-white hidden sm:inline">{session?.user?.name?.split(' ')[0] || 'Instructor'}</span></div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Class Knowledge Gaps</h1>
            <p className="text-sm text-gray-400 mt-1">Identify concepts where students are struggling</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-5 mb-6">
            <h2 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-purple-400" /> Concept Gap Analysis</h2>
            {insights.class_gap_heatmap?.length > 0 ? (
              <div className="space-y-4">
                {insights.class_gap_heatmap.map((gap, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-white">{gap.concept}</span>
                      <span className="text-red-400">{gap.struggling_percentage}% struggling</span>
                    </div>
                    <div className="h-8 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-red-500 rounded-full flex items-center justify-end px-3 text-xs text-white font-medium" style={{ width: `${gap.struggling_percentage}%` }}>
                        {gap.struggling_percentage > 20 && `${gap.struggling_percentage}%`}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{gap.total_attempts} total attempts</span>
                      <span>{gap.correct_count} correct answers</span>
                      <span>Success rate: {((gap.correct_count / gap.total_attempts) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12"><BarChart3 size={48} className="mx-auto text-gray-600 mb-4" /><p className="text-gray-500">No gap data available yet. Students need to complete more quizzes.</p></div>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-5 mb-6">
            <h2 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-yellow-400" /> Common Error Patterns</h2>
            {insights.common_error_patterns?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.common_error_patterns.map((pattern, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-yellow-500/20 hover:border-yellow-500/40 transition">
                    <div className="flex items-center gap-2"><TrendingDown size={16} className="text-yellow-400" /><span className="text-sm text-gray-300">{pattern.pattern}</span></div>
                    <span className="text-sm font-medium text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded-full">{pattern.frequency} occurrences</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No error patterns identified yet.</p>
            )}
          </div>

          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 md:p-5">
            <h2 className="text-base md:text-lg font-semibold text-white mb-3 flex items-center gap-2">📚 Recommended Instructor Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {insights.recommendations?.length > 0 ? (
                insights.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle size={14} className="text-green-400" /> {rec}</div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle size={14} className="text-green-400" /> Complete more assessments to generate insights</div>
                  <div className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle size={14} className="text-green-400" /> Review student performance regularly</div>
                  <div className="flex items-center gap-2 text-sm text-gray-300"><CheckCircle size={14} className="text-green-400" /> Create targeted practice materials</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}