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
  Star, Zap, Flame, Medal, PieChart, LineChart,
  Bot, Send, MessageCircle, X, Minimize2, Maximize2,
  Settings, HelpCircle, LifeBuoy, FileText, GraduationCap,
  Trophy, Briefcase, Rocket, Globe, Database, Cpu,
  Shield, FastIcon, GitBranch, Layers, Server, Copy, ThumbsUp, ThumbsDown,
  Home, BookMarked, BarChart
} from 'lucide-react';
import { signOut } from 'next-auth/react';

// Star Background Component
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

// Sidebar Component
const Sidebar = ({ isOpen, onClose }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;
  const handleSignOut = async () => { await signOut({ redirect: false }); router.push('/'); };
  const navItems = [
    { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/quizzes', label: 'Quizzes', icon: BookOpen },
    { href: '/student/gaps', label: 'Knowledge Gaps', icon: Target },
    { href: '/student/recommendations', label: 'Recommendations', icon: Sparkles },
    { href: '/student/profile', label: 'Profile', icon: User },
  ];
  
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-72 bg-[#0A1628]/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2.5 rounded-xl">
              <Code className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">PACT</span>
              <p className="text-xs text-gray-500">AI-Powered Learning</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition group">
                  <Icon size={20} className="group-hover:text-blue-400 transition" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.label === 'Dashboard' && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Current</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{session?.user?.name || 'Student'}</p>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition text-sm">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

// Progress Bar Component
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

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 rounded-xl bg-${color}-500/20`}>
        <Icon size={22} className={`text-${color}-400`} />
      </div>
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="text-sm text-gray-400 mt-1">{title}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
  </div>
);

// Get time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// Main Dashboard Component
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
      performanceTier: 'beginner',
      conceptsMastered: 0,
      totalConcepts: 15
    },
    conceptMastery: [],
    recentActivity: [],
    weeklyProgress: [],
    primaryGapsCount: 0,
    recommendationsCount: 0
  });
  const [loading, setLoading] = useState(true);
  
  // AI Chat State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.id) {
      fetchDashboardData();
    }
  }, [session, status, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch from your existing APIs that work
      const [gapsResponse, recResponse, responsesResponse] = await Promise.all([
        fetch(`/api/student/gaps?studentId=${session.user.id}`),
        fetch(`/api/student/recommendations?studentId=${session.user.id}`),
        fetch(`/api/student/responses?studentId=${session.user.id}`)
      ]);

      const gapsData = await gapsResponse.json();
      const recData = await recResponse.json();
      const responsesData = await responsesResponse.json();

      const responses = responsesData.responses || [];
      const totalQuestions = responses.length;
      const correctAnswers = responses.filter(r => r.is_correct === true).length;
      const averageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      // Calculate concept mastery from responses
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

      const conceptsMastered = conceptMastery.filter(c => c.mastery >= 80).length;

      // Get recent activity
      const recentActivity = responses.slice(0, 5).map(r => ({
        concept: r.concept,
        isCorrect: r.is_correct,
        timestamp: r.timestamp,
        question: r.question_text?.substring(0, 60) + '...'
      }));

      // Calculate weekly progress from response dates
      const weekMap = new Map();
      for (const resp of responses) {
        if (resp.timestamp) {
          const date = new Date(resp.timestamp);
          const weekStart = getWeekStart(date);
          const weekKey = weekStart.toISOString().split('T')[0];
          if (!weekMap.has(weekKey)) {
            weekMap.set(weekKey, { total: 0, correct: 0, count: 0 });
          }
          const weekStats = weekMap.get(weekKey);
          weekStats.total++;
          if (resp.is_correct) weekStats.correct++;
          weekStats.count++;
        }
      }

      const weeklyProgress = Array.from(weekMap.entries())
        .map(([weekStart, stats]) => ({
          weekStart,
          averageScore: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
          quizzesCompleted: stats.count
        }))
        .sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart))
        .slice(-4);

      // Calculate streak from response dates
      let streak = 0;
      const uniqueDates = [...new Set(responses.map(r => new Date(r.timestamp).toDateString()))];
      if (uniqueDates.length > 0) {
        streak = 1;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
          streak = Math.min(uniqueDates.length, 7);
        }
      }

      // Get completed quizzes count
      const sessionsResponse = await fetch(`/api/student/sessions?studentId=${session.user.id}`);
      const sessionsData = await sessionsResponse.json();
      const completedQuizzes = (sessionsData.sessions || []).filter(s => s.status === 'completed').length;

      setDashboardData({
        performance: {
          totalQuizzes: (sessionsData.sessions || []).length,
          completedQuizzes: completedQuizzes,
          averageScore: averageScore,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          overallMastery: overallMastery,
          currentStreak: streak,
          longestStreak: streak,
          performanceTier: overallMastery >= 80 ? 'excellent' : overallMastery >= 60 ? 'average' : 'beginner',
          conceptsMastered: conceptsMastered,
          totalConcepts: 15
        },
        conceptMastery: conceptMastery.slice(0, 5),
        recentActivity: recentActivity,
        weeklyProgress: weeklyProgress,
        primaryGapsCount: gapsData.primary_gaps?.length || 0,
        recommendationsCount: recData.recommendations?.length || 0
      });

      // Add AI welcome message
      const greeting = getGreeting();
      const studentName = session?.user?.name?.split(' ')[0] || 'there';
      setMessages([
        { 
          id: 1,
          role: 'assistant', 
          content: `${greeting}, ${studentName}! 👋 I'm your AI learning assistant.\n\nBased on your progress, you've completed ${completedQuizzes} quizzes with ${averageScore}% average accuracy. Your overall mastery is at ${overallMastery}%.\n\nHow can I help you today? You can ask me about:\n• Programming concepts you're struggling with\n• Your knowledge gaps and how to fix them\n• Recommended resources for specific topics\n• Study strategies and tips`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { 
      id: messages.length + 1,
      role: 'user', 
      content: input, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          studentId: session.user.id,
          context: {
            performance: dashboardData.performance,
            recentActivity: dashboardData.recentActivity?.slice(0, 5),
            gaps: dashboardData.primaryGapsCount,
            conceptMastery: dashboardData.conceptMastery
          }
        })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { 
        id: prev.length + 1,
        role: 'assistant', 
        content: data.reply || "I'm sorry, I couldn't process that. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        id: prev.length + 1,
        role: 'assistant', 
        content: "I'm having trouble connecting. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-blue-400';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  const { performance, conceptMastery, recentActivity, weeklyProgress } = dashboardData;
  const greeting = getGreeting();
  const studentName = session?.user?.name?.split(' ')[0] || 'Student';

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-72">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[#0A1628]/90 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10">
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20">
                  <LayoutDashboard size={18} className="text-blue-400" />
                </div>
                <h1 className="text-xl font-semibold text-white">Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-white/10 relative">
                <Bell size={18} className="text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
              </button>
              <button className="p-2 rounded-lg hover:bg-white/10">
                <HelpCircle size={18} className="text-gray-400" />
              </button>
              <div className="flex items-center gap-2 ml-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {session?.user?.name?.charAt(0) || 'S'}
                  </span>
                </div>
                <span className="text-sm text-white hidden sm:inline">
                  {studentName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Split Layout */}
        <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
          {/* Left Panel - Analytics & Metrics (55%) */}
          <div className="w-full lg:w-[55%] overflow-y-auto p-6 border-r border-white/10">
            {/* Welcome Section - FIXED: Now displays correctly */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">{greeting}, {studentName}! 👋</h2>
              <p className="text-gray-400 mt-1 text-sm">
                {performance.totalQuizzes === 0 
                  ? "Ready to start your learning journey? Take your first quiz today!" 
                  : `Great progress! You've completed ${performance.completedQuizzes} quizzes and are on a ${performance.currentStreak}-day streak.`}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <StatCard 
                title="Quizzes Completed"
                value={performance.completedQuizzes}
                subtitle={`${performance.totalQuizzes} total attempts`}
                icon={BookOpen}
                color="blue"
              />
              <StatCard 
                title="Average Score"
                value={`${Math.round(performance.averageScore)}%`}
                subtitle={`${performance.correctAnswers}/${performance.totalQuestions} correct`}
                icon={TrendingUp}
                color="green"
              />
              <StatCard 
                title="Overall Mastery"
                value={`${Math.round(performance.overallMastery)}%`}
                subtitle={`${performance.conceptsMastered}/${performance.totalConcepts} concepts mastered`}
                icon={Brain}
                color="purple"
              />
              <StatCard 
                title="Current Streak"
                value={`${performance.currentStreak} days`}
                subtitle={`Best: ${performance.longestStreak} days`}
                icon={Flame}
                color="orange"
              />
            </div>

            {/* Concept Mastery Section */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20">
                    <BarChart3 size={18} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Concept Mastery</h3>
                </div>
                <Link href="/student/gaps">
                  <button className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
                    View Details <ChevronRight size={14} />
                  </button>
                </Link>
              </div>
              <div className="space-y-4">
                {conceptMastery.length > 0 ? (
                  conceptMastery.map((concept, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300 capitalize">{concept.concept?.replace(/_/g, ' ')}</span>
                        <span className={getScoreColor(concept.mastery)}>{Math.round(concept.mastery)}%</span>
                      </div>
                      <ProgressBar value={concept.mastery} color={concept.mastery >= 80 ? 'green' : concept.mastery >= 60 ? 'yellow' : 'blue'} />
                      <p className="text-xs text-gray-500 mt-1.5">{concept.totalQuestions} questions • {concept.correctAnswers} correct</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Database size={32} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500">Complete quizzes to see your concept mastery</p>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Progress */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-green-500/20">
                  <LineChart size={18} className="text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Weekly Progress</h3>
              </div>
              {weeklyProgress.length > 0 ? (
                <div className="space-y-4">
                  {weeklyProgress.map((week, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Week of {new Date(week.weekStart).toLocaleDateString()}</span>
                        <span className={getScoreColor(week.averageScore)}>{Math.round(week.averageScore)}%</span>
                      </div>
                      <ProgressBar value={week.averageScore} color={week.averageScore >= 80 ? 'green' : week.averageScore >= 60 ? 'yellow' : 'blue'} />
                      <p className="text-xs text-gray-500 mt-1.5">{week.quizzesCompleted} quizzes completed</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar size={32} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500">Complete quizzes to see your progress trend</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - AI Assistant (45%) */}
          <div className="w-full lg:w-[45%] flex flex-col bg-[#0D1A2D]/50 backdrop-blur-sm">
            {/* Panel Header */}
            <div className="p-4 border-b border-white/10 bg-blue-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500">
                    <Bot size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">PACT AI Assistant</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                      <p className="text-xs text-green-400">Online • Ready to help</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatMinimized(!isChatMinimized)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition"
                >
                  {isChatMinimized ? <Maximize2 size={16} className="text-gray-400" /> : <Minimize2 size={16} className="text-gray-400" />}
                </button>
              </div>
            </div>

            {!isChatMinimized && (
              <>
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3 flex-shrink-0">
                          <Bot size={16} className="text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                        <div className={`p-3 rounded-2xl ${
                          msg.role === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white/10 border border-white/20 text-gray-200'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp}
                        </p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center ml-3 flex-shrink-0">
                          <User size={16} className="text-blue-400" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3 flex-shrink-0">
                        <Bot size={16} className="text-white" />
                      </div>
                      <div className="bg-white/10 border border-white/20 rounded-2xl p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-white/10 bg-white/5">
                  <div className="flex gap-2">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about your learning progress, concepts, or gaps..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
                      rows={2}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      className="px-4 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Powered by Mistral AI • Real-time learning assistance
                  </p>
                </div>
              </>
            )}

            {isChatMinimized && (
              <div className="flex-1 flex items-center justify-center p-8">
                <button 
                  onClick={() => setIsChatMinimized(false)}
                  className="text-center"
                >
                  <div className="p-4 rounded-full bg-blue-500/20 mx-auto mb-3">
                    <Bot size={32} className="text-blue-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Click to open AI Assistant</p>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}