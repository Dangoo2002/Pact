'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Code, AlertCircle, TrendingDown, ChevronRight, Sparkles,
  Menu, User, LogOut, Bell, Brain, Target, BookOpen, LayoutDashboard, Loader2, Bot,
  CheckCircle, XCircle, Clock, ExternalLink
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
    { href: '/student/gaps', label: 'Knowledge Gaps', icon: Target },
    { href: '/student/quizzes', label: 'Quizzes', icon: BookOpen },
    { href: '/student/recommendations', label: 'Recommendations', icon: Sparkles },
    { href: '/student/profile', label: 'Profile', icon: User },
  ];
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628]/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 border-b border-white/10"><div className="flex items-center gap-2"><div className="bg-blue-500/20 p-2 rounded-xl"><Code className="h-5 w-5 text-blue-400" /></div><span className="text-xl font-bold text-white">PACT</span></div><p className="text-xs text-gray-500 mt-2">Student Portal</p></div>
        <nav className="p-3 space-y-1">{navItems.map((item) => { const Icon = item.icon; return (<Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"><Icon size={18} /><span className="text-sm">{item.label}</span></Link>); })}</nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10"><div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><User className="h-4 w-4 text-blue-400" /></div><div className="flex-1"><p className="text-sm font-medium text-white">{session?.user?.name || 'Student'}</p><p className="text-xs text-gray-500 capitalize">{role}</p></div></div><button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"><LogOut size={16} />Sign Out</button></div>
      </div>
    </>
  );
};

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
  const [expandedGap, setExpandedGap] = useState(null);

  useEffect(() => {
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
      
      console.log('Gaps data received:', data);
      
      setPrimaryGaps(data.primary_gaps || []);
      setSecondaryGaps(data.secondary_gaps || []);
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
      setAiExplanation(prev => ({ 
        ...prev, 
        [concept]: data.explanation || `Review the fundamentals of ${concept} in ${language}. Practice with simple examples first.` 
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="ml-3 text-gray-400">Analyzing your knowledge gaps...</span>
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
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm text-white hidden sm:inline">{session?.user?.name?.split(' ')[0] || 'Student'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Knowledge Gaps</h1>
            <p className="text-sm text-gray-400 mt-1">AI-identified areas where you need improvement</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <AlertCircle size={20} className="text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{primaryGaps.length}</p>
                  <p className="text-sm text-gray-500">High Priority Gaps</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <TrendingDown size={20} className="text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{secondaryGaps.length}</p>
                  <p className="text-sm text-gray-500">Improvement Areas</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Brain size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{overallMastery}%</p>
                  <p className="text-sm text-gray-500">Overall Mastery</p>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Gaps Section */}
          {primaryGaps.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 mb-6">
              <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                <AlertCircle size={18} />
                High Priority Gaps - Need Immediate Attention
              </h2>
              <div className="space-y-4">
                {primaryGaps.map((gap, idx) => (
                  <div key={idx} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-white capitalize">{gap.concept?.replace(/_/g, ' ')}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getMasteryColor(gap.mastery)}`}>
                            {getMasteryText(gap.mastery)} ({Math.round(gap.mastery)}%)
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                            {gap.severity || 'high'} priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Language: {gap.language || 'Python'}</p>
                      </div>
                      <Link href={`/student/recommendations?concept=${gap.concept}`}>
                        <button className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
                          Get Resources <ChevronRight size={14} />
                        </button>
                      </Link>
                    </div>
                    
                    {gap.specific_errors && gap.specific_errors.length > 0 && (
                      <div className="mt-2 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                        <p className="text-xs text-red-400 mb-1">Specific issues detected:</p>
                        <ul className="space-y-1">
                          {gap.specific_errors.slice(0, 3).map((error, i) => (
                            <li key={i} className="text-xs text-gray-400">• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {gap.detailed_analysis && (
                      <p className="text-sm text-gray-400 mt-2">{gap.detailed_analysis}</p>
                    )}
                    
                    <button 
                      onClick={() => getAiExplanation(gap.concept, gap.language, gap.specific_errors?.[0])}
                      disabled={explaining[gap.concept]}
                      className="text-sm text-purple-400 hover:text-purple-300 transition flex items-center gap-1 mt-2"
                    >
                      {explaining[gap.concept] ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
                      {explaining[gap.concept] ? 'AI is analyzing...' : 'Get AI-powered explanation'}
                    </button>
                    
                    {aiExplanation[gap.concept] && (
                      <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <p className="text-sm text-gray-300">{aiExplanation[gap.concept]}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Secondary Gaps Section */}
          {secondaryGaps.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 mb-6">
              <h2 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <TrendingDown size={18} />
                Improvement Areas - Moderate Priority
              </h2>
              <div className="space-y-3">
                {secondaryGaps.map((gap, idx) => (
                  <div key={idx} className="flex flex-wrap justify-between items-center py-2 border-b border-white/10 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-white capitalize">{gap.concept?.replace(/_/g, ' ')}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getMasteryColor(gap.mastery)}`}>
                          {getMasteryText(gap.mastery)} ({Math.round(gap.mastery)}%)
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Language: {gap.language || 'Python'}</p>
                    </div>
                    <Link href={`/student/recommendations?concept=${gap.concept}`}>
                      <button className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
                        Practice <ChevronRight size={14} />
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Gaps State */}
          {primaryGaps.length === 0 && secondaryGaps.length === 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-center py-12">
              <Brain size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Gaps Detected Yet</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                Complete a quiz and click "Save & Get AI Recommendations" to see your knowledge gaps. 
                Our AI will analyze your performance and identify areas for improvement.
              </p>
              <Link href="/student/quizzes">
                <button className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition">
                  Take a Quiz
                </button>
              </Link>
            </div>
          )}

          {/* Study Tips Section - Only show if gaps exist */}
          {(primaryGaps.length > 0 || secondaryGaps.length > 0) && (
            <div className="mt-6 p-5 bg-gradient-to-r from-blue-500/5 to-purple-500/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-400" />
                Recommended Study Plan
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <Target size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Focus on <strong className="text-white">{primaryGaps.length > 0 ? primaryGaps[0]?.concept?.replace(/_/g, ' ') : 'high priority gaps'}</strong> first</span>
                </li>
                <li className="flex items-start gap-2">
                  <BookOpen size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Review the AI-generated explanations for each gap</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Use the recommended resources in the Recommendations page</span>
                </li>
                <li className="flex items-start gap-2">
                  <RefreshCw size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Retake quizzes to track your improvement</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Add missing icon
const RefreshCw = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);