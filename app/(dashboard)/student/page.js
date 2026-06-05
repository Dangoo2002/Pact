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
  HelpCircle, Database
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
            <div className="bg-blue-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
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
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 rounded-xl bg-${color}-500/20`}>
        <Icon size={22} className={`text-${color}-400`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'} bg-white/5 px-2 py-1 rounded-full`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="text-sm text-gray-400 mt-1">{title}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
  </div>
);

// Format code in AI response
const formatAIResponse = (content) => {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let formattedContent = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      formattedContent.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
        key: key++
      });
    }
    formattedContent.push({
      type: 'code',
      language: match[1] || 'javascript',
      content: match[2].trim(),
      key: key++
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    formattedContent.push({
      type: 'text',
      content: content.slice(lastIndex),
      key: key++
    });
  }

  return formattedContent;
};

// Code Block Component with Copy Button
const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-2 rounded-lg overflow-hidden bg-black/50 border border-white/10">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
        <span className="text-xs text-gray-400">{language || 'code'}</span>
        <button onClick={handleCopy} className="p-1 hover:bg-white/10 rounded transition">
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-400" />}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{code}</code>
      </pre>
    </div>
  );
};

// Get time-based greeting
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
    totalResponses: 0,
    correctResponses: 0,
    accuracy: 0,
    totalQuizzes: 0,
    completedQuizzes: 0,
    conceptsMastered: 0,
    weakConcepts: [],
    recentActivity: [],
    conceptBreakdown: []
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
      const studentId = session.user.id;
      
      // Fetch responses directly from your API
      const responsesRes = await fetch(`/api/student/responses?studentId=${studentId}`);
      const responsesData = await responsesRes.json();
      const responses = responsesData.responses || [];
      
      // Calculate stats from responses
      const totalResponses = responses.length;
      const correctResponses = responses.filter(r => r.is_correct === true).length;
      const accuracy = totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0;
      
      // Get concept breakdown
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
      
      const conceptBreakdown = Array.from(conceptMap.entries()).map(([concept, stats]) => ({
        concept,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        totalQuestions: stats.total,
        correctAnswers: stats.correct
      })).sort((a, b) => a.accuracy - b.accuracy);
      
      // Identify weak concepts (accuracy < 50%)
      const weakConcepts = conceptBreakdown.filter(c => c.accuracy < 50);
      
      // Concepts mastered (accuracy >= 80%)
      const conceptsMastered = conceptBreakdown.filter(c => c.accuracy >= 80).length;
      
      // Fetch quiz sessions
      const sessionsRes = await fetch(`/api/student/sessions?studentId=${studentId}`);
      const sessionsData = await sessionsRes.json();
      const sessions = sessionsData.sessions || [];
      const totalQuizzes = sessions.length;
      const completedQuizzes = sessions.filter(s => s.status === 'completed').length;
      
      // Recent activity (last 5 responses)
      const recentActivity = responses.slice(0, 5).map(r => ({
        concept: r.concept,
        isCorrect: r.is_correct,
        timestamp: r.timestamp,
        question: r.question_text ? r.question_text.substring(0, 60) + '...' : 'Quiz question'
      }));
      
      setDashboardData({
        totalResponses,
        correctResponses,
        accuracy,
        totalQuizzes,
        completedQuizzes,
        conceptsMastered,
        weakConcepts,
        recentActivity,
        conceptBreakdown
      });
      
      // Add AI welcome message with actual student data
      const greeting = getGreeting();
      const studentName = session?.user?.name?.split(' ')[0] || 'Student';
      setMessages([
        { 
          id: 1,
          role: 'assistant', 
          content: `${greeting}, ${studentName}! 👋 I'm your AI learning assistant.\n\n**Your Learning Summary:**\n• You've answered ${totalResponses} questions\n• Your accuracy is ${accuracy}%\n• You've completed ${completedQuizzes} quizzes\n• You have ${weakConcepts.length} concepts to improve\n\nHow can I help you today? You can ask me about:\n• Specific programming concepts\n• Your knowledge gaps\n• Recommended learning resources\n• Study strategies`,
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
            accuracy: dashboardData.accuracy,
            totalResponses: dashboardData.totalResponses,
            weakConcepts: dashboardData.weakConcepts,
            conceptBreakdown: dashboardData.conceptBreakdown
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

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'green';
    if (accuracy >= 60) return 'yellow';
    return 'blue';
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

  const greeting = getGreeting();
  const studentName = session?.user?.name?.split(' ')[0] || 'Student';
  const { totalResponses, correctResponses, accuracy, totalQuizzes, completedQuizzes, conceptsMastered, weakConcepts, recentActivity, conceptBreakdown } = dashboardData;

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
            {/* Welcome Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">{greeting}, {studentName}! 👋</h2>
              <p className="text-gray-400 mt-1 text-sm">
                {totalResponses === 0 
                  ? "Ready to start your learning journey? Take your first quiz today!" 
                  : `You've answered ${totalResponses} questions with ${accuracy}% accuracy. Keep going!`}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/20">
                    <BookOpen size={22} className="text-blue-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{completedQuizzes}</p>
                <p className="text-sm text-gray-400 mt-1">Quizzes Completed</p>
                <p className="text-xs text-gray-500 mt-2">{totalQuizzes} total attempts</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-green-500/20">
                    <TrendingUp size={22} className="text-green-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{accuracy}%</p>
                <p className="text-sm text-gray-400 mt-1">Average Accuracy</p>
                <p className="text-xs text-gray-500 mt-2">{correctResponses}/{totalResponses} correct answers</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20">
                    <Brain size={22} className="text-purple-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{conceptsMastered}</p>
                <p className="text-sm text-gray-400 mt-1">Concepts Mastered</p>
                <p className="text-xs text-gray-500 mt-2">{weakConcepts.length} need improvement</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/20">
                    <Flame size={22} className="text-orange-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{totalResponses}</p>
                <p className="text-sm text-gray-400 mt-1">Questions Answered</p>
                <p className="text-xs text-gray-500 mt-2">Keep practicing!</p>
              </div>
            </div>

            {/* Concept Breakdown Section */}
            {conceptBreakdown.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/20">
                      <BarChart3 size={18} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Concept Performance</h3>
                  </div>
                  <Link href="/student/gaps">
                    <button className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
                      View Details <ChevronRight size={14} />
                    </button>
                  </Link>
                </div>
                <div className="space-y-4">
                  {conceptBreakdown.slice(0, 5).map((concept, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300 capitalize">{concept.concept?.replace(/_/g, ' ')}</span>
                        <span className={getScoreColor(concept.accuracy)}>{concept.accuracy}%</span>
                      </div>
                      <ProgressBar value={concept.accuracy} color={getAccuracyColor(concept.accuracy)} />
                      <p className="text-xs text-gray-500 mt-1.5">{concept.totalQuestions} questions • {concept.correctAnswers} correct</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weak Concepts Alert */}
            {weakConcepts.length > 0 && (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-2xl p-5 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <AlertCircle size={18} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-400 mb-1">Areas Needing Improvement</p>
                    <p className="text-sm text-gray-300">
                      You're struggling with: {weakConcepts.map(c => c.concept?.replace(/_/g, ' ')).join(', ')}. 
                      Focus on these concepts to improve your overall score.
                    </p>
                    <Link href="/student/gaps">
                      <button className="mt-3 text-sm text-red-400 hover:text-red-300 transition flex items-center gap-1">
                        View detailed gap analysis <ChevronRight size={14} />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-blue-500/20">
                    <Activity size={18} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 pb-3 border-b border-white/10 last:border-0">
                      <div className={`p-1.5 rounded-lg ${activity.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {activity.isCorrect ? <CheckCircle size={14} className="text-green-400" /> : <AlertCircle size={14} className="text-red-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white capitalize">{activity.concept?.replace(/_/g, ' ') || 'Quiz'}</p>
                        <p className="text-xs text-gray-500">{activity.question}</p>
                        <p className="text-xs text-gray-600 mt-1">{new Date(activity.timestamp).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs ${activity.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {activity.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - AI Assistant (45%) */}
          <div className="w-full lg:w-[45%] flex flex-col bg-[#0D1A2D]/50 backdrop-blur-sm">
            {/* Panel Header */}
            <div className="p-4 border-b border-white/10 bg-blue-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500 shadow-lg shadow-blue-500/20">
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
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3 flex-shrink-0 shadow-lg shadow-blue-500/20">
                          <Bot size={16} className="text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                        <div className={`p-3 rounded-2xl ${
                          msg.role === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white/10 border border-white/20 text-gray-200'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                              {formatAIResponse(msg.content).map((block) => (
                                block.type === 'code' ? (
                                  <CodeBlock key={block.key} language={block.language} code={block.content} />
                                ) : (
                                  <p key={block.key} className="mb-2">{block.content}</p>
                                )
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          )}
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
                      className="px-4 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
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
                  className="text-center group"
                >
                  <div className="p-4 rounded-full bg-blue-500/20 mx-auto mb-3 group-hover:bg-blue-500/30 transition">
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