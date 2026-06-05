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
  Star, Zap, Flame, Medal, LineChart,
  Bot, Send, X, Minimize2, Maximize2, Copy, Check,
  HelpCircle, Database, PieChart, Hexagon, CircleDot, MessageCircle
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
    { href: '/student/quizzes', label: 'Quizzes', icon: BookOpen },
    { href: '/student/gaps', label: 'Knowledge Gaps', icon: Target },
    { href: '/student/recommendations', label: 'Recommendations', icon: Sparkles },
    { href: '/student/profile', label: 'Profile', icon: User },
  ];
  
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628]/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500/20 p-2 rounded-xl"><Code className="h-5 w-5 text-blue-400" /></div>
            <span className="text-xl font-bold text-white">PACT</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Student Portal</p>
        </div>
        <nav className="p-3 space-y-1">
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{session?.user?.name || 'Student'}</p>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

// Progress Bar Component
const ProgressBar = ({ value, max = 100, color = 'blue', label }) => {
  const percentage = Math.min(100, (value / max) * 100);
  const colorClass = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }[color] || 'bg-blue-500';
  
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-gray-400 capitalize">{label.replace(/_/g, ' ')}</span>
          <span className="text-white font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon }) => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4 hover:border-blue-500/30 transition-all duration-300">
    <div className="flex items-center justify-between mb-2">
      <div className="p-1.5 md:p-2 rounded-lg bg-blue-500/20">
        <Icon size={16} className="md:text-[18px] text-blue-400" />
      </div>
    </div>
    <p className="text-xl md:text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-gray-400 mt-0.5 md:mt-1">{title}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

// Line Graph Component for Concept Performance (from concept_performance table)
const ConceptLineGraph = ({ concepts }) => {
  const sortedConcepts = [...concepts].sort((a, b) => a.mastery - b.mastery);
  
  return (
    <div className="h-48 md:h-56 mt-4">
      <div className="relative h-full">
        {/* Y-axis labels */}
        <div className="absolute -left-6 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-500">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>
        
        {/* Chart area */}
        <div className="ml-6 h-full relative">
          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[100, 75, 50, 25, 0].map((line, i) => (
              <div key={i} className="border-t border-white/10 w-full"></div>
            ))}
          </div>
          
          {/* Bars */}
          <div className="relative h-full flex items-end gap-1 md:gap-2 pt-4">
            {sortedConcepts.map((concept, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div 
                  className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
                  style={{ 
                    height: `${concept.mastery}%`,
                    backgroundColor: concept.mastery >= 70 ? '#10B981' : concept.mastery >= 50 ? '#F59E0B' : '#EF4444',
                    minHeight: '4px'
                  }}
                />
                <p className="text-xs text-gray-500 mt-2 text-center truncate w-full group-hover:text-blue-400 transition">
                  {concept.concept?.replace(/_/g, ' ').substring(0, 8)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Hexagonal Graph Component (showing top 6 concepts from concept_performance)
const HexagonalGraph = ({ concepts }) => {
  const getColor = (mastery) => {
    if (mastery >= 80) return '#10B981';
    if (mastery >= 60) return '#3B82F6';
    if (mastery >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getGlow = (mastery) => {
    if (mastery >= 80) return '0 0 15px rgba(16, 185, 129, 0.3)';
    if (mastery >= 60) return '0 0 15px rgba(59, 130, 246, 0.3)';
    if (mastery >= 40) return '0 0 15px rgba(245, 158, 11, 0.3)';
    return '0 0 15px rgba(239, 68, 68, 0.3)';
  };

  const topConcepts = [...concepts].sort((a, b) => b.mastery - a.mastery).slice(0, 6);
  
  // Fill remaining slots with empty placeholders if less than 6 concepts
  while (topConcepts.length < 6) {
    topConcepts.push({ concept: 'pending', mastery: 0, totalQuestions: 0 });
  }

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4 mt-4">
      {topConcepts.map((concept, idx) => (
        <div key={idx} className="flex flex-col items-center text-center group">
          <div 
            className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer"
            style={{ 
              backgroundColor: concept.mastery > 0 ? `${getColor(concept.mastery)}20` : '#1E293B',
              border: `2px solid ${concept.mastery > 0 ? getColor(concept.mastery) : '#475569'}`,
              boxShadow: concept.mastery > 0 ? getGlow(concept.mastery) : 'none'
            }}
          >
            {concept.mastery > 0 ? (
              <span className="text-base md:text-xl font-bold" style={{ color: getColor(concept.mastery) }}>
                {Math.round(concept.mastery)}%
              </span>
            ) : (
              <HelpCircle size={20} className="text-gray-600 md:text-2xl" />
            )}
          </div>
          <p className="text-xs md:text-sm text-gray-400 mt-2 capitalize group-hover:text-white transition">
            {concept.concept?.replace(/_/g, ' ').substring(0, 12) || 'Not Started'}
          </p>
          {concept.totalQuestions > 0 && (
            <p className="text-xs text-gray-500">{concept.totalQuestions} Qs</p>
          )}
        </div>
      ))}
    </div>
  );
};

// Ranked Concept List (from concept_performance table)
const RankedConceptList = ({ concepts }) => {
  const sortedConcepts = [...concepts].sort((a, b) => b.mastery - a.mastery);
  
  return (
    <div className="space-y-3">
      {sortedConcepts.map((concept, idx) => (
        <div key={idx}>
          <div className="flex justify-between text-xs md:text-sm mb-1">
            <span className="text-gray-300 capitalize flex items-center gap-2">
              <span className="text-xs text-gray-500">#{idx + 1}</span>
              {concept.concept?.replace(/_/g, ' ')}
            </span>
            <span className={concept.mastery >= 70 ? 'text-green-400' : concept.mastery >= 50 ? 'text-yellow-400' : 'text-red-400'}>
              {Math.round(concept.mastery)}%
            </span>
          </div>
          <ProgressBar value={concept.mastery} color={concept.mastery >= 70 ? 'green' : concept.mastery >= 50 ? 'yellow' : 'red'} />
          <p className="text-xs text-gray-500 mt-1">{concept.totalQuestions} questions</p>
        </div>
      ))}
    </div>
  );
};

// AI Chat Button with Banner
const AIChatButton = ({ onClick, isOpen }) => {
  const [showBanner, setShowBanner] = useState(true);

  if (isOpen) return null;

  return (
    <div className="relative">
      {showBanner && (
        <div className="absolute -top-10 right-0 bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap animate-pulse">
          <MessageCircle size={12} />
          <span>Talk to PACT AI</span>
          <button 
            onClick={() => setShowBanner(false)} 
            className="ml-1 hover:bg-white/20 rounded-full p-0.5"
          >
            <X size={10} />
          </button>
        </div>
      )}
      <button
        onClick={onClick}
        className="bg-blue-500 rounded-full p-3 shadow-lg hover:bg-blue-600 transition-all duration-300 hover:scale-105"
      >
        <Bot size={24} className="text-white" />
      </button>
    </div>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    performance: {
      totalQuizzes: 0,
      completedQuizzes: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      overallMastery: 0,
      performanceTier: 'beginner'
    },
    conceptMastery: [],
    primaryGaps: [],
    secondaryGaps: []
  });
  const [loading, setLoading] = useState(true);
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const studentId = session.user.id;
      
      // Fetch concept performance from your database
      const conceptRes = await fetch(`/api/student/concept-performance?studentId=${studentId}`);
      const conceptData = await conceptRes.json();
      
      // Fetch student performance
      const perfRes = await fetch(`/api/student/student-performance?studentId=${studentId}`);
      const perfData = await perfRes.json();
      
      // Fetch gaps from your gap analysis API
      const gapsRes = await fetch(`/api/student/gaps?studentId=${studentId}`);
      const gapsData = await gapsRes.json();
      
      // Map concept_performance data to dashboard format
      const conceptMastery = (conceptData.concepts || []).map(c => ({
        concept: c.concept,
        mastery: parseFloat(c.mastery_score) || 0,
        totalQuestions: c.total_questions || 0,
        correctAnswers: c.correct_answers || 0
      }));
      
      // Calculate overall mastery from concept_performance
      const overallMastery = conceptMastery.length > 0 
        ? Math.round(conceptMastery.reduce((sum, c) => sum + c.mastery, 0) / conceptMastery.length)
        : perfData.overall_mastery || 0;
      
      // Calculate accuracy from student_performance
      const accuracy = perfData.average_score || 
        (perfData.total_correct_answers && perfData.total_questions_answered 
          ? Math.round((perfData.total_correct_answers / perfData.total_questions_answered) * 100)
          : 0);
      
      setDashboardData({
        performance: {
          totalQuizzes: perfData.total_quizzes || 0,
          completedQuizzes: perfData.completed_quizzes || 0,
          totalQuestions: perfData.total_questions_answered || 0,
          correctAnswers: perfData.total_correct_answers || 0,
          accuracy: accuracy,
          overallMastery: overallMastery,
          performanceTier: perfData.performance_tier || 'beginner'
        },
        conceptMastery: conceptMastery,
        primaryGaps: gapsData.primary_gaps || [],
        secondaryGaps: gapsData.secondary_gaps || []
      });
      
      const greeting = getGreeting();
      const studentName = session?.user?.name?.split(' ')[0] || 'Student';
      
      setMessages([
        { 
          id: 1,
          role: 'assistant', 
          content: `${greeting}, ${studentName}! I'm your AI learning assistant.\n\n**Your Learning Summary:**\n• You've completed ${perfData.completed_quizzes || 0} quizzes\n• Your overall accuracy is ${accuracy}%\n• Your mastery score is ${overallMastery}%\n• You have ${gapsData.primary_gaps?.length || 0} knowledge gaps\n\nHow can I help you today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
            accuracy: dashboardData.performance.accuracy,
            totalQuizzes: dashboardData.performance.completedQuizzes,
            overallMastery: dashboardData.performance.overallMastery,
            primaryGaps: dashboardData.primaryGaps
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const greeting = getGreeting();
  const studentName = session?.user?.name?.split(' ')[0] || 'Student';
  const { performance, conceptMastery, primaryGaps } = dashboardData;

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        {/* Fixed Header */}
        <div className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20">
                <LayoutDashboard size={18} className="text-blue-400" />
              </div>
              <h1 className="text-xl font-semibold text-white">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-white/10 relative">
                <Bell size={18} className="text-gray-400" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm text-white hidden sm:inline">{studentName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with proper padding for fixed header */}
        {/* Added pt-24 to push content down below the fixed header on all screens */}
        <div className="pt-24 md:pt-24 px-4 md:px-6 pb-24 md:pb-6">
          
          {/* Welcome Section - Now fully visible below header */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {greeting}, {studentName}!
            </h2>
            <p className="text-sm md:text-base text-gray-400 mt-2 max-w-2xl">
              {performance.completedQuizzes === 0 
                ? "Start your first quiz to begin your learning journey" 
                : `You've completed ${performance.completedQuizzes} quizzes with ${performance.accuracy}% accuracy. Keep going!`}
            </p>
          </div>

          {/* Stats Grid - Data from student_performance table */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatCard 
              title="Quizzes Done"
              value={performance.completedQuizzes}
              subtitle={`${performance.totalQuizzes} total`}
              icon={BookOpen}
            />
            <StatCard 
              title="Accuracy"
              value={`${performance.accuracy}%`}
              subtitle={`${performance.correctAnswers}/${performance.totalQuestions}`}
              icon={TrendingUp}
            />
            <StatCard 
              title="Mastery"
              value={`${performance.overallMastery}%`}
              subtitle={performance.performanceTier?.replace('_', ' ')}
              icon={Brain}
            />
            <StatCard 
              title="Questions"
              value={performance.totalQuestions}
              icon={Activity}
            />
          </div>

          {/* Visualizations Section - Data from concept_performance table */}
          {conceptMastery.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Line Graph Visualization */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <LineChart size={18} className="text-blue-400" />
                    <h3 className="font-semibold text-white text-sm md:text-base">Performance Trend</h3>
                  </div>
                  <span className="text-xs text-gray-500">Concept Mastery (%)</span>
                </div>
                <div className="overflow-x-auto">
                  <ConceptLineGraph concepts={conceptMastery} />
                </div>
              </div>

              {/* Hexagonal Graph Visualization */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Hexagon size={18} className="text-blue-400" />
                    <h3 className="font-semibold text-white text-sm md:text-base">Concept Mastery Hexagon</h3>
                  </div>
                  <span className="text-xs text-gray-500">Top 6 Concepts</span>
                </div>
                <HexagonalGraph concepts={conceptMastery} />
              </div>
            </div>
          )}

          {/* Ranked Concept Performance List - Data from concept_performance table */}
          {conceptMastery.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-400" />
                  <h3 className="font-semibold text-white text-sm md:text-base">Ranked Concept Performance</h3>
                </div>
                <Link href="/student/gaps">
                  <button className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
                    View All <ChevronRight size={12} />
                  </button>
                </Link>
              </div>
              <RankedConceptList concepts={conceptMastery.slice(0, 5)} />
            </div>
          )}

          {/* High Priority Gaps - Data from gap analysis API */}
          {primaryGaps && primaryGaps.length > 0 && (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-400 mb-1">High Priority Gaps</p>
                  <p className="text-sm text-gray-300">
                    Focus on: {primaryGaps.slice(0, 3).map(g => g.concept?.replace(/_/g, ' ')).join(', ')}
                  </p>
                  <Link href="/student/gaps">
                    <button className="mt-2 text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1">
                      View Details <ChevronRight size={10} />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* No Data State */}
          {conceptMastery.length === 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
              <Target size={40} className="mx-auto text-gray-500 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">No Data Yet</h3>
              <p className="text-sm text-gray-400">Complete your first quiz to see your performance metrics and knowledge gaps.</p>
              <Link href="/student/quizzes">
                <button className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm transition">
                  Start a Quiz
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* AI Chat - Mobile */}
        <div className="fixed bottom-4 right-4 z-50 md:hidden">
          {isChatMinimized ? (
            <AIChatButton onClick={() => setIsChatMinimized(false)} isOpen={!isChatMinimized} />
          ) : (
            <div className="absolute bottom-0 right-0 w-[90vw] max-w-sm bg-[#0D1A2D] border border-white/20 rounded-xl shadow-2xl">
              <div className="p-3 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-blue-400" />
                  <span className="text-sm font-medium text-white">AI Assistant</span>
                </div>
                <button onClick={() => setIsChatMinimized(true)} className="p-1 hover:bg-white/10 rounded">
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
              <div className="h-80 overflow-y-auto p-3 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-2 rounded-lg text-xs ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-lg p-2">
                      <Loader2 size={14} className="animate-spin text-blue-400" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t border-white/10 flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none resize-none"
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="px-3 rounded-lg bg-blue-500 text-white disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Chat - Desktop */}
        <div className="hidden md:block fixed bottom-6 right-6 z-50">
          {isChatMinimized ? (
            <AIChatButton onClick={() => setIsChatMinimized(false)} isOpen={!isChatMinimized} />
          ) : (
            <div className="w-80 bg-[#0D1A2D] border border-white/20 rounded-xl shadow-2xl">
              <div className="p-3 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-blue-400" />
                  <span className="text-sm font-medium text-white">AI Assistant</span>
                </div>
                <button onClick={() => setIsChatMinimized(true)} className="p-1 hover:bg-white/10 rounded">
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
              <div className="h-96 overflow-y-auto p-3 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-lg p-2">
                      <Loader2 size={14} className="animate-spin text-blue-400" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t border-white/10 flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="px-3 rounded-lg bg-blue-500 text-white disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}