'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Code, TrendingUp, Award, Clock, Target, BookOpen, 
  Menu, User, LogOut, Bell, Sparkles, ChevronRight,
  LayoutDashboard, BarChart3, CheckCircle, AlertCircle,
  TrendingDown, Calendar, Activity, Brain, Loader2,
  Star, Zap, Flame, Medal, PieChart, LineChart
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

// Simple progress bar component
const ProgressBar = ({ value, max = 100, color = 'blue' }) => {
  const percentage = Math.min(100, (value / max) * 100);
  const colorClass = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  }[color] || 'bg-blue-500';
  
  return (
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${percentage}%` }} />
    </div>
  );
};

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    performance: {
      totalQuizzes: 0,
      completedQuizzes: 0,
      averageScore: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      overallMastery: 0,
      currentStreak: 0,
      longestStreak: 0,
      performanceTier: 'beginner'
    },
    conceptMastery: [],
    recentActivity: [],
    weeklyProgress: [],
    primaryGapsCount: 0,
    recommendationsCount: 0,
    aiInsights: null
  });
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);

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
      // Fetch student performance
      const perfResponse = await fetch(`/api/student/performance-stats?studentId=${session.user.id}`);
      const perfData = await perfResponse.json();
      
      // Fetch concept mastery
      const conceptsResponse = await fetch(`/api/student/concept-mastery?studentId=${session.user.id}`);
      const conceptsData = await conceptsResponse.json();
      
      // Fetch recent activity
      const activityResponse = await fetch(`/api/student/recent-activity?studentId=${session.user.id}`);
      const activityData = await activityResponse.json();
      
      // Fetch weekly progress
      const weeklyResponse = await fetch(`/api/student/weekly-progress?studentId=${session.user.id}`);
      const weeklyData = await weeklyResponse.json();
      
      // Fetch gaps and recommendations
      const gapsResponse = await fetch(`/api/student/gaps?studentId=${session.user.id}`);
      const gapsData = await gapsResponse.json();
      
      const recResponse = await fetch(`/api/student/recommendations?studentId=${session.user.id}`);
      const recData = await recResponse.json();
      
      setDashboardData({
        performance: perfData.performance || {
          totalQuizzes: 0,
          completedQuizzes: 0,
          averageScore: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          overallMastery: 0,
          currentStreak: 0,
          longestStreak: 0,
          performanceTier: 'beginner'
        },
        conceptMastery: conceptsData.concepts || [],
        recentActivity: activityData.activities || [],
        weeklyProgress: weeklyData.progress || [],
        primaryGapsCount: gapsData.primary_gaps?.length || 0,
        recommendationsCount: recData.recommendations?.length || 0,
        aiInsights: null
      });
      
      // Generate AI insights
      generateAIInsights();
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    setGeneratingInsights(true);
    try {
      const response = await fetch('/api/ai/dashboard-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: session.user.id,
          performance: dashboardData.performance,
          conceptMastery: dashboardData.conceptMastery,
          gapsCount: dashboardData.primaryGapsCount
        })
      });
      const data = await response.json();
      setDashboardData(prev => ({ ...prev, aiInsights: data.insights }));
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
    } finally {
      setGeneratingInsights(false);
    }
  };

  const getPerformanceColor = (tier) => {
    switch(tier) {
      case 'excellent': return 'text-green-400 bg-green-500/20';
      case 'average': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-red-400 bg-red-500/20';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMasteryColor = (mastery) => {
    if (mastery >= 80) return 'bg-green-500';
    if (mastery >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="ml-3 text-gray-400">Loading your dashboard...</span>
      </div>
    );
  }

  const { performance, conceptMastery, recentActivity, weeklyProgress, aiInsights } = dashboardData;
  const performanceTier = performance.performanceTier || 'beginner';

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
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><User className="h-4 w-4 text-blue-400" /></div><span className="text-sm text-white hidden sm:inline">{session?.user?.name?.split(' ')[0] || 'Student'}</span></div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {/* Welcome Section */}
          <div className="mb-6 flex flex-wrap justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Welcome back, {session?.user?.name?.split(' ')[0] || 'Student'}!
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                {performance.totalQuizzes === 0 
                  ? "Start your first quiz to begin your learning journey" 
                  : `You've completed ${performance.completedQuizzes} quizzes so far`}
              </p>
            </div>
            <div className={`mt-3 sm:mt-0 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${getPerformanceColor(performanceTier)}`}>
              {performanceTier === 'excellent' && <Medal size={16} />}
              {performanceTier === 'average' && <TrendingUp size={16} />}
              {performanceTier === 'beginner' && <Target size={16} />}
              {performanceTier === 'excellent' ? 'Excellent Performance' : 
               performanceTier === 'average' ? 'Average Performance' : 'Needs Improvement'}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-500/20"><BookOpen size={18} className="text-blue-400" /></div>
                <span className="text-xs text-gray-500">Total</span>
              </div>
              <p className="text-2xl font-bold text-white">{performance.totalQuizzes}</p>
              <p className="text-sm text-gray-500">Quizzes Taken</p>
              <p className="text-xs text-gray-600 mt-1">{performance.completedQuizzes} completed</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-green-500/20"><TrendingUp size={18} className="text-green-400" /></div>
                <span className="text-xs text-gray-500">Average</span>
              </div>
              <p className={`text-2xl font-bold ${getScoreColor(performance.averageScore)}`}>{Math.round(performance.averageScore)}%</p>
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-xs text-gray-600 mt-1">{performance.correctAnswers}/{performance.totalQuestions} correct</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-purple-500/20"><Brain size={18} className="text-purple-400" /></div>
                <span className="text-xs text-gray-500">Mastery</span>
              </div>
              <p className={`text-2xl font-bold ${getScoreColor(performance.overallMastery)}`}>{Math.round(performance.overallMastery)}%</p>
              <p className="text-sm text-gray-500">Overall Mastery</p>
              {dashboardData.primaryGapsCount > 0 && (
                <p className="text-xs text-red-400 mt-1">{dashboardData.primaryGapsCount} gaps to address</p>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-orange-500/20"><Flame size={18} className="text-orange-400" /></div>
                <span className="text-xs text-gray-500">Streak</span>
              </div>
              <p className="text-2xl font-bold text-white">{performance.currentStreak || 0}</p>
              <p className="text-sm text-gray-500">Day Streak</p>
              {performance.longestStreak > 0 && (
                <p className="text-xs text-gray-600 mt-1">Best: {performance.longestStreak} days</p>
              )}
            </div>
          </div>

          {/* AI Insights Card */}
          {(aiInsights || generatingInsights) && (
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-purple-500/30 rounded-xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Sparkles size={18} className="text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-400 mb-1">AI Learning Insights</p>
                  {generatingInsights ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-purple-400" />
                      <span className="text-sm text-gray-400">Generating personalized insights...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-300">{aiInsights?.summary || 'Keep up the good work!'}</p>
                      {aiInsights?.recommendation && (
                        <p className="text-sm text-blue-400 mt-2">💡 {aiInsights.recommendation}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Concept Mastery Section with Visualizations */}
          {conceptMastery.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-400" />
                Concept Mastery Breakdown
              </h2>
              <div className="space-y-4">
                {conceptMastery.map((concept, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300 capitalize flex items-center gap-2">
                        {concept.concept?.replace(/_/g, ' ')}
                        {concept.trend === 'improving' && <TrendingUp size={12} className="text-green-400" />}
                        {concept.trend === 'declining' && <TrendingDown size={12} className="text-red-400" />}
                      </span>
                      <span className={getScoreColor(concept.mastery)}>{Math.round(concept.mastery)}%</span>
                    </div>
                    <ProgressBar value={concept.mastery} color={getMasteryColor(concept.mastery).replace('bg-', '')} />
                    <p className="text-xs text-gray-500 mt-1">{concept.totalQuestions} questions • {concept.correctAnswers} correct</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Progress Chart */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <LineChart size={18} className="text-blue-400" />
                Weekly Progress
              </h2>
              {weeklyProgress.length > 0 ? (
                <div className="space-y-3">
                  {weeklyProgress.map((week, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Week of {new Date(week.weekStart).toLocaleDateString()}</span>
                        <span className={getScoreColor(week.averageScore)}>{Math.round(week.averageScore)}%</span>
                      </div>
                      <ProgressBar value={week.averageScore} color={getMasteryColor(week.averageScore).replace('bg-', '')} />
                      <p className="text-xs text-gray-500 mt-1">{week.quizzesCompleted} quizzes completed</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar size={32} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500">Complete quizzes to see your weekly progress</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity size={18} className="text-blue-400" />
                Recent Activity
              </h2>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 pb-3 border-b border-white/10 last:border-0">
                      <div className={`p-1.5 rounded-lg ${activity.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {activity.isCorrect ? <CheckCircle size={14} className="text-green-400" /> : <AlertCircle size={14} className="text-red-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white capitalize">{activity.concept?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">{activity.question}</p>
                        <p className="text-xs text-gray-600 mt-1">{new Date(activity.timestamp).toLocaleDateString()}</p>
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
                  <Link href="/student/quizzes"><button className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition">Take your first quiz →</button></Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target size={18} className="text-blue-400" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/student/quizzes"><button className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition text-sm font-medium">Take a Quiz</button></Link>
                <Link href="/student/recommendations"><button className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition text-sm font-medium">View Recommendations</button></Link>
                <Link href="/student/gaps"><button className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition text-sm font-medium">Review Knowledge Gaps</button></Link>
                <Link href="/student/profile"><button className="p-3 rounded-lg bg-gray-500/20 border border-gray-500/30 text-gray-400 hover:bg-gray-500/30 transition text-sm font-medium">Update Profile</button></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}