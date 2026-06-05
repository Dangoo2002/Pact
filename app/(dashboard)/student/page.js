'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Code, TrendingUp, Award, Clock, Target, BookOpen, 
  Menu, User, LogOut, Bell, Sparkles, ChevronRight,
  LayoutDashboard, BarChart3, CheckCircle, AlertCircle,
  TrendingDown, Calendar, Activity, Brain, Loader2
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
    { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/gaps', label: 'Knowledge Gaps', icon: Target },
    { href: '/student/quizzes', label: 'Quizzes', icon: BookOpen },
    { href: '/student/recommendations', label: 'Recommendations', icon: Sparkles },
    { href: '/student/profile', label: 'Profile', icon: User },
  ];
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628]/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 border-b border-white/10"><div className="flex items-center gap-2"><div className="bg-blue-500/20 p-2 rounded-xl"><Code className="h-5 w-5 text-blue-400" /></div><span className="text-xl font-bold text-white">PACT</span></div><p className="text-xs text-gray-500 mt-2">Student Portal</p></div>
        <nav className="p-3 space-y-1">{navItems.map((item) => { const Icon = item.icon; return (<Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"><Icon size={18} /><span className="text-sm">{item.label}</span></Link>); })}</nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10"><div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><User className="h-4 w-4 text-blue-400" /></div><div className="flex-1"><p className="text-sm font-medium text-white">{session?.user?.name || 'Student'}</p><p className="text-xs text-gray-500 capitalize">{role}</p></div></div><button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"><LogOut size={16} />Sign Out</button></div>
      </div>
    </>
  );
};

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    overallMastery: 0,
    recentActivity: [],
    conceptMastery: [],
    primaryGapsCount: 0,
    recommendationsCount: 0,
    studyStreak: 0,
    lastActive: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.id) {
      fetchDashboardData();
    }
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch quiz sessions
      const sessionsResponse = await fetch(`/api/student/sessions?studentId=${session.user.id}`);
      const sessionsData = await sessionsResponse.json();
      
      // Fetch responses
      const responsesResponse = await fetch(`/api/student/responses?studentId=${session.user.id}`);
      const responsesData = await responsesResponse.json();
      
      // Fetch gaps
      const gapsResponse = await fetch(`/api/student/gaps?studentId=${session.user.id}`);
      const gapsData = await gapsResponse.json();
      
      // Fetch recommendations
      const recommendationsResponse = await fetch(`/api/student/recommendations?studentId=${session.user.id}`);
      const recommendationsData = await recommendationsResponse.json();
      
      // Calculate metrics
      const sessions = sessionsData.sessions || [];
      const responses = responsesData.responses || [];
      
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const totalQuizzes = sessions.length;
      const completedQuizzes = completedSessions.length;
      
      const totalQuestions = responses.length;
      const correctAnswers = responses.filter(r => r.is_correct === true).length;
      const averageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      // Calculate concept mastery
      const conceptMap = new Map();
      for (const resp of responses) {
        const concept = resp.concept || 'general';
        if (!conceptMap.has(concept)) {
          conceptMap.set(concept, { total: 0, correct: 0 });
        }
        const stats = conceptMap.get(concept);
        stats.total++;
        if (resp.is_correct) stats.correct++;
      }
      
      const conceptMastery = Array.from(conceptMap.entries()).map(([concept, stats]) => ({
        concept,
        mastery: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        totalQuestions: stats.total,
        correctAnswers: stats.correct
      })).sort((a, b) => b.mastery - a.mastery);
      
      const overallMastery = conceptMastery.length > 0 
        ? Math.round(conceptMastery.reduce((sum, c) => sum + c.mastery, 0) / conceptMastery.length)
        : 0;
      
      // Calculate study streak
      const recentDates = [...new Set(responses.map(r => new Date(r.timestamp).toDateString()))];
      let streak = 0;
      if (recentDates.length > 0) {
        streak = 1;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (recentDates.includes(today) || recentDates.includes(yesterday)) streak = Math.min(recentDates.length, 7);
      }
      
      // Get recent activity
      const recentActivity = responses.slice(0, 5).map(r => ({
        concept: r.concept,
        isCorrect: r.is_correct,
        timestamp: r.timestamp,
        question: r.question_text?.substring(0, 50) + '...'
      }));
      
      setDashboardData({
        totalQuizzes,
        completedQuizzes,
        averageScore,
        totalQuestions,
        correctAnswers,
        overallMastery,
        conceptMastery: conceptMastery.slice(0, 5),
        primaryGapsCount: gapsData.primary_gaps?.length || 0,
        recommendationsCount: recommendationsData.recommendations?.length || 0,
        studyStreak: streak,
        lastActive: responses.length > 0 ? responses[0]?.timestamp : null,
        recentActivity
      });
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMasteryColor = (mastery) => {
    if (mastery >= 80) return 'bg-green-500';
    if (mastery >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="ml-3 text-gray-400">Loading your dashboard...</span>
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
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-white/10 relative">
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm text-white hidden sm:inline">
                  {session?.user?.name?.split(' ')[0] || 'Student'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'Student'}!
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {dashboardData.totalQuizzes === 0 
                ? "Start your first quiz to begin your learning journey" 
                : `You've completed ${dashboardData.completedQuizzes} quizzes so far`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <BookOpen size={18} className="text-blue-400" />
                </div>
                <span className="text-xs text-gray-500">Total</span>
              </div>
              <p className="text-2xl font-bold text-white">{dashboardData.totalQuizzes}</p>
              <p className="text-sm text-gray-500">Quizzes Taken</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <TrendingUp size={18} className="text-green-400" />
                </div>
                <span className="text-xs text-gray-500">Average</span>
              </div>
              <p className={`text-2xl font-bold ${getScoreColor(dashboardData.averageScore)}`}>
                {dashboardData.averageScore}%
              </p>
              <p className="text-sm text-gray-500">Average Score</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Brain size={18} className="text-purple-400" />
                </div>
                <span className="text-xs text-gray-500">Mastery</span>
              </div>
              <p className={`text-2xl font-bold ${getScoreColor(dashboardData.overallMastery)}`}>
                {dashboardData.overallMastery}%
              </p>
              <p className="text-sm text-gray-500">Overall Mastery</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Calendar size={18} className="text-orange-400" />
                </div>
                <span className="text-xs text-gray-500">Streak</span>
              </div>
              <p className="text-2xl font-bold text-white">{dashboardData.studyStreak}</p>
              <p className="text-sm text-gray-500">Day Streak</p>
            </div>
          </div>

          {dashboardData.conceptMastery.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-400" />
                Your Concept Mastery
              </h2>
              <div className="space-y-3">
                {dashboardData.conceptMastery.map((concept, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300 capitalize">{concept.concept?.replace(/_/g, ' ')}</span>
                      <span className={getScoreColor(concept.mastery)}>{concept.mastery}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getMasteryColor(concept.mastery)}`}
                        style={{ width: `${concept.mastery}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity size={18} className="text-blue-400" />
                Recent Activity
              </h2>
              {dashboardData.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 pb-3 border-b border-white/10 last:border-0">
                      <div className={`p-1.5 rounded-lg ${activity.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {activity.isCorrect ? <CheckCircle size={14} className="text-green-400" /> : <AlertCircle size={14} className="text-red-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white capitalize">{activity.concept?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">{activity.question}</p>
                      </div>
                      <span className={`text-xs ${activity.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {activity.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Code size={32} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500">No activity yet</p>
                  <Link href="/student/quizzes">
                    <button className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition">
                      Take your first quiz →
                    </button>
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target size={18} className="text-blue-400" />
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/student/quizzes">
                    <button className="w-full p-3 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition text-sm font-medium">
                      Take a Quiz
                    </button>
                  </Link>
                  <Link href="/student/recommendations">
                    <button className="w-full p-3 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition text-sm font-medium">
                      View Recommendations
                    </button>
                  </Link>
                  <Link href="/student/gaps">
                    <button className="w-full p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition text-sm font-medium">
                      Review Knowledge Gaps
                    </button>
                  </Link>
                  <Link href="/student/profile">
                    <button className="w-full p-3 rounded-lg bg-gray-500/20 border border-gray-500/30 text-gray-400 hover:bg-gray-500/30 transition text-sm font-medium">
                      Update Profile
                    </button>
                  </Link>
                </div>
              </div>

              {dashboardData.primaryGapsCount > 0 && (
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-purple-500/30 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Sparkles size={18} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-400 mb-1">AI Insight</p>
                      <p className="text-sm text-gray-300">
                        You have {dashboardData.primaryGapsCount} high-priority knowledge {dashboardData.primaryGapsCount === 1 ? 'gap' : 'gaps'}.
                      </p>
                      <Link href="/student/gaps">
                        <button className="mt-3 text-sm text-purple-400 hover:text-purple-300 transition flex items-center gap-1">
                          Review your gaps <ChevronRight size={14} />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}