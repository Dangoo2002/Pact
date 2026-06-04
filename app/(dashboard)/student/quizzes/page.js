'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Code, Search, Clock, BookOpen, ChevronRight, Filter,
  Sparkles, Menu, X, User, LogOut, Bell, Bot, Loader2
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { fetchAvailableQuizzes } from '@/lib/api';

// Static star background
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

export default function QuizzesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [gettingRecommendation, setGettingRecommendation] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    Promise.all([
      fetchAvailableQuizzes(session.user.id),
      getAiQuizRecommendation()
    ]).then(([quizData, recData]) => {
      setQuizzes(quizData.quizzes || []);
      setFilteredQuizzes(quizData.quizzes || []);
      setAiRecommendation(recData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [session, router]);

  const getAiQuizRecommendation = async () => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: "Based on typical programming learning paths, recommend which quiz I should take next to improve my skills. Suggest one specific topic.",
          studentId: session?.user?.id
        })
      });
      const data = await response.json();
      return data.response;
    } catch (error) {
      return "Try the Python Basics quiz to strengthen your fundamentals.";
    }
  };

  useEffect(() => {
    let filtered = [...quizzes];
    
    if (search) {
      filtered = filtered.filter(q => q.title.toLowerCase().includes(search.toLowerCase()));
    }
    if (languageFilter !== 'all') {
      filtered = filtered.filter(q => q.language === languageFilter);
    }
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }
    
    setFilteredQuizzes(filtered);
  }, [search, languageFilter, difficultyFilter, quizzes]);

  const languages = [...new Set(quizzes.map(q => q.language))];
  const difficulties = [...new Set(quizzes.map(q => q.difficulty))];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        {/* Navbar */}
        <div className="sticky top-0 z-30 bg-[#0A1628]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10"><Menu size={20} /></button>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-white/10 relative"><Bell size={18} /><span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span></button>
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><User className="h-4 w-4 text-blue-400" /></div><span className="text-sm text-white hidden sm:inline">{session?.user?.name?.split(' ')[0] || 'Student'}</span></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Practice Quizzes</h1>
              <p className="text-sm text-gray-400 mt-1">AI-powered adaptive assessments</p>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="md:hidden p-2 rounded-lg border border-white/10 hover:bg-white/10">
              <Filter size={18} className="text-gray-400" />
            </button>
          </div>

          {/* AI Recommendation Banner */}
          {aiRecommendation && (
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
              <Bot size={20} className="text-purple-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-300">AI Recommendation</p>
                <p className="text-sm text-white">{aiRecommendation}</p>
              </div>
              <Link href="/student/recommendations">
                <button className="text-xs text-purple-400 hover:text-purple-300 transition">View All →</button>
              </Link>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search quizzes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div className={`flex flex-col md:flex-row gap-3 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                >
                  <option value="all">All Languages</option>
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                  ))}
                </select>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                >
                  <option value="all">All Difficulties</option>
                  {difficulties.map(diff => (
                    <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quizzes Grid */}
          {filteredQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-blue-500/30 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/20"><Code size={18} className="text-blue-400" /></div>
                    {quiz.progress > 0 && (<span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">{quiz.progress}% complete</span>)}
                  </div>
                  <h3 className="font-semibold text-white mb-1">{quiz.title}</h3>
                  <div className="flex items-center gap-2 text-xs mb-3">
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-300 capitalize">{quiz.language}</span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      quiz.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                      quiz.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{quiz.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1"><Clock size={12} /><span>{quiz.estimatedTime} min</span></div>
                    <div className="flex items-center gap-1"><BookOpen size={12} /><span>{quiz.questionCount} questions</span></div>
                  </div>
                  <Link href={`/student/quiz/${quiz.id}`}>
                    <button className="w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition text-sm font-medium">
                      {quiz.progress > 0 ? 'Continue Quiz' : 'Start Quiz'}
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-center py-12">
              <Code size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No quizzes found</h3>
              <p className="text-sm text-gray-500">Try adjusting your filters or check back later.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { LayoutDashboard, Target, BookOpen } from 'lucide-react';