// app/student/gaps/page.js (your gaps page - fixed version)
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Code, AlertCircle, TrendingDown, ChevronRight, Sparkles,
  Menu, User, LogOut, Bell, Brain, Target, BookOpen, LayoutDashboard, Loader2
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { fetchGapProfile } from '@/lib/api';

// Static star background (keep your existing StarBackground component)
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
    // Clear localStorage before signing out
    localStorage.removeItem('pact_session');
    localStorage.removeItem('pact_user');
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

export default function StudentGapsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [primaryGaps, setPrimaryGaps] = useState([]);
  const [secondaryGaps, setSecondaryGaps] = useState([]);
  const [masteryScores, setMasteryScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [aiExplanation, setAiExplanation] = useState({});
  const [explaining, setExplaining] = useState({});
  const [retryCount, setRetryCount] = useState(0);

  // Check authentication and restore session
  useEffect(() => {
    // Try to restore from localStorage if session is missing
    if (status === 'unauthenticated') {
      const savedSession = localStorage.getItem('pact_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          if (parsed.user && new Date(parsed.expires) > new Date()) {
            console.log('Restoring session from localStorage');
            // You might want to trigger a session refresh here
            window.location.reload();
            return;
          }
        } catch (e) {
          console.error('Failed to restore session', e);
        }
      }
      router.push('/login');
    }
  }, [status, router]);

  // Save user data to localStorage when session is available
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      localStorage.setItem('pact_user', JSON.stringify({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        savedAt: new Date().toISOString()
      }));
    }
  }, [session, status]);

  // Fetch gap data with retry logic
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const data = await fetchGapProfile(session.user.id);
          setPrimaryGaps(data.primary_gaps || []);
          setSecondaryGaps(data.secondary_gaps || []);
          setMasteryScores(data.mastery_scores || {});
        } catch (error) {
          console.error('Failed to fetch gaps:', error);
          if (retryCount < 3) {
            setTimeout(() => setRetryCount(prev => prev + 1), 2000);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [session, status, retryCount]);

  const getAiExplanation = async (concept, language) => {
    setExplaining(prev => ({ ...prev, [concept]: true }));
    try {
      const response = await fetch('/api/ai/explain-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, language, errorMessage: `Student struggling with ${concept} in ${language}` })
      });
      const data = await response.json();
      setAiExplanation(prev => ({ ...prev, [concept]: data.explanation || 'Review the fundamentals and practice with examples.' }));
    } catch (error) {
      setAiExplanation(prev => ({ ...prev, [concept]: 'Unable to fetch explanation. Please try again.' }));
    } finally {
      setExplaining(prev => ({ ...prev, [concept]: false }));
    }
  };

  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect via useEffect
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Knowledge Gaps</h1>
              <p className="text-sm text-gray-400 mt-1">Identified areas where you need improvement</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20"><AlertCircle size={20} className="text-red-400" /></div>
                <div><p className="text-2xl font-bold text-white">{primaryGaps.length}</p><p className="text-sm text-gray-500">High Priority Gaps</p></div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20"><TrendingDown size={20} className="text-yellow-400" /></div>
                <div><p className="text-2xl font-bold text-white">{secondaryGaps.length}</p><p className="text-sm text-gray-500">Improvement Areas</p></div>
              </div>
            </div>
          </div>

          {primaryGaps.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 mb-6">
              <h2 className="text-lg font-semibold text-red-400 mb-4">High Priority Gaps</h2>
              <div className="space-y-4">
                {primaryGaps.map((gap, idx) => (
                  <div key={idx} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-white">{gap.concept} ({gap.language})</p>
                        <p className="text-sm text-gray-500">Mastery: {(gap.mastery_score * 100).toFixed(0)}%</p>
                      </div>
                      <Link href="/student/recommendations" className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
                        Get Resources <ChevronRight size={14} />
                      </Link>
                    </div>
                    <button onClick={() => getAiExplanation(gap.concept, gap.language)} className="text-sm text-purple-400 hover:text-purple-300 transition flex items-center gap-1 mt-2">
                      {explaining[gap.concept] ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {explaining[gap.concept] ? 'Analyzing...' : 'Explain with AI'}
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

          {secondaryGaps.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
              <h2 className="text-lg font-semibold text-yellow-400 mb-4">Improvement Areas</h2>
              <div className="space-y-3">
                {secondaryGaps.map((gap, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">{gap.concept} ({gap.language})</p>
                      <p className="text-sm text-gray-500">Mastery: {(gap.mastery_score * 100).toFixed(0)}%</p>
                    </div>
                    <Link href="/student/recommendations">
                      <button className="text-sm text-blue-400 hover:text-blue-300 transition">Practice</button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {primaryGaps.length === 0 && secondaryGaps.length === 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-center py-12">
              <Brain size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Gaps Detected!</h3>
              <p className="text-sm text-gray-500">Keep up the great work! Take more quizzes to identify areas for improvement.</p>
              <Link href="/student/quizzes">
                <button className="mt-4 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition">
                  Take a Quiz
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}