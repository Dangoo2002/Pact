// app/instructor/assessments/page.jsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, FileText, Menu, LogOut, Bell, User, Loader2, 
  LayoutDashboard, Users, Target, Settings,
  Clock, Calendar, Star, TrendingUp, Eye, 
  AlertCircle, CheckCircle, Bot, Sparkles, RefreshCw,
  ChevronLeft, ChevronRight, Brain, Activity, BarChart3, Zap,
  TrendingDown, Award, Medal, Trophy, PieChart as LucidePieChart,
  Download, Send, MessageCircle, Lightbulb, GraduationCap,
  Filter, CalendarDays, PercentCircle, BookOpen, Crown, LineChart as LucideLineChart,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// Star Background
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

// Sidebar
const Sidebar = ({ isOpen, onClose }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;
  const handleSignOut = async () => { await signOut({ redirect: false }); router.push('/'); };
  const navItems = [
    { href: '/instructor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/instructor/students', label: 'Students', icon: Users },
    { href: '/instructor/gaps', label: 'Class Gaps', icon: Target },
    { href: '/instructor/assessments', label: 'Assessments', icon: FileText },
    { href: '/instructor/settings', label: 'Settings', icon: Settings },
  ];
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628] backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2"><div className="bg-purple-500/20 p-2 rounded-xl"><Code className="h-5 w-5 text-purple-400" /></div><span className="text-xl font-bold text-white">PACT</span></div>
            <p className="text-xs text-gray-500 mt-2">Instructor Portal</p>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
                  <Icon size={18} /><span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-purple-400" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Instructor'}</p><p className="text-xs text-gray-500 capitalize truncate">{role}</p></div>
            </div>
            <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"><LogOut size={16} />Sign Out</button>
          </div>
        </div>
      </div>
    </>
  );
};

// Skeleton Loader
const AssessmentsSkeleton = () => (
  <div className="pt-16 px-4 md:px-6 pb-6 animate-pulse">
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {[...Array(5)].map((_, i) => (<div key={i} className="bg-white/5 rounded-xl p-3 h-24" />))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {[...Array(2)].map((_, i) => (<div key={i} className="bg-white/5 rounded-xl p-4 h-64" />))}
    </div>
    <div className="bg-white/5 rounded-xl p-4 h-80" />
  </div>
);

// Custom Label for Pie Chart
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.1;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="#9CA3AF" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10}>
      {`${name}: ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Student Performance Card Component
const StudentPerformanceCard = ({ student, rank }) => {
  const getMasteryColor = (mastery) => {
    if (mastery >= 80) return 'text-green-400';
    if (mastery >= 60) return 'text-yellow-400';
    if (mastery >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProgressBarColor = (mastery) => {
    if (mastery >= 80) return 'bg-green-500';
    if (mastery >= 60) return 'bg-yellow-500';
    if (mastery >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (mastery, previousMastery) => {
    if (!previousMastery) return <Minus size={12} className="text-gray-400" />;
    if (mastery > previousMastery) return <ArrowUp size={12} className="text-green-400" />;
    if (mastery < previousMastery) return <ArrowDown size={12} className="text-red-400" />;
    return <Minus size={12} className="text-gray-400" />;
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/10">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
          <span className="text-purple-400 font-bold text-sm">{rank}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white text-sm font-medium">{student.name}</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${getMasteryColor(student.mastery)}`}>
                {student.mastery}%
              </span>
              {student.trend && getTrendIcon(student.mastery, student.previousMastery)}
            </div>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressBarColor(student.mastery)} rounded-full transition-all duration-500`}
              style={{ width: `${student.mastery}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">{student.totalQuizzes || 0} quizzes</span>
            <span className="text-xs text-gray-500">{student.conceptsMastered || 0} concepts mastered</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function InstructorAssessmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingAI, setRefreshingAI] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [assessmentData, setAssessmentData] = useState({
    overallStats: {
      totalAssessments: 0,
      averageScore: 0,
      passRate: 0,
      improvementRate: 0,
      topPerformers: 0,
      atRiskCount: 0
    },
    performanceTrend: [],
    conceptMastery: [],
    studentPerformance: [],
    classDistribution: [],
    weeklyProgress: [],
    recentAssessments: []
  });
  const [aiInsight, setAiInsight] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Auth guard
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'instructor') {
        router.replace('/student');
        return;
      }
      fetchAssessmentData();
    }
  }, [session, status, router]);

  const fetchAssessmentData = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/instructor/assessments-data`);
      const data = await response.json();
      setAssessmentData(data);
      await generateAIInsight(data);
    } catch (error) {
      console.error('Failed to fetch assessment data:', error);
    } finally {
      setLoading(false);
      setDataReady(true);
      setRefreshing(false);
    }
  };

  const generateAIInsight = async (data) => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/assessment-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          averageScore: data.overallStats?.averageScore,
          passRate: data.overallStats?.passRate,
          improvementRate: data.overallStats?.improvementRate,
          topGaps: data.conceptMastery?.filter(c => c.mastery < 60).slice(0, 3),
          trendData: data.performanceTrend
        })
      });
      const result = await response.json();
      setAiInsight(result.insight || 'Continue monitoring student progress for more insights.');
    } catch (error) {
      console.error('Failed to generate AI insight:', error);
      setAiInsight('Complete more assessments to enable AI-powered insights.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleRefreshAI = async () => {
    setRefreshingAI(true);
    await generateAIInsight(assessmentData);
    setRefreshingAI(false);
  };

  if (status === 'loading' || (!dataReady && status === 'authenticated')) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  // Pagination for recent assessments
  const totalPages = Math.ceil(assessmentData.recentAssessments?.length / itemsPerPage);
  const paginatedAssessments = assessmentData.recentAssessments?.slice(
    (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
  );

  // Colors for pie chart
  const COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  // Sort students by mastery (highest first)
  const sortedStudents = [...(assessmentData.studentPerformance || [])]
    .sort((a, b) => b.mastery - a.mastery);

  // Sort areas of improvement by mastery (lowest first)
  const sortedImprovementAreas = [...(assessmentData.conceptMastery || [])]
    .filter(c => c.mastery < 60)
    .sort((a, b) => a.mastery - b.mastery);

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        {/* Fixed Header */}
        <div className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition">
              <Menu size={20} className="text-white" />
            </button>
            <div className="flex-1 ml-2 md:ml-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">Assessment Analytics</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchAssessmentData} disabled={refreshing} className="p-2 rounded-lg hover:bg-white/10 transition">
                <RefreshCw size={18} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/10 transition relative">
                <Bell size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="pt-16 px-3 sm:px-4 md:px-6 pb-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
              <FileText size={18} className="text-purple-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{assessmentData.overallStats?.totalAssessments || 0}</p>
              <p className="text-xs text-gray-500">Total Assessments</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
              <TrendingUp size={18} className="text-green-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{assessmentData.overallStats?.averageScore || 0}%</p>
              <p className="text-xs text-gray-500">Avg Score</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
              <Award size={18} className="text-yellow-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{assessmentData.overallStats?.passRate || 0}%</p>
              <p className="text-xs text-gray-500">Pass Rate</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
              <TrendingUp size={18} className="text-blue-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{assessmentData.overallStats?.improvementRate || 0}%</p>
              <p className="text-xs text-gray-500">Improvement</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
              <AlertCircle size={18} className="text-red-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{assessmentData.overallStats?.atRiskCount || 0}</p>
              <p className="text-xs text-gray-500">At Risk</p>
            </div>
          </div>

          {/* AI Insight Banner */}
          {(aiInsight || isGeneratingAI) && (
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20"><Bot size={20} className="text-purple-400" /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">AI Assessment Insight</p>
                    <button 
                      onClick={handleRefreshAI} 
                      disabled={refreshingAI}
                      className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition text-xs flex items-center gap-1"
                    >
                      <RefreshCw size={12} className={refreshingAI ? 'animate-spin' : ''} />
                      {refreshingAI ? 'Refreshing...' : 'Refresh Insight'}
                    </button>
                  </div>
                  {isGeneratingAI || refreshingAI ? (
                    <div className="flex items-center gap-2"><Loader2 size={14} className="animate-spin text-purple-400" /><span className="text-sm text-gray-300">Analyzing assessment data...</span></div>
                  ) : (
                    <p className="text-sm text-gray-200 leading-relaxed">{aiInsight}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Performance Trend */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <LucideLineChart size={18} className="text-purple-400" /> Performance Trend
              </h2>
              {assessmentData.performanceTrend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={assessmentData.performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis stroke="#9CA3AF" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #ffffff20' }} />
                    <Area type="monotone" dataKey="score" stroke="#8B5CF6" fill="#8B5CF640" name="Average Score (%)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (<div className="h-[250px] flex items-center justify-center"><p className="text-gray-500">No data available</p></div>)}
            </div>

            {/* Concept Mastery Radar */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Brain size={18} className="text-purple-400" /> Concept Mastery
              </h2>
              {assessmentData.conceptMastery?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={assessmentData.conceptMastery}>
                    <PolarGrid stroke="#ffffff30" />
                    <PolarAngleAxis dataKey="concept" stroke="#9CA3AF" fontSize={10} tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis stroke="#9CA3AF" fontSize={10} domain={[0, 100]} />
                    <Radar name="Mastery" dataKey="mastery" stroke="#8B5CF6" fill="#8B5CF640" fillOpacity={0.6} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #ffffff20' }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (<div className="h-[250px] flex items-center justify-center"><p className="text-gray-500">No data available</p></div>)}
            </div>
          </div>

          {/* Student Performance Distribution & Weekly Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <LucidePieChart size={18} className="text-purple-400" /> Performance Distribution
              </h2>
              {assessmentData.classDistribution?.some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie 
                      data={assessmentData.classDistribution} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={80} 
                      dataKey="count" 
                      label={renderCustomLabel}
                      labelLine={false}
                    >
                      {assessmentData.classDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #ffffff20' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (<div className="h-[250px] flex items-center justify-center"><p className="text-gray-500">No data available</p></div>)}
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <CalendarDays size={18} className="text-purple-400" /> Weekly Progress
              </h2>
              {assessmentData.weeklyProgress?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={assessmentData.weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="week" stroke="#9CA3AF" fontSize={10} />
                    <YAxis stroke="#9CA3AF" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #ffffff20' }} />
                    <Bar dataKey="completed" fill="#8B5CF6" name="Assessments Completed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (<div className="h-[250px] flex items-center justify-center"><p className="text-gray-500">No data available</p></div>)}
            </div>
          </div>

          {/* Student Performance Cards (Replaces Top Performers) */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Users size={18} className="text-purple-400" /> Student Performance Overview
              <span className="text-xs text-gray-500 ml-2">real-time mastery scores</span>
            </h2>
            {sortedStudents.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {sortedStudents.map((student, idx) => (
                  <StudentPerformanceCard 
                    key={student.id} 
                    student={student} 
                    rank={idx + 1}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users size={32} className="mx-auto text-gray-600 mb-2" />
                <p className="text-sm text-gray-500">No student performance data available</p>
                <p className="text-xs text-gray-600 mt-1">Students need to complete quizzes to generate data</p>
              </div>
            )}
          </div>

          {/* Recent Assessments Table */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={18} className="text-purple-400" /> Recent Assessments
            </h2>
            {paginatedAssessments?.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-white/10">
                      <tr className="text-left text-gray-400">
                        <th className="pb-3 font-medium">Student</th>
                        <th className="pb-3 font-medium">Assessment</th>
                        <th className="pb-3 font-medium">Score</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Date</th>
                       </tr>
                    </thead>
                    <tbody>
                      {paginatedAssessments.map((assessment, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-3 text-white">{assessment.studentName} </td>
                          <td className="py-3 text-gray-300">{assessment.title} </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${assessment.score >= 70 ? 'bg-green-500/20 text-green-400' : assessment.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                              {assessment.score}%
                            </span>
                           </td>
                          <td className="py-3">
                            <span className={`text-xs ${assessment.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                              {assessment.status}
                            </span>
                           </td>
                          <td className="py-3 text-gray-400">{new Date(assessment.date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                   </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap justify-center items-center gap-2 mt-4 pt-4 border-t border-white/10">
                    <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className={`px-3 py-1 rounded-lg text-sm ${currentPage === 1 ? 'bg-white/5 text-gray-500' : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'}`}>Prev</button>
                    <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className={`px-3 py-1 rounded-lg text-sm ${currentPage === totalPages ? 'bg-white/5 text-gray-500' : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'}`}>Next</button>
                  </div>
                )}
              </>
            ) : (<div className="text-center py-8"><FileText size={40} className="mx-auto text-gray-600 mb-3" /><p className="text-gray-500">No recent assessments found</p></div>)}
          </div>

          {/* Areas of Improvement */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingDown size={18} className="text-red-400" /> Areas of Improvement
            </h2>
            {sortedImprovementAreas.length > 0 ? (
              <div className="space-y-3">
                {sortedImprovementAreas.slice(0, 5).map((concept, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-gray-300 text-sm capitalize">{concept.concept?.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${concept.mastery}%` }} />
                      </div>
                      <span className="text-red-400 text-xs">{concept.mastery}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (<p className="text-gray-500 text-center py-6">No significant gaps detected</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}