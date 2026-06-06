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
  Star, Zap, Flame, Medal, LineChart, PieChart,
  Bot, Send, X, HelpCircle, Hexagon, MessageCircle,
  DollarSign, Globe, Database, Shield, Cpu, Cloud,
  Minimize, Copy, Check
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart as ReLineChart, Line, Area, AreaChart, PieChart as RePieChart, Pie, Cell
} from 'recharts';

// ─── Star Background ──────────────────────────────────────────────────────────
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

// ─── Skeleton Screen ──────────────────────────────────────────────────────────
const DashboardSkeleton = () => (
  <div className="pt-20 px-4 md:px-6 pb-6 animate-pulse">
    {/* Stat Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 h-28">
          <div className="h-8 w-8 bg-white/10 rounded-lg mb-4" />
          <div className="h-7 w-16 bg-white/10 rounded mb-2" />
          <div className="h-3 w-24 bg-white/5 rounded" />
        </div>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 h-80">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-5 w-5 bg-white/10 rounded" />
            <div className="h-5 w-40 bg-white/10 rounded" />
          </div>
          <div className="h-56 w-full bg-white/5 rounded-xl" />
        </div>
      ))}
    </div>

    {/* Hex Grid */}
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-5 w-5 bg-white/10 rounded" />
        <div className="h-5 w-48 bg-white/10 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl" />
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ isOpen, onClose }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const navItems = [
    { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/quizzes', label: 'Quizzes', icon: BookOpen },
    { href: '/student/gaps', label: 'Knowledge Gaps', icon: Target },
    { href: '/student/recommendations', label: 'Recommendations', icon: Sparkles },
    { href: '/student/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628] backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500/20 p-2 rounded-xl">
                <Code className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-xl font-bold text-white">PACT</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Student Portal</p>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Student'}</p>
                <p className="text-xs text-gray-500 capitalize truncate">{role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-blue-500/30 transition-all duration-300">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg bg-${color}-500/20`}>
        <Icon size={18} className={`text-${color}-400`} />
      </div>
    </div>
    <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
    <p className="text-xs text-gray-400 mt-1">{title}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

// ─── Hexagonal Grid ───────────────────────────────────────────────────────────
const CustomHexagon = ({ mastery, label, questions }) => {
  const getColor = (m) => {
    if (m >= 80) return '#10B981';
    if (m >= 60) return '#3B82F6';
    if (m >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const pct = mastery != null ? Math.round(mastery) : 0;

  return (
    <div className="flex flex-col items-center text-center group">
      <div
        className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
        style={{
          background: mastery > 0
            ? `linear-gradient(135deg, ${getColor(mastery)}20, ${getColor(mastery)}40)`
            : '#1E293B',
          border: `2px solid ${mastery > 0 ? getColor(mastery) : '#475569'}`,
          boxShadow: mastery > 0 ? `0 0 20px ${getColor(mastery)}40` : 'none',
        }}
      >
        {mastery > 0 ? (
          <span className="text-base sm:text-lg md:text-xl font-bold" style={{ color: getColor(mastery) }}>
            {pct}%
          </span>
        ) : (
          <HelpCircle size={20} className="text-gray-600" />
        )}
      </div>
      <p className="text-xs md:text-sm text-gray-400 mt-2 capitalize group-hover:text-white transition max-w-[70px] sm:max-w-[80px] truncate">
        {label?.replace(/_/g, ' ').substring(0, 10) || 'Not Started'}
      </p>
      {questions > 0 && <p className="text-xs text-gray-500">{questions} Qs</p>}
    </div>
  );
};

const HexagonalGrid = ({ concepts }) => {
  const top = [...concepts].sort((a, b) => b.mastery - a.mastery).slice(0, 6);
  while (top.length < 6) top.push({ concept: 'pending', mastery: 0, totalQuestions: 0 });

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      {top.map((c, idx) => (
        <CustomHexagon key={idx} mastery={c.mastery} label={c.concept} questions={c.totalQuestions} />
      ))}
    </div>
  );
};

// ─── AI Assistant ─────────────────────────────────────────────────────────────
// Helper component to format AI message with code blocks, bold, and proper spacing
const FormattedAIContent = ({ content }) => {
  // Parse code blocks first (```code```)
  const parts = [];
  let lastIndex = 0;
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textPart = content.slice(lastIndex, match.index);
      parts.push(<TextPart key={`text-${lastIndex}`} content={textPart} />);
    }
    // Add code block
    const language = match[1] || 'code';
    const code = match[2].trim();
    parts.push(<CodeBlock key={`code-${match.index}`} code={code} language={language} />);
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    const textPart = content.slice(lastIndex);
    parts.push(<TextPart key={`text-${lastIndex}`} content={textPart} />);
  }
  
  return <div className="space-y-2">{parts}</div>;
};

const TextPart = ({ content }) => {
  // Convert bullet points and numbered lists
  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    if (line.trim().startsWith('• ')) {
      return `<div class="flex items-start gap-2 my-1"><span class="text-blue-400 flex-shrink-0">•</span><span>${line.trim().substring(2)}</span></div>`;
    }
    if (/^\d+\.\s/.test(line.trim())) {
      const matchNum = line.trim().match(/^(\d+)\.\s(.*)/);
      if (matchNum) {
        return `<div class="flex items-start gap-2 my-1"><span class="text-blue-400 font-medium flex-shrink-0">${matchNum[1]}.</span><span>${matchNum[2]}</span></div>`;
      }
    }
    if (line.trim() === '') return '<div class="h-2"></div>';
    return `<div>${line}</div>`;
  }).join('');
  
  // Apply bold formatting
  const withBold = processedLines.replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-300 font-semibold">$1</strong>');
  
  return <div className="text-gray-200 leading-relaxed space-y-1 text-xs sm:text-sm" dangerouslySetInnerHTML={{ __html: withBold }} />;
};

const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative my-3 rounded-lg overflow-hidden bg-[#1E2A3A] border border-white/20">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0F172A] border-b border-white/10">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition px-2 py-0.5 rounded hover:bg-white/10"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs sm:text-sm font-mono text-gray-300">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const AIAssistantSection = ({ messages, input, setInput, sendMessage, isLoading, messagesEndRef, handleKeyPress }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-blue-500 rounded-full p-3 shadow-lg hover:bg-blue-600 transition-all duration-300 hover:scale-105"
      >
        <Bot size={20} className="text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-[#0D1A2D] border border-white/20 rounded-xl shadow-2xl">
      <div className="p-3 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-blue-400" />
          <span className="text-sm font-medium text-white">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/10 rounded transition">
            <Minimize size={14} className="text-gray-400" />
          </button>
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/10 rounded transition">
            <X size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="h-80 sm:h-96 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">Ask me about your performance, gaps, or get learning tips!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${
                  msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <FormattedAIContent content={msg.content} />
                ) : (
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                )}
                <span className="text-[10px] sm:text-xs opacity-70 mt-1 sm:mt-2 block">{msg.timestamp}</span>
              </div>
            </div>
          ))
        )}
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
          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
          rows={1}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="px-3 rounded-lg bg-blue-500 text-white disabled:opacity-50 hover:bg-blue-600 transition"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── Charts ───────────────────────────────────────────────────────────────────
const PerformanceChart = ({ data }) => {
  const chartData = data.map(item => ({
    name: item.concept?.replace(/_/g, ' ').substring(0, 8),
    mastery: Math.round(item.mastery),
    questions: item.totalQuestions,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tick={{ fontSize: 10 }} />
        <YAxis stroke="#9CA3AF" fontSize={10} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #ffffff20', borderRadius: '8px', fontSize: '12px' }}
          labelStyle={{ color: '#FFFFFF' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar dataKey="mastery" fill="#3B82F6" name="Mastery (%)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="questions" fill="#10B981" name="Questions" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const ProgressAreaChart = ({ concepts }) => {
  const data = [...concepts]
    .sort((a, b) => a.mastery - b.mastery)
    .map(item => ({
      name: item.concept?.replace(/_/g, ' ').substring(0, 8),
      mastery: Math.round(item.mastery),
    }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tick={{ fontSize: 10 }} />
        <YAxis stroke="#9CA3AF" fontSize={10} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #ffffff20', borderRadius: '8px', fontSize: '12px' }}
          labelStyle={{ color: '#FFFFFF' }}
        />
        <Area type="monotone" dataKey="mastery" stroke="#3B82F6" fill="#3B82F640" name="Mastery (%)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

// ─── Default export ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // dataReady gates the real content; keeps skeleton visible until fetch completes
  const [dataReady, setDataReady] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    performance: {
      totalQuizzes: 0,
      completedQuizzes: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      overallMastery: 0,
      currentStreak: 0,
      longestStreak: 0,
    },
    conceptMastery: [],
    primaryGaps: [],
    secondaryGaps: [],
    totalGaps: 0,
  });

  // AI Chat State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.id) {
      fetchDashboardData();
    }
  }, [status, session?.user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Data Fetching ───────────────────────────────────────────────────────────
  const fetchDashboardData = async () => {
    try {
      const studentId = session.user.id;

      const gapsRes = await fetch(`/api/student/gaps?studentId=${studentId}`);
      const gapsData = await gapsRes.json();

      let conceptData = { concepts: [] };
      try {
        const conceptRes = await fetch(`/api/student/concept-performance?studentId=${studentId}`);
        conceptData = await conceptRes.json();
      } catch { /* endpoint not ready */ }

      let perfData = {};
      try {
        const perfRes = await fetch(`/api/student/student-performance?studentId=${studentId}`);
        perfData = await perfRes.json();
      } catch { /* endpoint not ready */ }

      let sessionsData = { sessions: [] };
      try {
        const sessionsRes = await fetch(`/api/student/sessions?studentId=${studentId}`);
        sessionsData = await sessionsRes.json();
      } catch { /* endpoint not ready */ }

      const completedQuizzesFromSessions =
        sessionsData.sessions?.filter((s) => s.status === 'completed').length || 0;

      let conceptMastery = [];
      if (conceptData.concepts?.length > 0) {
        conceptMastery = conceptData.concepts.map((c) => ({
          concept: c.concept,
          mastery: parseFloat(c.mastery_score) || 0,
          totalQuestions: c.total_questions || 0,
          correctAnswers: c.correct_answers || 0,
        }));
      } else if (gapsData.primary_gaps?.length > 0) {
        const allGaps = [...gapsData.primary_gaps, ...(gapsData.secondary_gaps || [])];
        const map = new Map();
        allGaps.forEach((gap) => {
          if (!map.has(gap.concept)) {
            map.set(gap.concept, { concept: gap.concept, mastery: gap.mastery, totalQuestions: 0 });
          }
        });
        conceptMastery = Array.from(map.values());
      }

      const totalGaps = (gapsData.primary_gaps?.length || 0) + (gapsData.secondary_gaps?.length || 0);

      const overallMastery =
        conceptMastery.length > 0
          ? Math.round(conceptMastery.reduce((s, c) => s + c.mastery, 0) / conceptMastery.length)
          : gapsData.overall_mastery || 0;

      const accuracy =
        perfData.average_score ||
        (perfData.total_correct_answers && perfData.total_questions_answered
          ? Math.round((perfData.total_correct_answers / perfData.total_questions_answered) * 100)
          : 0);

      const finalCompletedQuizzes = completedQuizzesFromSessions || perfData.completed_quizzes || 0;

      setDashboardData({
        performance: {
          totalQuizzes: perfData.total_quizzes || sessionsData.sessions?.length || 0,
          completedQuizzes: finalCompletedQuizzes,
          totalQuestions: perfData.total_questions_answered || 0,
          correctAnswers: perfData.total_correct_answers || 0,
          accuracy,
          overallMastery,
          currentStreak: perfData.current_streak || 0,
          longestStreak: perfData.longest_streak || 0,
        },
        conceptMastery,
        primaryGaps: gapsData.primary_gaps || [],
        secondaryGaps: gapsData.secondary_gaps || [],
        totalGaps,
      });

      if (messages.length === 0) {
        const greeting = getGreeting();
        const studentName = session?.user?.name?.split(' ')[0] || 'Student';
        const gapCount = gapsData.primary_gaps?.length || 0;

        let personalizedMessage = `${greeting}, ${studentName}! I'm your AI learning assistant.\n\n`;
        if (overallMastery > 0) {
          personalizedMessage += `**Your Learning Summary:**\n\n`;
          personalizedMessage += `• Overall Mastery: ${overallMastery}%\n`;
          personalizedMessage += `• Quizzes Completed: ${finalCompletedQuizzes}\n`;
          personalizedMessage += `• Accuracy: ${accuracy}%\n`;
          personalizedMessage += `• Identified Gaps: ${totalGaps} areas to improve\n\n`;
          if (gapCount > 0) {
            personalizedMessage += `**Focus on:** ${gapsData.primary_gaps
              .slice(0, 2)
              .map((g) => g.concept?.replace(/_/g, ' '))
              .join(', ')}\n\n`;
          }
          personalizedMessage += `How can I help you today?`;
        } else {
          personalizedMessage += `Welcome to PACT! Start by taking a quiz to unlock your personalized analytics.`;
        }

        setMessages([
          {
            id: 1,
            role: 'assistant',
            content: personalizedMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setDataReady(true);
    }
  };

  // ── AI Chat ─────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMessage]);
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
            primaryGaps: dashboardData.primaryGaps,
            conceptMastery: dashboardData.conceptMastery,
          },
        }),
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: 'assistant',
          content: data.reply || "I'm here to help with your learning journey. What would you like to know?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: 'assistant',
          content: "I'm here to help! Ask me about your performance, concepts, or for study recommendations.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
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

  // ── Auth / loading gates ────────────────────────────────────────────────────
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const greeting = getGreeting();
  const studentName = session?.user?.name?.split(' ')[0] || 'Student';
  const { performance, conceptMastery, primaryGaps, totalGaps } = dashboardData;
  const hasData = conceptMastery.length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:ml-64">
        {/* Fixed Header with Welcome */}
        <div className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
            >
              <Menu size={20} className="text-white" />
            </button>
            
            {/* Welcome Section in Header */}
            <div className="flex-1 ml-2 md:ml-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">
                {greeting}, {studentName}!
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                {hasData
                  ? `Overall mastery: ${performance.overallMastery}% across ${conceptMastery.length} concepts`
                  : 'Start your first quiz to unlock insights'}
              </p>
            </div>

            {/* Notification Bell Only (User removed from header) */}
            <button className="p-2 rounded-lg hover:bg-white/10 transition relative">
              <Bell size={18} className="text-gray-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!dataReady ? (
          <DashboardSkeleton />
        ) : (
          <div className="pt-16 sm:pt-20 px-3 sm:px-4 md:px-6 pb-6">
            {/* Stats Grid - Responsive */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
              <StatCard title="Overall Mastery" value={`${performance.overallMastery}%`} icon={Brain} color="blue" />
              <StatCard
                title="Identified Gaps"
                value={totalGaps}
                subtitle={`${primaryGaps.length} high priority`}
                icon={Target}
                color="red"
              />
              <StatCard
                title="Quizzes Completed"
                value={performance.completedQuizzes}
                subtitle={`${performance.totalQuizzes} total`}
                icon={BookOpen}
                color="green"
              />
              <StatCard
                title="Longest Streak"
                value={performance.longestStreak}
                subtitle="Days in a row"
                icon={Flame}
                color="orange"
              />
            </div>

            {/* Charts - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Bar Chart */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-400" />
                    <h3 className="font-semibold text-white text-sm sm:text-base">Concept Performance</h3>
                  </div>
                  <span className="text-xs text-gray-500">Mastery by Concept</span>
                </div>
                {hasData ? (
                  <div className="overflow-x-auto">
                    <PerformanceChart data={conceptMastery} />
                  </div>
                ) : (
                  <div className="h-[250px] sm:h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 size={40} className="mx-auto text-gray-600 mb-3" />
                      <p className="text-sm text-gray-500">No data available yet</p>
                      <p className="text-xs text-gray-600 mt-1">Complete quizzes to see your performance</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Area Chart */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <LineChart size={16} className="text-green-400" />
                    <h3 className="font-semibold text-white text-sm sm:text-base">Mastery Distribution</h3>
                  </div>
                  <span className="text-xs text-gray-500">Sorted by mastery</span>
                </div>
                {hasData ? (
                  <ProgressAreaChart concepts={conceptMastery} />
                ) : (
                  <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
                    <div className="text-center">
                      <LineChart size={40} className="mx-auto text-gray-600 mb-3" />
                      <p className="text-sm text-gray-500">No data available yet</p>
                      <p className="text-xs text-gray-600 mt-1">Start learning to see your progress</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hexagonal Grid */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4 mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Hexagon size={16} className="text-purple-400" />
                  <h3 className="font-semibold text-white text-sm sm:text-base">Concept Mastery Hexagon</h3>
                </div>
                <span className="text-xs text-gray-500">Top 6 concepts by mastery</span>
              </div>
              {hasData ? (
                <HexagonalGrid concepts={conceptMastery} />
              ) : (
                <div className="py-8 sm:py-12 text-center">
                  <Hexagon size={40} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500">No concept data available</p>
                  <p className="text-xs text-gray-600 mt-1">Take quizzes to build your mastery profile</p>
                </div>
              )}
            </div>

            {/* Knowledge Gaps */}
            {primaryGaps.length > 0 && (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-red-400 mb-2">Priority Knowledge Gaps</p>
                    <div className="flex flex-wrap gap-2">
                      {primaryGaps.slice(0, 4).map((gap, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs">
                          {gap.concept?.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                    <Link href="/student/gaps">
                      <button className="mt-3 text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1">
                        View all gaps <ChevronRight size={12} />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Assistant */}
      <AIAssistantSection
        messages={messages}
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        isLoading={isLoading}
        messagesEndRef={messagesEndRef}
        handleKeyPress={handleKeyPress}
      />
    </div>
  );
}