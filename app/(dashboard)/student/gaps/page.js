// app/student/gaps/page.jsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Code, AlertCircle, TrendingDown, ChevronRight, Sparkles,
  Menu, User, LogOut, Bell, Brain, Target, BookOpen, LayoutDashboard, Loader2, Bot,
  Copy, Check, CheckCircle, ChevronLeft, Trophy, Star, TrendingUp
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

// ─── Formatted AI Content Component ──────────────────────────────────────────
const FormattedAIExplanation = ({ content }) => {
  const parts = [];
  let lastIndex = 0;
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textPart = content.slice(lastIndex, match.index);
      parts.push(<TextPart key={`text-${lastIndex}`} content={textPart} />);
    }
    const language = match[1] || 'code';
    const code = match[2].trim();
    parts.push(<CodeBlock key={`code-${match.index}`} code={code} language={language} />);
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < content.length) {
    const textPart = content.slice(lastIndex);
    parts.push(<TextPart key={`text-${lastIndex}`} content={textPart} />);
  }
  
  return <div className="space-y-2">{parts}</div>;
};

const TextPart = ({ content }) => {
  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
      const bulletContent = line.trim().substring(2);
      return `<div class="flex items-start gap-2 my-1"><span class="text-purple-400 flex-shrink-0">•</span><span>${bulletContent}</span></div>`;
    }
    if (/^\d+\.\s/.test(line.trim())) {
      const matchNum = line.trim().match(/^(\d+)\.\s(.*)/);
      if (matchNum) {
        return `<div class="flex items-start gap-2 my-1"><span class="text-purple-400 font-medium flex-shrink-0">${matchNum[1]}.</span><span>${matchNum[2]}</span></div>`;
      }
    }
    if (line.trim().endsWith(':') && line.trim().length < 50) {
      return `<div class="font-semibold text-purple-300 mt-2 mb-1">${line}</div>`;
    }
    if (line.trim() === '') return '<div class="h-1"></div>';
    return `<div>${line}</div>`;
  }).join('');
  
  const withBold = processedLines.replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-300 font-semibold">$1</strong>');
  return <div className="text-gray-200 leading-relaxed text-xs sm:text-sm" dangerouslySetInnerHTML={{ __html: withBold }} />;
};

const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative my-2 rounded-lg overflow-hidden bg-[#1E2A3A] border border-white/20">
      <div className="flex items-center justify-between px-3 py-1 bg-[#0F172A] border-b border-white/10">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition px-2 py-0.5 rounded hover:bg-white/10">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs font-mono text-gray-300"><code>{code}</code></pre>
    </div>
  );
};

// ─── Pagination Component (Responsive) ────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, color = 'blue' }) => {
  const getPageNumbers = () => {
    const pages = [];
    // On mobile, show fewer page numbers
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const maxVisible = isMobile ? 3 : 5;
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
    <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 mt-4 pt-4 border-t border-white/10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition text-xs sm:text-sm ${
          currentPage === 1 
            ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
            : `bg-${color}-500/20 border border-${color}-500/30 text-${color}-400 hover:bg-${color}-500/30`
        }`}
      >
        <ChevronLeft size={12} className="sm:w-[14px] sm:h-[14px]" />
        <span className="hidden xs:inline">Prev</span>
      </button>
      
      <div className="flex items-center gap-0.5 sm:gap-1 bg-white/5 rounded-lg p-0.5 sm:p-1">
        {getPageNumbers().map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`min-w-[28px] sm:min-w-[32px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs transition ${
              currentPage === pageNum
                ? `bg-${color}-500 text-white`
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {pageNum}
          </button>
        ))}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition text-xs sm:text-sm ${
          currentPage === totalPages 
            ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
            : `bg-${color}-500/20 border border-${color}-500/30 text-${color}-400 hover:bg-${color}-500/30`
        }`}
      >
        <span className="hidden xs:inline">Next</span>
        <ChevronRight size={12} className="sm:w-[14px] sm:h-[14px]" />
      </button>
    </div>
  );
};

// ─── Skeleton Screen (Responsive) ────────────────────────────────────────────
const GapsSkeleton = () => (
  <div className="pt-16 sm:pt-20 px-3 sm:px-4 md:px-6 pb-6 animate-pulse">
    <div className="mb-5">
      <div className="h-6 sm:h-7 w-40 bg-white/10 rounded-lg mb-2" />
      <div className="h-3 sm:h-4 w-64 bg-white/5 rounded-lg" />
    </div>
    {/* Skeleton Stats Cards - Responsive grid */}
    <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 sm:gap-3 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-2 sm:p-3 text-center">
          <div className="w-6 h-6 bg-white/10 rounded-lg mx-auto mb-1 sm:mb-2" />
          <div className="h-5 w-10 bg-white/10 rounded mx-auto mb-0.5 sm:mb-1" />
          <div className="h-2 w-12 bg-white/5 rounded mx-auto" />
        </div>
      ))}
    </div>
    {/* Skeleton Content Cards */}
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
      <div className="h-5 w-32 bg-white/10 rounded mb-3" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border-b border-white/10 pb-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
              <div className="h-4 w-32 bg-white/10 rounded" />
              <div className="h-6 w-20 bg-white/10 rounded" />
            </div>
            <div className="h-3 w-48 bg-white/5 rounded mt-2" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Sidebar (Responsive) ─────────────────────────────────────────────────────
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
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300" onClick={onClose} />
      )}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628] backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
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
                <Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Student'}</p>
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

// ─── Main Component (Fully Responsive) ────────────────────────────────────────
export default function StudentGapsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [needsImprovement, setNeedsImprovement] = useState([]);      // 0-59%
  const [developing, setDeveloping] = useState([]);                  // 60-79%
  const [mastered, setMastered] = useState([]);                      // 80-100%
  const [overallMastery, setOverallMastery] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aiExplanation, setAiExplanation] = useState({});
  const [explaining, setExplaining] = useState({});
  
  // Pagination states
  const [needsImprovementPage, setNeedsImprovementPage] = useState(1);
  const [developingPage, setDevelopingPage] = useState(1);
  const [masteredPage, setMasteredPage] = useState(1);
  const itemsPerPage = 5;

  // Auth Guard
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.id) {
      fetchGaps();
    }
  }, [session, status, router]);

  const fetchGaps = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/student/gaps?studentId=${session.user.id}`);
      const data = await response.json();
      
      // Categorize based on mastery
      const allGaps = [...(data.primary_gaps || []), ...(data.secondary_gaps || [])];
      const understood = data.understood_concepts || [];
      
      // Combine all concepts
      const allConcepts = [...allGaps, ...understood];
      
      // Separate by mastery level
      const needsImprovementList = allConcepts.filter(c => c.mastery < 60);
      const developingList = allConcepts.filter(c => c.mastery >= 60 && c.mastery < 80);
      const masteredList = allConcepts.filter(c => c.mastery >= 80);
      
      setNeedsImprovement(needsImprovementList);
      setDeveloping(developingList);
      setMastered(masteredList);
      setOverallMastery(data.overall_mastery || 0);
      
      // Reset pagination
      setNeedsImprovementPage(1);
      setDevelopingPage(1);
      setMasteredPage(1);
    } catch (error) {
      console.error('Failed to fetch gaps:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAiExplanation = async (concept, language, specificError) => {
    setExplaining(prev => ({ ...prev, [concept]: true }));
    try {
      const response = await fetch('/api/ai/explain-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          concept, 
          language: language || 'python', 
          studentId: session?.user?.id,
          errorContext: specificError
        })
      });
      const data = await response.json();
      let cleanExplanation = data.explanation || `Review the fundamentals of ${concept} in ${language}.`;
      cleanExplanation = cleanExplanation.replace(/\*\*(.*?)\*\*/g, '**$1**');
      setAiExplanation(prev => ({ ...prev, [concept]: cleanExplanation }));
    } catch (error) {
      setAiExplanation(prev => ({ ...prev, [concept]: `Unable to fetch explanation for ${concept}. Please try again.` }));
    } finally {
      setExplaining(prev => ({ ...prev, [concept]: false }));
    }
  };

  const getMasteryColor = (mastery) => {
    if (mastery >= 80) return 'bg-green-500/20 text-green-400';
    if (mastery >= 60) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const getMasteryText = (mastery) => {
    if (mastery >= 80) return 'Mastered';
    if (mastery >= 60) return 'Developing';
    return 'Needs Improvement';
  };

  // Pagination helpers
  const paginate = (items, page) => {
    return items.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  };

  const totalNeedsImprovementPages = Math.ceil(needsImprovement.length / itemsPerPage);
  const totalDevelopingPages = Math.ceil(developing.length / itemsPerPage);
  const totalMasteredPages = Math.ceil(mastered.length / itemsPerPage);

  const paginatedNeedsImprovement = paginate(needsImprovement, needsImprovementPage);
  const paginatedDeveloping = paginate(developing, developingPage);
  const paginatedMastered = paginate(mastered, masteredPage);

  if (status === 'loading') {
    return (<div className="min-h-screen bg-[#0A1628] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>);
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const showSkeleton = loading;

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        {/* Fixed Header - Responsive */}
        <div className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-2.5 sm:py-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition">
              <Menu size={20} className="text-white" />
            </button>
            <div className="flex-1 ml-2 md:ml-0">
              <h1 className="text-sm sm:text-lg md:text-xl font-bold text-white">Knowledge Gaps</h1>
              <p className="text-xs text-gray-400 hidden sm:block">AI-identified areas where you need improvement</p>
            </div>
            <button className="p-2 rounded-lg hover:bg-white/10 transition relative">
              <Bell size={18} className="text-gray-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Content Area - Fully Responsive */}
        {showSkeleton ? (<GapsSkeleton />) : (
          <div className="pt-16 sm:pt-20 px-3 sm:px-4 md:px-6 pb-6">
            {/* Stats Cards - Responsive Grid (2 cols on smallest, 4 on larger) */}
            <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 sm:gap-3 mb-6">
              {/* Needs Improvement Card */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2 sm:p-3 text-center">
                <div className="p-1 sm:p-1.5 rounded-lg bg-red-500/20 inline-block mb-0.5 sm:mb-1">
                  <AlertCircle size={14} className="sm:w-[14px] sm:h-[14px] text-red-400" />
                </div>
                <p className="text-lg sm:text-xl font-bold text-white">{needsImprovement.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">Needs Improvement</p>
                <p className="text-[8px] sm:text-[10px] text-gray-600 mt-0.5">&lt; 60%</p>
              </div>
              
              {/* Developing Card */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2 sm:p-3 text-center">
                <div className="p-1 sm:p-1.5 rounded-lg bg-yellow-500/20 inline-block mb-0.5 sm:mb-1">
                  <TrendingUp size={14} className="sm:w-[14px] sm:h-[14px] text-yellow-400" />
                </div>
                <p className="text-lg sm:text-xl font-bold text-white">{developing.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">Developing</p>
                <p className="text-[8px] sm:text-[10px] text-gray-600 mt-0.5">60-79%</p>
              </div>
              
              {/* Mastered Card */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2 sm:p-3 text-center">
                <div className="p-1 sm:p-1.5 rounded-lg bg-green-500/20 inline-block mb-0.5 sm:mb-1">
                  <Trophy size={14} className="sm:w-[14px] sm:h-[14px] text-green-400" />
                </div>
                <p className="text-lg sm:text-xl font-bold text-white">{mastered.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">Mastered</p>
                <p className="text-[8px] sm:text-[10px] text-gray-600 mt-0.5">80%+</p>
              </div>
              
              {/* Overall Mastery Card */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2 sm:p-3 text-center">
                <div className="p-1 sm:p-1.5 rounded-lg bg-blue-500/20 inline-block mb-0.5 sm:mb-1">
                  <Brain size={14} className="sm:w-[14px] sm:h-[14px] text-blue-400" />
                </div>
                <p className="text-lg sm:text-xl font-bold text-white">{overallMastery}%</p>
                <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">Overall Mastery</p>
              </div>
            </div>

            {/* Mastered Concepts Section (Green) - 80%+ */}
            {mastered.length > 0 && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-3 sm:p-4 mb-5 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-1 sm:gap-0">
                  <h3 className="text-sm sm:text-base font-semibold text-green-400 flex items-center gap-2">
                    <Trophy size={14} className="sm:w-4 sm:h-4" /> Mastered Concepts (80-100%)
                  </h3>
                  <span className="text-[10px] sm:text-xs text-green-500 ml-0 sm:ml-2">Excellent work! Keep maintaining these skills.</span>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {paginatedMastered.map((concept, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 rounded-lg bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition gap-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <Star size={12} className="sm:w-[14px] sm:h-[14px] text-yellow-400 flex-shrink-0" />
                          <p className="font-medium text-white text-xs sm:text-sm capitalize break-words">{concept.concept?.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 whitespace-nowrap">
                            Mastery: {Math.round(concept.mastery)}%
                          </span>
                          <span className="text-[10px] sm:text-xs text-green-400">✓ Fully understood</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <div className="w-12 sm:w-16 h-1 sm:h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${concept.mastery}%` }} />
                        </div>
                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-green-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
                {totalMasteredPages > 1 && (
                  <Pagination currentPage={masteredPage} totalPages={totalMasteredPages} onPageChange={setMasteredPage} color="green" />
                )}
                <div className="text-center text-[10px] sm:text-xs text-gray-500 mt-2">
                  Showing {paginatedMastered.length} of {mastered.length} mastered concepts
                </div>
              </div>
            )}

            {/* Developing Concepts Section (Yellow) - 60-79% */}
            {developing.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-3 sm:p-4 mb-5 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-1 sm:gap-0">
                  <h3 className="text-sm sm:text-base font-semibold text-yellow-400 flex items-center gap-2">
                    <TrendingUp size={14} className="sm:w-4 sm:h-4" /> Developing Concepts (60-79%)
                  </h3>
                  <span className="text-[10px] sm:text-xs text-yellow-500 ml-0 sm:ml-2">Almost there! A little more practice.</span>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {paginatedDeveloping.map((concept, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 hover:bg-yellow-500/10 transition gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-white text-xs sm:text-sm capitalize break-words">{concept.concept?.replace(/_/g, ' ')}</p>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 whitespace-nowrap">
                            Mastery: {Math.round(concept.mastery)}%
                          </span>
                          <span className="text-[10px] sm:text-xs text-yellow-400">→ {Math.round(100 - concept.mastery)}% to mastery</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <div className="w-12 sm:w-16 h-1 sm:h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${concept.mastery}%` }} />
                        </div>
                        <Link href={`/student/recommendations?concept=${concept.concept}`}>
                          <button className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 transition whitespace-nowrap">Practice →</button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                {totalDevelopingPages > 1 && (
                  <Pagination currentPage={developingPage} totalPages={totalDevelopingPages} onPageChange={setDevelopingPage} color="yellow" />
                )}
                <div className="text-center text-[10px] sm:text-xs text-gray-500 mt-2">
                  Showing {paginatedDeveloping.length} of {developing.length} developing concepts
                </div>
              </div>
            )}

            {/* Needs Improvement Section (Red) - Below 60% */}
            {needsImprovement.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-semibold text-red-400 mb-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <AlertCircle size={14} className="sm:w-4 sm:h-4" /> Needs Improvement (Below 60%)
                  <span className="text-[10px] sm:text-xs text-red-500 ml-0">Focus on these concepts first</span>
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {paginatedNeedsImprovement.map((gap, idx) => (
                    <div key={idx} className="border-b border-white/10 pb-3 sm:pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-col gap-2 mb-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1.5 sm:gap-2">
                          <div>
                            <p className="font-medium text-white text-xs sm:text-sm capitalize break-words">{gap.concept?.replace(/_/g, ' ')}</p>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 whitespace-nowrap">
                                Mastery: {Math.round(gap.mastery)}%
                              </span>
                              <span className="text-[10px] sm:text-xs text-red-400">⚠️ Critical - Needs attention</span>
                            </div>
                          </div>
                          <Link href={`/student/recommendations?concept=${gap.concept}`}>
                            <button className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 transition whitespace-nowrap self-start sm:self-center">
                              Get Resources →
                            </button>
                          </Link>
                        </div>
                        {gap.specific_errors && gap.specific_errors.length > 0 && (
                          <p className="text-[10px] sm:text-xs text-gray-400 break-words">• {gap.specific_errors[0]}</p>
                        )}
                        <button 
                          onClick={() => getAiExplanation(gap.concept, gap.language, gap.specific_errors?.[0])} 
                          disabled={explaining[gap.concept]} 
                          className="text-[10px] sm:text-xs text-purple-400 hover:text-purple-300 transition mt-1 flex items-center gap-1 self-start"
                        >
                          {explaining[gap.concept] ? (
                            <><Loader2 size={10} className="animate-spin" /> Analyzing...</>
                          ) : (
                            <><Bot size={10} /> Explain with AI</>
                          )}
                        </button>
                        {aiExplanation[gap.concept] && (
                          <div className="mt-2 p-2 sm:p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 overflow-x-auto">
                            <FormattedAIExplanation content={aiExplanation[gap.concept]} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {totalNeedsImprovementPages > 1 && (
                  <Pagination currentPage={needsImprovementPage} totalPages={totalNeedsImprovementPages} onPageChange={setNeedsImprovementPage} color="red" />
                )}
                <div className="text-center text-[10px] sm:text-xs text-gray-500 mt-2">
                  Showing {paginatedNeedsImprovement.length} of {needsImprovement.length} concepts needing improvement
                </div>
              </div>
            )}

            {/* No Data State - Responsive */}
            {needsImprovement.length === 0 && developing.length === 0 && mastered.length === 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-center py-8 sm:py-12 px-4">
                <Brain size={32} className="sm:w-10 sm:h-10 mx-auto text-gray-600 mb-2 sm:mb-3" />
                <h3 className="text-sm sm:text-base font-medium text-white mb-1">No Data Available</h3>
                <p className="text-xs text-gray-500 mb-3 sm:mb-4">Complete a quiz and click 'Save & Analyze' to see your knowledge gaps</p>
                <Link href="/student/quizzes">
                  <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-500/20 text-blue-400 text-xs sm:text-sm hover:bg-blue-500/30 transition">
                    Take a Quiz
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}