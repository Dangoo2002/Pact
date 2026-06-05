'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Code, TrendingUp, Award, Clock, Target, BookOpen, 
  User, LogOut, Bell, Sparkles, ChevronRight,
  LayoutDashboard, BarChart3, CheckCircle, AlertCircle,
  TrendingDown, Calendar, Activity, Brain, Loader2,
  Star, Zap, Flame, Medal, LineChart, PieChart,
  Bot, Send, X, HelpCircle, Hexagon, MessageCircle,
  DollarSign, Globe, Database, Shield, Cpu, Cloud,
  Minimize
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart as ReLineChart, Line, Area, AreaChart, PieChart as RePieChart, Pie, Cell
} from 'recharts';

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

// Stat Card Component
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

// Custom Hexagonal Graph Component
const CustomHexagon = ({ mastery, label, questions }) => {
  const getColor = (mastery) => {
    if (mastery >= 80) return '#10B981';
    if (mastery >= 60) return '#3B82F6';
    if (mastery >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getPercentage = () => {
    if (mastery === undefined || mastery === null) return 0;
    return Math.round(mastery);
  };

  return (
    <div className="flex flex-col items-center text-center group">
      <div 
        className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer relative"
        style={{ 
          background: mastery > 0 ? `linear-gradient(135deg, ${getColor(mastery)}20, ${getColor(mastery)}40)` : '#1E293B',
          border: `2px solid ${mastery > 0 ? getColor(mastery) : '#475569'}`,
          boxShadow: mastery > 0 ? `0 0 20px ${getColor(mastery)}40` : 'none'
        }}
      >
        {mastery > 0 ? (
          <div className="text-center">
            <span className="text-lg md:text-xl font-bold" style={{ color: getColor(mastery) }}>
              {getPercentage()}%
            </span>
          </div>
        ) : (
          <HelpCircle size={24} className="text-gray-600" />
        )}
      </div>
      <p className="text-xs md:text-sm text-gray-400 mt-2 capitalize group-hover:text-white transition max-w-[80px] truncate">
        {label?.replace(/_/g, ' ').substring(0, 12) || 'Not Started'}
      </p>
      {questions > 0 && (
        <p className="text-xs text-gray-500">{questions} Qs</p>
      )}
    </div>
  );
};

const HexagonalGrid = ({ concepts }) => {
  const topConcepts = [...concepts].sort((a, b) => b.mastery - a.mastery).slice(0, 6);
  
  while (topConcepts.length < 6) {
    topConcepts.push({ concept: 'pending', mastery: 0, totalQuestions: 0 });
  }

  return (
    <div className="grid grid-cols-3 gap-4 md:gap-6">
      {topConcepts.map((concept, idx) => (
        <CustomHexagon 
          key={idx}
          mastery={concept.mastery}
          label={concept.concept}
          questions={concept.totalQuestions}
        />
      ))}
    </div>
  );
};

// AI Assistant Section Component
const AIAssistantSection = ({ messages, input, setInput, sendMessage, isLoading, messagesEndRef, handleKeyPress }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 bg-blue-500 rounded-full p-3 shadow-lg hover:bg-blue-600 transition-all duration-300 hover:scale-105"
      >
        <Bot size={24} className="text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-[#0D1A2D] border border-white/20 rounded-xl shadow-2xl">
      <div className="p-3 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-blue-400" />
          <span className="text-sm font-medium text-white">AI Learning Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/10 rounded">
            <Minimize size={14} className="text-gray-400" />
          </button>
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/10 rounded">
            <X size={14} className="text-gray-400" />
          </button>
        </div>
      </div>
      <div className="h-96 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Ask me about your performance, gaps, or get learning tips!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300'}`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <span className="text-xs opacity-70 mt-1 block">{msg.timestamp}</span>
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
          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
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

// Performance Chart Component
const PerformanceChart = ({ data }) => {
  const chartData = data.map(item => ({
    name: item.concept?.replace(/_/g, ' ').substring(0, 10),
    mastery: Math.round(item.mastery),
    questions: item.totalQuestions
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
        <YAxis stroke="#9CA3AF" fontSize={12} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #ffffff20', borderRadius: '8px' }}
          labelStyle={{ color: '#FFFFFF' }}
        />
        <Legend />
        <Bar dataKey="mastery" fill="#3B82F6" name="Mastery (%)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="questions" fill="#10B981" name="Questions" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Area Chart Component
const ProgressAreaChart = ({ concepts }) => {
  const data = [...concepts]
    .sort((a, b) => a.mastery - b.mastery)
    .map(item => ({
      name: item.concept?.replace(/_/g, ' ').substring(0, 8),
      mastery: Math.round(item.mastery)
    }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
        <YAxis stroke="#9CA3AF" fontSize={12} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #ffffff20', borderRadius: '8px' }}
          labelStyle={{ color: '#FFFFFF' }}
        />
        <Area type="monotone" dataKey="mastery" stroke="#3B82F6" fill="#3B82F640" name="Mastery (%)" />
      </AreaChart>
    </ResponsiveContainer>
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
  
  const [dashboardData, setDashboardData] = useState({
    performance: {
      totalQuizzes: 0,
      completedQuizzes: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      overallMastery: 0,
      currentStreak: 0,
      longestStreak: 0
    },
    conceptMastery: [],
    primaryGaps: [],
    secondaryGaps: [],
    totalGaps: 0
  });
  
  // AI Chat State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    
    if (status === 'authenticated' && session?.user?.id && !dataLoaded) {
      fetchDashboardData();
    }
  }, [session, status, router, dataLoaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDashboardData = async () => {
    try {
      const studentId = session.user.id;
      
      // Fetch gaps data
      const gapsRes = await fetch(`/api/student/gaps?studentId=${studentId}`);
      const gapsData = await gapsRes.json();
      
      // Fetch concept performance from your database
      const conceptRes = await fetch(`/api/student/concept-performance?studentId=${studentId}`);
      let conceptData = { concepts: [] };
      try {
        conceptData = await conceptRes.json();
      } catch (e) {
        console.log('Concept performance endpoint not ready yet');
      }
      
      // Fetch student performance
      const perfRes = await fetch(`/api/student/student-performance?studentId=${studentId}`);
      let perfData = {};
      try {
        perfData = await perfRes.json();
      } catch (e) {
        console.log('Student performance endpoint not ready yet');
      }
      
      // Also fetch completed quizzes directly from quiz_sessions
      const sessionsRes = await fetch(`/api/student/sessions?studentId=${studentId}`);
      let sessionsData = { sessions: [] };
      try {
        sessionsData = await sessionsRes.json();
      } catch (e) {
        console.log('Sessions endpoint not ready yet');
      }
      
      // Count completed quizzes from quiz_sessions
      const completedQuizzesFromSessions = sessionsData.sessions?.filter(s => s.status === 'completed').length || 0;
      
      // Process concept mastery data
      let conceptMastery = [];
      
      // Try to get from concept_performance table first
      if (conceptData.concepts && conceptData.concepts.length > 0) {
        conceptMastery = conceptData.concepts.map(c => ({
          concept: c.concept,
          mastery: parseFloat(c.mastery_score) || 0,
          totalQuestions: c.total_questions || 0,
          correctAnswers: c.correct_answers || 0
        }));
      } 
      // Fallback to gaps data
      else if (gapsData.primary_gaps && gapsData.primary_gaps.length > 0) {
        const allGaps = [...gapsData.primary_gaps, ...gapsData.secondary_gaps];
        const conceptMap = new Map();
        allGaps.forEach(gap => {
          if (!conceptMap.has(gap.concept)) {
            conceptMap.set(gap.concept, {
              concept: gap.concept,
              mastery: gap.mastery,
              totalQuestions: 0
            });
          }
        });
        conceptMastery = Array.from(conceptMap.values());
      }
      
      // Calculate total gaps
      const totalGaps = (gapsData.primary_gaps?.length || 0) + (gapsData.secondary_gaps?.length || 0);
      
      // Calculate overall metrics
      const overallMastery = conceptMastery.length > 0 
        ? Math.round(conceptMastery.reduce((sum, c) => sum + c.mastery, 0) / conceptMastery.length)
        : (gapsData.overall_mastery || 0);
      
      const accuracy = perfData.average_score || 
        (perfData.total_correct_answers && perfData.total_questions_answered 
          ? Math.round((perfData.total_correct_answers / perfData.total_questions_answered) * 100)
          : 0);
      
      // Use the actual completed quizzes count from sessions
      const finalCompletedQuizzes = completedQuizzesFromSessions || perfData.completed_quizzes || 0;
      
      const newDashboardData = {
        performance: {
          totalQuizzes: perfData.total_quizzes || sessionsData.sessions?.length || 0,
          completedQuizzes: finalCompletedQuizzes,
          totalQuestions: perfData.total_questions_answered || 0,
          correctAnswers: perfData.total_correct_answers || 0,
          accuracy: accuracy,
          overallMastery: overallMastery,
          currentStreak: perfData.current_streak || 0,
          longestStreak: perfData.longest_streak || 0
        },
        conceptMastery: conceptMastery,
        primaryGaps: gapsData.primary_gaps || [],
        secondaryGaps: gapsData.secondary_gaps || [],
        totalGaps: totalGaps
      };
      
      setDashboardData(newDashboardData);
      
      // Initialize AI chat with personalized greeting ONLY if messages are empty
      if (messages.length === 0) {
        const greeting = getGreeting();
        const studentName = session?.user?.name?.split(' ')[0] || 'Student';
        const gapCount = gapsData.primary_gaps?.length || 0;
        
        let personalizedMessage = `${greeting}, ${studentName}! I'm your AI learning assistant. `;
        
        if (overallMastery > 0) {
          personalizedMessage += `\n\n**Your Learning Summary:**`;
          personalizedMessage += `\n• Overall Mastery: ${overallMastery}%`;
          personalizedMessage += `\n• Quizzes Completed: ${finalCompletedQuizzes}`;
          personalizedMessage += `\n• Accuracy: ${accuracy}%`;
          personalizedMessage += `\n• Identified Gaps: ${totalGaps} areas to improve`;
          
          if (gapCount > 0) {
            personalizedMessage += `\n\nFocus on: ${gapsData.primary_gaps.slice(0, 2).map(g => g.concept?.replace(/_/g, ' ')).join(', ')}`;
          }
          
          personalizedMessage += `\n\nHow can I help you today? You can ask me about specific concepts, get study tips, or request practice recommendations.`;
        } else {
          personalizedMessage += ` Welcome to PACT! Start by taking a quiz to see your personalized learning analytics. I'll be here to help you every step of the way!`;
        }
        
        setMessages([
          { 
            id: 1,
            role: 'assistant', 
            content: personalizedMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
      
      setDataLoaded(true);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setDataLoaded(true); // Still mark as loaded to avoid infinite loading
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
            primaryGaps: dashboardData.primaryGaps,
            conceptMastery: dashboardData.conceptMastery
          }
        })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { 
        id: prev.length + 1,
        role: 'assistant', 
        content: data.reply || "I'm here to help with your learning journey. What would you like to know?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        id: prev.length + 1,
        role: 'assistant', 
        content: "I'm here to help! You can ask me about your performance, specific concepts, or for study recommendations.",
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

  // Only show loader for initial session check
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  // If not authenticated, don't render (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  const greeting = getGreeting();
  const studentName = session?.user?.name?.split(' ')[0] || 'Student';
  const { performance, conceptMastery, primaryGaps, totalGaps } = dashboardData;

  // Prepare chart data
  const hasData = conceptMastery.length > 0;

  return (
    <>
      <StarBackground />
      
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {greeting}, {studentName}!
        </h2>
        <p className="text-sm md:text-base text-gray-400 mt-2">
          {hasData 
            ? `Your overall mastery is ${performance.overallMastery}% across ${conceptMastery.length} concepts. Keep up the great work!`
            : "Complete your first quiz to unlock personalized learning analytics and AI-powered insights."}
        </p>
      </div>

      {/* Stats Grid - Updated Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard 
          title="Overall Mastery"
          value={`${performance.overallMastery}%`}
          icon={Brain}
          color="blue"
        />
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
          subtitle={`${performance.totalQuizzes} total attempts`}
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

      {/* Charts Section - 3 Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar Chart - Concept Performance */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-400" />
              <h3 className="font-semibold text-white">Concept Performance</h3>
            </div>
            <span className="text-xs text-gray-500">Mastery by Concept</span>
          </div>
          {hasData ? (
            <PerformanceChart data={conceptMastery} />
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-sm text-gray-500">No data available yet</p>
                <p className="text-xs text-gray-600 mt-1">Complete quizzes to see your performance</p>
              </div>
            </div>
          )}
        </div>

        {/* Area Chart - Progress Trend */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LineChart size={18} className="text-green-400" />
              <h3 className="font-semibold text-white">Mastery Distribution</h3>
            </div>
            <span className="text-xs text-gray-500">Sorted by mastery level</span>
          </div>
          {hasData ? (
            <ProgressAreaChart concepts={conceptMastery} />
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <div className="text-center">
                <LineChart size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-sm text-gray-500">No data available yet</p>
                <p className="text-xs text-gray-600 mt-1">Start learning to see your progress</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hexagonal Grid Visualization */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Hexagon size={18} className="text-purple-400" />
            <h3 className="font-semibold text-white">Concept Mastery Hexagon</h3>
          </div>
          <span className="text-xs text-gray-500">Top 6 concepts by mastery</span>
        </div>
        {hasData ? (
          <HexagonalGrid concepts={conceptMastery} />
        ) : (
          <div className="py-12 text-center">
            <Hexagon size={48} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">No concept data available</p>
            <p className="text-xs text-gray-600 mt-1">Take quizzes to build your mastery profile</p>
          </div>
        )}
      </div>

      {/* Knowledge Gaps Section */}
      {primaryGaps && primaryGaps.length > 0 && (
        <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-400 mb-2">Priority Knowledge Gaps</p>
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

      {/* AI Assistant - Integrated Section */}
      <AIAssistantSection 
        messages={messages}
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        isLoading={isLoading}
        messagesEndRef={messagesEndRef}
        handleKeyPress={handleKeyPress}
      />
    </>
  );
}