// app/instructor/gaps/page.jsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, Target, AlertTriangle, TrendingDown, BarChart3, 
  ChevronRight, Menu, LogOut, Bell, User, 
  LayoutDashboard, Users, FileText, Loader2, 
  CheckCircle, XCircle, Clock, BookOpen, RefreshCw, Bot, Sparkles,
  Settings, TrendingUp, Award, Brain, Star, Lightbulb, GraduationCap, Filter,
  ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { signOut } from 'next-auth/react';

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
            <div className="flex items-center gap-2">
              <div className="bg-purple-500/20 p-2 rounded-xl"><Code className="h-5 w-5 text-purple-400" /></div>
              <span className="text-xl font-bold text-white">PACT</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Instructor Portal</p>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Instructor'}</p>
                <p className="text-xs text-gray-500 capitalize truncate">{role}</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm">
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Skeleton Loader
const GapsSkeleton = () => (
  <div className="pt-16 px-4 md:px-6 pb-6 animate-pulse">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[...Array(4)].map((_, i) => (<div key={i} className="bg-white/5 rounded-xl p-3 h-20" />))}
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
      <div className="h-6 w-40 bg-white/10 rounded mb-4" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1"><div className="h-4 w-32 bg-white/10 rounded" /><div className="h-4 w-16 bg-white/10 rounded" /></div>
            <div className="h-8 bg-white/10 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const config = {
    high: { color: 'red', label: 'High Priority' },
    medium: { color: 'yellow', label: 'Medium Priority' },
    low: { color: 'green', label: 'Low Priority' }
  };
  const p = config[priority] || config.medium;
  return (
    <span className={`text-xs px-2 py-1 rounded-full bg-${p.color}-500/20 text-${p.color}-400`}>
      {p.label}
    </span>
  );
};

// Student Gap Card Component
const StudentGapCard = ({ student, onViewDetails }) => {
  const masteryValue = typeof student.mastery === 'number' ? student.mastery : parseFloat(student.mastery) || 0;
  
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition cursor-pointer" onClick={() => onViewDetails(student)}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${masteryValue < 50 ? 'bg-red-500/20' : 'bg-purple-500/20'}`}>
          <User size={20} className={masteryValue < 50 ? 'text-red-400' : 'text-purple-400'} />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-white text-sm">{student.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Star size={10} className="text-yellow-400" />
              <span className="text-xs text-gray-300">{masteryValue.toFixed(1)}%</span>
            </div>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400">{student.gap_count || 0} gaps</span>
          </div>
        </div>
        {masteryValue < 50 && (
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        )}
      </div>
      {student.top_gap && (
        <p className="text-xs text-gray-400 mt-2 line-clamp-2">
          <span className="text-red-400">!</span> {student.top_gap}
        </p>
      )}
    </div>
  );
};

// Pagination Component for Error Patterns
const ErrorPatternPagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 mt-4 pt-4 border-t border-white/10">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition text-sm ${currentPage === 1 ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30'}`}>
        <ChevronLeft size={14} /><span>Prev</span>
      </button>
      <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
        {getPageNumbers().map((pageNum) => (
          <button key={pageNum} onClick={() => onPageChange(pageNum)} className={`min-w-[32px] px-2 py-1 rounded-lg text-xs transition ${currentPage === pageNum ? 'bg-purple-500 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
            {pageNum}
          </button>
        ))}
      </div>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition text-sm ${currentPage === totalPages ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30'}`}>
        <span>Next</span><ChevronRightIcon size={14} />
      </button>
    </div>
  );
};

// Get progress bar color based on priority/percentage
const getProgressColor = (percentage, priority) => {
  if (priority === 'high') return 'bg-red-500';
  if (priority === 'medium') return 'bg-yellow-500';
  if (priority === 'low') return 'bg-green-500';
  if (percentage >= 50) return 'bg-red-500';
  if (percentage >= 30) return 'bg-yellow-500';
  return 'bg-green-500';
};

// Main Component
export default function ClassGapsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [classGaps, setClassGaps] = useState([]);
  const [errorPatterns, setErrorPatterns] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [studentsWithGaps, setStudentsWithGaps] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Pagination state for error patterns
  const [errorCurrentPage, setErrorCurrentPage] = useState(1);
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
      fetchAllData();
    }
  }, [session, status, router]);

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchGapInsights(),
        fetchStudentsWithGaps()
      ]);
      await generateAIInsightsAndRecommendations();
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setDataReady(true);
      setRefreshing(false);
    }
  };

  const fetchGapInsights = async () => {
    try {
      const gapResponse = await fetch('/api/instructor/class-gaps');
      const gapData = await gapResponse.json();
      
      setClassGaps(gapData.class_gap_heatmap || []);
      setErrorPatterns(gapData.common_error_patterns || []);
      setErrorCurrentPage(1);
    } catch (error) {
      console.error('Failed to fetch gap insights:', error);
    }
  };

  const fetchStudentsWithGaps = async () => {
    try {
      const response = await fetch('/api/instructor/students-with-gaps');
      const data = await response.json();
      setStudentsWithGaps(data.students || []);
    } catch (error) {
      console.error('Failed to fetch students with gaps:', error);
    }
  };

  const generateAIInsightsAndRecommendations = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/instructor-gap-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classGaps: classGaps,
          errorPatterns: errorPatterns,
          studentCount: studentsWithGaps.length,
          totalStudents: studentsWithGaps.length + (studentsWithGaps.filter(s => s.mastery >= 50).length || 0),
          averageMastery: classGaps.length > 0 ? Math.round(classGaps.reduce((sum, g) => sum + (100 - g.struggling_percentage), 0) / classGaps.length) : 0
        })
      });
      const data = await response.json();
      setAiRecommendation(data.recommendation || 'Continue monitoring student progress. More data will provide better insights.');
      setRecommendations(data.actionableRecommendations || []);
    } catch (error) {
      console.error('Failed to generate AI recommendations:', error);
      setAiRecommendation('Complete more quizzes to enable AI-powered gap analysis recommendations.');
      setRecommendations([
        'Complete more assessments to generate AI insights',
        'Review student performance data regularly',
        'Encourage students to complete adaptive quizzes'
      ]);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleRefreshAI = async () => {
    await generateAIInsightsAndRecommendations();
  };

  const getStudentDetails = async (studentId) => {
    try {
      const response = await fetch(`/api/instructor/student-gaps?studentId=${studentId}`);
      const data = await response.json();
      setSelectedStudent(data);
    } catch (error) {
      console.error('Failed to fetch student details:', error);
    }
  };

  // Paginated error patterns
  const paginatedErrorPatterns = errorPatterns.slice(
    (errorCurrentPage - 1) * itemsPerPage,
    errorCurrentPage * itemsPerPage
  );
  const totalErrorPages = Math.ceil(errorPatterns.length / itemsPerPage);

  if (status === 'loading' || (!dataReady && status === 'authenticated')) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        {/* Fixed Header - No welcome title */}
        <div className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition">
              <Menu size={20} className="text-white" />
            </button>
            <div className="flex-1 ml-2 md:ml-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">Knowledge Gaps</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchAllData} disabled={refreshing} className="p-2 rounded-lg hover:bg-white/10 transition">
                <RefreshCw size={18} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/10 transition relative">
                <Bell size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area - Starts from top */}
        <div className="pt-16 px-3 sm:px-4 md:px-6 pb-6">
          
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
              <Target size={18} className="text-red-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{classGaps.length}</p>
              <p className="text-xs text-gray-500">Concepts with Gaps</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
              <Users size={18} className="text-yellow-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{studentsWithGaps.length}</p>
              <p className="text-xs text-gray-500">At-Risk Students</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
              <AlertTriangle size={18} className="text-orange-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{errorPatterns.length}</p>
              <p className="text-xs text-gray-500">Error Patterns</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
              <Brain size={18} className="text-blue-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{recommendations.length}</p>
              <p className="text-xs text-gray-500">Recommendations</p>
            </div>
          </div>

          {/* AI Insight Banner with Refresh - Linked to Recommendations */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Bot size={20} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">AI Instructor Insight</p>
                  <button 
                    onClick={handleRefreshAI} 
                    disabled={isGeneratingAI}
                    className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition text-xs flex items-center gap-1"
                  >
                    <RefreshCw size={12} className={isGeneratingAI ? 'animate-spin' : ''} />
                    {isGeneratingAI ? 'Refreshing...' : 'Refresh Insights'}
                  </button>
                </div>
                {isGeneratingAI ? (
                  <div className="flex items-center gap-2"><Loader2 size={14} className="animate-spin text-purple-400" /><span className="text-sm text-gray-300">Analyzing class data with AI...</span></div>
                ) : (
                  <p className="text-sm text-gray-200 leading-relaxed">{aiRecommendation}</p>
                )}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Class Gaps */}
            <div className="lg:col-span-2 space-y-6">
              {/* Concept Gap Analysis */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 size={18} className="text-purple-400" /> Concept Gap Analysis
                  <span className="text-xs text-gray-500 ml-2">from {classGaps.length} concepts</span>
                </h2>
                {classGaps.length > 0 ? (
                  <div className="space-y-4">
                    {classGaps.map((gap, idx) => {
                      const progressColor = getProgressColor(gap.struggling_percentage, gap.priority);
                      return (
                        <div key={idx}>
                          <div className="flex justify-between items-center text-sm mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-white capitalize">{gap.concept?.replace(/_/g, ' ')}</span>
                              <PriorityBadge priority={gap.priority || (gap.struggling_percentage >= 50 ? 'high' : gap.struggling_percentage >= 30 ? 'medium' : 'low')} />
                            </div>
                            <span className="text-red-400 font-medium">{gap.struggling_percentage}% struggling</span>
                          </div>
                          <div className="h-8 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${progressColor} rounded-full flex items-center justify-end px-3 text-xs text-white font-medium transition-all duration-500`} style={{ width: `${gap.struggling_percentage}%` }}>
                              {gap.struggling_percentage > 20 && `${gap.struggling_percentage}%`}
                            </div>
                          </div>
                          <div className="flex flex-wrap justify-between text-xs text-gray-500 mt-1 gap-2">
                            <span>Avg Mastery: {gap.avg_mastery || 0}%</span>
                            <span>{gap.total_attempts || 0} total attempts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 size={40} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500">No gap data available yet</p>
                    <p className="text-xs text-gray-600 mt-1">Students need to complete more quizzes</p>
                  </div>
                )}
              </div>

              {/* Common Error Patterns with Pagination */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-yellow-400" /> Common Error Patterns
                  <span className="text-xs text-gray-500 ml-2">most frequent mistakes</span>
                </h2>
                {errorPatterns.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      {paginatedErrorPatterns.map((pattern, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 rounded-lg bg-white/5 border border-yellow-500/20 hover:border-yellow-500/40 transition">
                          <div className="flex items-start gap-2 flex-1">
                            <TrendingDown size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-300 break-words">{pattern.pattern}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 whitespace-nowrap">
                              {pattern.frequency} occurrences
                            </span>
                            {pattern.concept && (
                              <span className="text-xs text-gray-500 capitalize hidden sm:inline">in {pattern.concept}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <ErrorPatternPagination currentPage={errorCurrentPage} totalPages={totalErrorPages} onPageChange={setErrorCurrentPage} />
                    <div className="text-center text-xs text-gray-500 mt-2">
                      Showing {(errorCurrentPage - 1) * itemsPerPage + 1} - {Math.min(errorCurrentPage * itemsPerPage, errorPatterns.length)} of {errorPatterns.length} error patterns
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-6">No error patterns identified yet.</p>
                )}
              </div>
            </div>

            {/* Right Column - Students with Gaps & AI Recommendations */}
            <div className="space-y-6">
              {/* Students with Gaps */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Users size={18} className="text-red-400" /> Students Needing Attention
                  <span className="text-xs text-gray-500 ml-2">{studentsWithGaps.length} students</span>
                </h2>
                {studentsWithGaps.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {studentsWithGaps.slice(0, 10).map((student) => (
                      <StudentGapCard key={student.id} student={student} onViewDetails={getStudentDetails} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users size={32} className="mx-auto text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500">No at-risk students</p>
                    <p className="text-xs text-gray-600 mt-1">All students are performing well!</p>
                  </div>
                )}
              </div>

              {/* AI Generated Actionable Recommendations */}
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Lightbulb size={18} className="text-yellow-400" /> AI Generated Recommendations
                  </h2>
                  {isGeneratingAI && <Loader2 size={14} className="animate-spin text-purple-400" />}
                </div>
                {recommendations.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {recommendations.slice(0, 6).map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-300 p-2 rounded-lg bg-white/5">
                        <Sparkles size={14} className="text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm text-gray-400 p-2 rounded-lg bg-white/5">
                      <Sparkles size={14} className="text-purple-400 mt-0.5" />
                      <span>Click "Refresh Insights" above to generate AI-powered recommendations</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-400 p-2 rounded-lg bg-white/5">
                      <Sparkles size={14} className="text-purple-400 mt-0.5" />
                      <span>Complete more quizzes to enable better AI analysis</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedStudent(null)}>
          <div className="bg-[#0A1628] border border-white/20 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">{selectedStudent.name}</h3>
                <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Overall Mastery</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${selectedStudent.mastery || 0}%` }} />
                    </div>
                    <span className="text-sm font-bold text-white">{selectedStudent.mastery || 0}%</span>
                  </div>
                </div>
                {selectedStudent.gaps && selectedStudent.gaps.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Identified Gaps</p>
                    <div className="space-y-2">
                      {selectedStudent.gaps.map((gap, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-sm text-red-300">{gap.concept}</p>
                          <p className="text-xs text-gray-400 mt-1">Mastery: {gap.mastery}% • {gap.total_questions} questions</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedStudent.weaknesses && selectedStudent.weaknesses.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Specific Weaknesses</p>
                    <div className="space-y-1">
                      {selectedStudent.weaknesses.slice(0, 3).map((weakness, idx) => (
                        <p key={idx} className="text-xs text-gray-400">• {weakness}</p>
                      ))}
                    </div>
                  </div>
                )}
                <Link href={`/instructor/students/${selectedStudent.id}`}>
                  <button className="w-full py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition text-sm">
                    View Student Details
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}