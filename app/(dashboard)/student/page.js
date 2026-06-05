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
  HelpCircle, Database, PieChart, Hexagon, CircleDot
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
      overallMastery: 0
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
      
      const gapsRes = await fetch(`/api/student/gaps?studentId=${studentId}`);
      const gapsData = await gapsRes.json();
      
      const responsesRes = await fetch(`/api/student/responses?studentId=${studentId}`);
      const responsesData = await responsesRes.json();
      const responses = responsesData.responses || [];
      
      const totalQuestions = responses.length;
      const correctAnswers = responses.filter(r => r.is_correct === true).length;
      const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      const sessionsRes = await fetch(`/api/student/sessions?studentId=${studentId}`);
      const sessionsData = await sessionsRes.json();
      const sessions = sessionsData.sessions || [];
      const completedQuizzes = sessions.filter(s => s.status === 'completed').length;
      
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
        mastery: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        totalQuestions: stats.total,
        correctAnswers: stats.correct
      }));
      
      const overallMastery = conceptMastery.length > 0 
        ? Math.round(conceptMastery.reduce((sum, c) => sum + c.mastery, 0) / conceptMastery.length)
        : 0;
      
      setDashboardData({
        performance: {
          totalQuizzes: sessions.length,
          completedQuizzes,
          totalQuestions,
          correctAnswers,
          accuracy,
          overallMastery
        },
        conceptMastery,
        primaryGaps: gapsData.primary_gaps || [],
        secondaryGaps: gapsData.secondary_gaps || []
      });
      
      const greeting = getGreeting();
      const studentName = session?.user?.name?.split(' ')[0] || 'Student';
      
      setMessages([
        { 
          id: 1,
          role: 'assistant', 
          content: `${greeting}, ${studentName}! I'm your AI learning assistant.\n\n**Your Learning Summary:**\n• You've completed ${completedQuizzes} quizzes\n• Your overall accuracy is ${accuracy}%\n• You have ${gapsData.primary_gaps?.length || 0} knowledge gaps\n\nHow can I help you today?`,
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
        {/* Static Header - Always visible */}
        <div className="sticky top-0 z-30 bg-[#0A1628]/90 backdrop-blur-xl border-b border-white/10">
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

        <div className="p-4 md:p-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white">{greeting}, {studentName}!</h2>
            <p className="text-sm text-gray-400 mt-1">
              {performance.completedQuizzes === 0 
                ? "Start your first quiz to begin your learning journey" 
                : `You've completed ${performance.completedQuizzes} quizzes with ${performance.accuracy}% accuracy.`}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
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
              icon={Brain}
            />
            <StatCard 
              title="Questions"
              value={performance.totalQuestions}
              icon={Activity}
            />
          </div>

          {/* Concept Performance */}
          {conceptMastery.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-400" />
                  <h3 className="font-semibold text-white text-sm md:text-base">Concept Performance</h3>
                </div>
                <Link href="/student/gaps">
                  <button className="text-xs text-blue-400 hover:text-blue-300 transition">View All</button>
                </Link>
              </div>
              <RankedConceptList concepts={conceptMastery.slice(0, 5)} />
            </div>
          )}

          {/* High Priority Gaps */}
          {primaryGaps.length > 0 && (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400 mb-1">High Priority Gaps</p>
                  <p className="text-sm text-gray-300">
                    Focus on: {primaryGaps.slice(0, 3).map(g => g.concept?.replace(/_/g, ' ')).join(', ')}
                  </p>
                  <Link href="/student/gaps">
                    <button className="mt-2 text-xs text-red-400 hover:text-red-300 transition">View Details</button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Chat - Mobile: Fixed bottom button, expands to modal-like panel */}
        <div className="fixed bottom-4 right-4 z-50 md:hidden">
          {isChatMinimized ? (
            <button
              onClick={() => setIsChatMinimized(false)}
              className="bg-blue-500 rounded-full p-3 shadow-lg"
            >
              <Bot size={24} className="text-white" />
            </button>
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

        {/* AI Chat - Desktop: Side panel */}
        <div className="hidden md:block fixed bottom-6 right-6 z-50">
          {isChatMinimized ? (
            <button
              onClick={() => setIsChatMinimized(false)}
              className="bg-blue-500 rounded-full p-3 shadow-lg"
            >
              <Bot size={24} className="text-white" />
            </button>
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