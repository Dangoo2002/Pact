'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Code, AlertCircle, TrendingDown, ChevronRight, Sparkles,
  Menu, User, LogOut, Bell, Brain, Target, BookOpen, LayoutDashboard, Loader2, Bot,
  Copy, Check
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

// ─── Formatted AI Content Component ──────────────────────────────────────────
const FormattedAIExplanation = ({ content }) => {
  // Parse code blocks
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
  // Process bold text (**text** -> strong)
  // Process bullet points
  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    // Handle bullet points
    if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
      const bulletContent = line.trim().substring(2);
      return `<div class="flex items-start gap-2 my-1"><span class="text-purple-400 flex-shrink-0">•</span><span>${bulletContent}</span></div>`;
    }
    // Handle numbered lists
    if (/^\d+\.\s/.test(line.trim())) {
      const matchNum = line.trim().match(/^(\d+)\.\s(.*)/);
      if (matchNum) {
        return `<div class="flex items-start gap-2 my-1"><span class="text-purple-400 font-medium flex-shrink-0">${matchNum[1]}.</span><span>${matchNum[2]}</span></div>`;
      }
    }
    // Handle section headers (text followed by colon)
    if (line.trim().endsWith(':') && line.trim().length < 50) {
      return `<div class="font-semibold text-purple-300 mt-2 mb-1">${line}</div>`;
    }
    if (line.trim() === '') return '<div class="h-1"></div>';
    return `<div>${line}</div>`;
  }).join('');
  
  // Apply bold formatting
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
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition px-2 py-0.5 rounded hover:bg-white/10"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs font-mono text-gray-300">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// ─── Skeleton Screen ──────────────────────────────────────────────────────────
const GapsSkeleton = () => (
  <div className="pt-16 sm:pt-20 px-3 sm:px-4 md:px-6 pb-6 animate-pulse">
    <div className="mb-5">
      <div className="h-6 sm:h-7 w-40 bg-white/10 rounded-lg mb-2" />
      <div className="h-3 sm:h-4 w-64 bg-white/5 rounded-lg" />
    </div>
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <div className="w-6 h-6 bg-white/10 rounded-lg mx-auto mb-2" />
          <div className="h-6 w-12 bg-white/10 rounded mx-auto mb-1" />
          <div className="h-3 w-16 bg-white/5 rounded mx-auto" />
        </div>
      ))}
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
      <div className="h-5 w-32 bg-white/10 rounded mb-3" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border-b border-white/10 pb-3">
            <div className="flex justify-between items-start mb-2">
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
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentGapsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [primaryGaps, setPrimaryGaps] = useState([]);
  const [secondaryGaps, setSecondaryGaps] = useState([]);
  const [overallMastery, setOverallMastery] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aiExplanation, setAiExplanation] = useState({});
  const [explaining, setExplaining] = useState({});

  // ── Auth Guard ──────────────────────────────────────────────────────────────
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
      
      setPrimaryGaps((data.primary_gaps || []).slice(0, 4));
      setSecondaryGaps((data.secondary_gaps || []).slice(0, 4));
      setOverallMastery(data.overall_mastery || 0);
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
      // Clean the explanation - remove any remaining asterisks and format properly
      let cleanExplanation = data.explanation || `Review the fundamentals of ${concept} in ${language}.`;
      // Replace markdown bold with HTML bold equivalent for our formatter
      cleanExplanation = cleanExplanation.replace(/\*\*(.*?)\*\*/g, '**$1**');
      setAiExplanation(prev => ({ 
        ...prev, 
        [concept]: cleanExplanation
      }));
    } catch (error) {
      setAiExplanation(prev => ({ 
        ...prev, 
        [concept]: `Unable to fetch explanation for ${concept}. Please try again.` 
      }));
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
    if (mastery >= 80) return 'Proficient';
    if (mastery >= 60) return 'Developing';
    return 'Needs Improvement';
  };

  // ── Loading / Auth States ───────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
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
        {/* Fixed Header */}
        <div className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
            >
              <Menu size={20} className="text-white" />
            </button>
            
            <div className="flex-1 ml-2 md:ml-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">
                Knowledge Gaps
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                AI-identified areas where you need improvement
              </p>
            </div>

            <button className="p-2 rounded-lg hover:bg-white/10 transition relative">
              <Bell size={18} className="text-gray-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {showSkeleton ? (
          <GapsSkeleton />
        ) : (
          <div className="pt-16 sm:pt-20 px-3 sm:px-4 md:px-6 pb-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
                <div className="p-1.5 rounded-lg bg-red-500/20 inline-block mb-1">
                  <AlertCircle size={14} className="text-red-400" />
                </div>
                <p className="text-xl font-bold text-white">{primaryGaps.length}</p>
                <p className="text-xs text-gray-500">High Priority</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
                <div className="p-1.5 rounded-lg bg-yellow-500/20 inline-block mb-1">
                  <TrendingDown size={14} className="text-yellow-400" />
                </div>
                <p className="text-xl font-bold text-white">{secondaryGaps.length}</p>
                <p className="text-xs text-gray-500">To Improve</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
                <div className="p-1.5 rounded-lg bg-blue-500/20 inline-block mb-1">
                  <Brain size={14} className="text-blue-400" />
                </div>
                <p className="text-xl font-bold text-white">{overallMastery}%</p>
                <p className="text-xs text-gray-500">Mastery</p>
              </div>
            </div>

            {/* Primary Gaps Section */}
            {primaryGaps.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
                <h3 className="text-base font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <AlertCircle size={16} />
                  High Priority Gaps
                </h3>
                <div className="space-y-4">
                  {primaryGaps.map((gap, idx) => (
                    <div key={idx} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm capitalize break-words">
                            {gap.concept?.replace(/_/g, ' ')}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getMasteryColor(gap.mastery)}`}>
                              {getMasteryText(gap.mastery)} ({Math.round(gap.mastery)}%)
                            </span>
                          </div>
                        </div>
                        <Link href={`/student/recommendations?concept=${gap.concept}`}>
                          <button className="text-xs text-blue-400 hover:text-blue-300 transition whitespace-nowrap">
                            Get Resources →
                          </button>
                        </Link>
                      </div>
                      
                      {gap.specific_errors && gap.specific_errors.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2 break-words">
                          • {gap.specific_errors[0]}
                        </p>
                      )}
                      
                      <button 
                        onClick={() => getAiExplanation(gap.concept, gap.language, gap.specific_errors?.[0])}
                        disabled={explaining[gap.concept]}
                        className="text-xs text-purple-400 hover:text-purple-300 transition mt-2 flex items-center gap-1"
                      >
                        {explaining[gap.concept] ? (
                          <>
                            <Loader2 size={10} className="animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Bot size={10} />
                            Explain with AI
                          </>
                        )}
                      </button>
                      
                      {aiExplanation[gap.concept] && (
                        <div className="mt-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <FormattedAIExplanation content={aiExplanation[gap.concept]} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Secondary Gaps Section */}
            {secondaryGaps.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <h3 className="text-base font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  <TrendingDown size={16} />
                  Improvement Areas
                </h3>
                <div className="space-y-2">
                  {secondaryGaps.map((gap, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2 border-b border-white/10 last:border-0">
                      <div>
                        <p className="font-medium text-white text-sm capitalize break-words">
                          {gap.concept?.replace(/_/g, ' ')}
                        </p>
                        <span className="text-xs text-gray-400">{Math.round(gap.mastery)}% mastery</span>
                      </div>
                      <Link href={`/student/recommendations?concept=${gap.concept}`}>
                        <button className="text-xs text-blue-400 hover:text-blue-300 transition whitespace-nowrap">
                          Practice →
                        </button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Gaps State */}
            {primaryGaps.length === 0 && secondaryGaps.length === 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-center py-8 sm:py-12">
                <Brain size={40} className="mx-auto text-gray-600 mb-3" />
                <h3 className="text-base font-medium text-white mb-1">No Gaps Detected</h3>
                <p className="text-xs text-gray-500 mb-4">Complete a quiz to see your knowledge gaps</p>
                <Link href="/student/quizzes">
                  <button className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition">
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