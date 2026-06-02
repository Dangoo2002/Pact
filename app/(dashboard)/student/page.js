// app/student/page.js
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, TrendingUp, Award, Clock, 
  Brain, Target, Zap, ChevronRight, Star, 
  Calendar, Flame, BarChart3, MessageSquare,
  Sparkles, Loader2, Send, RefreshCw, Menu, X,
  LogOut, Bell, User, GraduationCap,
  LayoutDashboard, BookOpen
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
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
                <Icon size={18} /><span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><User className="h-4 w-4 text-blue-400" /></div>
            <div className="flex-1"><p className="text-sm font-medium text-white">{session?.user?.name || 'Student'}</p><p className="text-xs text-gray-500 capitalize">{role}</p></div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"><LogOut size={16} />Sign Out</button>
        </div>
      </div>
    </>
  );
};

// Chat Message Component
const ChatMessage = ({ message, isUser, timestamp }) => {
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-blue-500/20' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}>
        {isUser ? <User size={14} className="text-blue-400" /> : <Sparkles size={14} className="text-white" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 border border-white/10'} rounded-xl p-3`}>
        <p className="text-sm text-gray-200">{message}</p>
        <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
      </div>
    </div>
  );
};

const SuggestedQuestions = ({ onSelect }) => {
  const suggestions = [
    "Explain loops in Python with examples",
    "What's the difference between lists and tuples?",
    "How does recursion work in programming?",
  ];
  return (
    <div className="mt-4">
      <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, idx) => (
          <button key={idx} onClick={() => onSelect(suggestion)} className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/30 transition">
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    overallMastery: 0,
    activeGaps: 0,
    streak: 0,
    totalPoints: 0,
    masteryData: [],
    progressData: [],
    ongoingCourses: [],
    recommendations: []
  });
  
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your AI Learning Assistant. Ask me anything about programming!", isUser: false, timestamp: new Date().toLocaleTimeString() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/student/dashboard?studentId=${session.user.id}`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      isUser: true,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage, studentId: session?.user?.id })
      });
      const data = await response.json();
      
      const aiMessage = {
        id: messages.length + 2,
        text: data.response || "I'm here to help with programming concepts!",
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        text: "I'm having trouble connecting. Please try again.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
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
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Welcome back, {session?.user?.name?.split(' ')[0] || 'Student'}</h1>
            <p className="text-sm text-gray-400 mt-1">Track your progress and continue learning</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/20"><Brain className="h-4 w-4 md:h-5 md:w-5 text-blue-400" /></div><div><p className="text-xl md:text-2xl font-bold text-white">{dashboardData.overallMastery}%</p><p className="text-xs text-gray-500">Overall Mastery</p></div></div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-yellow-500/20"><Target className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" /></div><div><p className="text-xl md:text-2xl font-bold text-white">{dashboardData.activeGaps}</p><p className="text-xs text-gray-500">Active Gaps</p></div></div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-orange-500/20"><Flame className="h-4 w-4 md:h-5 md:w-5 text-orange-400" /></div><div><p className="text-xl md:text-2xl font-bold text-white">{dashboardData.streak}</p><p className="text-xs text-gray-500">Day Streak</p></div></div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/20"><Award className="h-4 w-4 md:h-5 md:w-5 text-green-400" /></div><div><p className="text-xl md:text-2xl font-bold text-white">{dashboardData.totalPoints}</p><p className="text-xs text-gray-500">Total Points</p></div></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-5">
                <div className="flex justify-between items-center mb-4"><h2 className="text-base md:text-lg font-semibold text-white">Concept Mastery</h2><Link href="/student/gaps" className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1">View Details <ChevronRight size={12} /></Link></div>
                <div className="h-64 md:h-80"><ResponsiveContainer width="100%" height="100%"><RadarChart data={dashboardData.masteryData}><PolarGrid stroke="#1e293b" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} /><Radar name="Mastery" dataKey="mastery" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} /><Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} /></RadarChart></ResponsiveContainer></div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-5"><h2 className="text-base md:text-lg font-semibold text-white mb-4">Learning Progress</h2><div className="h-64 md:h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={dashboardData.progressData}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" /><XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} /><Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} /></LineChart></ResponsiveContainer></div></div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl flex flex-col h-[600px]">
              <div className="p-4 border-b border-white/10"><div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500"><Sparkles className="h-4 w-4 text-white" /></div><div><h2 className="font-semibold text-white">AI Learning Assistant</h2><p className="text-xs text-gray-500">Powered by DeepSeek-V3</p></div></div></div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">{messages.map((msg) => (<ChatMessage key={msg.id} message={msg.text} isUser={msg.isUser} timestamp={msg.timestamp} />))}{isTyping && (<div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"><Sparkles size={14} className="text-white" /></div><div className="bg-white/5 border border-white/10 rounded-xl p-3"><div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} /><div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} /><div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} /></div></div></div>)}<div ref={messagesEndRef} /></div>
              <SuggestedQuestions onSelect={(s) => setInputMessage(s)} />
              <div className="p-4 border-t border-white/10"><div className="flex gap-2"><textarea value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask me anything about programming..." className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none" rows={2} /><button onClick={sendMessage} disabled={isTyping || !inputMessage.trim()} className="px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition disabled:opacity-50 self-end">{isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}</button></div></div>
            </div>
          </div>

          <div className="mb-6"><div className="flex justify-between items-center mb-3"><h2 className="text-base md:text-lg font-semibold text-white">Recommended for You</h2><Link href="/student/recommendations" className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1">View All <ChevronRight size={12} /></Link></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{dashboardData.recommendations.slice(0, 3).map((rec, idx) => (<div key={idx} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:border-blue-500/30 transition"><div className="flex justify-between items-start mb-2"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{rec.type}</span><span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">{rec.match}% match</span></div><h3 className="font-semibold text-sm text-white mb-2">{rec.title}</h3><button className="text-xs text-blue-400 hover:text-blue-300 transition">View →</button></div>))}</div></div>
        </div>
      </div>
    </div>
  );
}