'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Code, Search, Clock, BookOpen, ChevronRight, Filter,
  Sparkles, Menu, X, User, LogOut, Bell, Bot, Loader2, LayoutDashboard, Target,
  ChevronLeft, ChevronRight as ChevronRightIcon
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

// All 7 programming languages
const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' }
];
const CONCEPTS = ['variables', 'data_types', 'operators', 'conditionals', 'loops', 'functions', 'arrays', 'strings', 'classes', 'inheritance'];

export default function QuizzesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [conceptFilter, setConceptFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [startingQuizId, setStartingQuizId] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    fetchQuizzes();
  }, [session, router, languageFilter, conceptFilter]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const url = `/api/student/quizzes?studentId=${session.user.id}&language=${languageFilter}&concept=${conceptFilter}`;
      const response = await fetch(url);
      const data = await response.json();
      setQuizzes(data.quizzes || []);
      setFilteredQuizzes(data.quizzes || []);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (concept, language, quizId) => {
    if (startingQuizId) return;
    setStartingQuizId(quizId);
    
    try {
      const response = await fetch('/api/student/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: session.user.id, concept, language })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.session_id) {
        throw new Error('No session_id returned');
      }
      
      const quizData = {
        all_questions: data.all_questions,
        current_question: data.current_question,
        total_questions: data.total_questions,
        score: 0,
        questions_answered: 0,
        time_left: 300
      };
      
      const storageKey = `quiz_${data.session_id}`;
      sessionStorage.setItem(storageKey, JSON.stringify(quizData));
      localStorage.setItem(storageKey, JSON.stringify(quizData));
      
      router.push(`/student/quiz/${data.session_id}`);
    } catch (error) {
      console.error('Failed to start quiz:', error);
      alert('Failed to start quiz: ' + error.message);
    } finally {
      setStartingQuizId(null);
    }
  };

  useEffect(() => {
    if (!search) {
      setFilteredQuizzes(quizzes);
    } else {
      const filtered = quizzes.filter(q => 
        q.title?.toLowerCase().includes(search.toLowerCase()) ||
        q.language?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredQuizzes(filtered);
    }
    setCurrentPage(1);
  }, [search, quizzes]);

  const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
  const paginatedQuizzes = filteredQuizzes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <div className="min-h-screen bg-[#0A1628] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        {/* Static Header - Always visible */}
        <div className="sticky top-0 z-30 bg-[#0A1628]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20">
                <BookOpen size={18} className="text-blue-400" />
              </div>
              <h1 className="text-xl font-semibold text-white">Quizzes</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-white/10 relative">
                <Bell size={18} className="text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
              </button>
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
          {/* Welcome Section */}
          <div className="mb-5">
            <h2 className="text-xl md:text-2xl font-bold text-white">Practice Quizzes</h2>
            <p className="text-sm text-gray-400 mt-1">Test your knowledge on programming concepts across 7 languages</p>
          </div>

          {/* Filter Toggle Button for Mobile */}
          <div className="flex justify-between items-center mb-4 md:hidden">
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm flex items-center gap-2"
            >
              <Filter size={14} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Filters - Responsive */}
          <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
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
              <div className="flex flex-col sm:flex-row gap-3">
                <select 
                  value={languageFilter} 
                  onChange={(e) => setLanguageFilter(e.target.value)} 
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                >
                  <option value="all">All Languages</option>
                  {LANGUAGES.map(lang => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
                </select>
                <select 
                  value={conceptFilter} 
                  onChange={(e) => setConceptFilter(e.target.value)} 
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
                >
                  <option value="all">All Concepts</option>
                  {CONCEPTS.map(concept => <option key={concept} value={concept}>{concept.charAt(0).toUpperCase() + concept.slice(1).replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Quizzes Grid - Responsive */}
          {paginatedQuizzes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {paginatedQuizzes.map((quiz) => (
                  <div 
                    key={quiz.id} 
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4 hover:border-blue-500/30 transition cursor-pointer" 
                    onClick={() => startQuiz(quiz.title, quiz.language, quiz.id)}
                  >
                    <div className="flex items-start justify-between mb-2 md:mb-3">
                      <div className="p-1.5 md:p-2 rounded-lg bg-blue-500/20">
                        <Code size={16} className="md:text-[18px] text-blue-400" />
                      </div>
                      {quiz.progress > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                          {quiz.progress}% complete
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white text-sm md:text-base mb-1 capitalize">
                      {quiz.title.replace(/_/g, ' ')}
                    </h3>
                    <div className="flex items-center gap-2 text-xs mb-2 md:mb-3">
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-300 capitalize text-xs">
                        {quiz.language}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full capitalize text-xs ${
                        quiz.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' : 
                        quiz.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {quiz.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 md:mb-4">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{quiz.estimated_time} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles size={12} />
                        <span>5 questions</span>
                      </div>
                    </div>
                    <button 
                      className="w-full py-1.5 md:py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition text-sm font-medium disabled:opacity-50" 
                      disabled={startingQuizId === quiz.id}
                    >
                      {startingQuizId === quiz.id ? (
                        <Loader2 size={16} className="animate-spin inline mr-2" />
                      ) : null}
                      {startingQuizId === quiz.id ? 'Starting...' : 'Start Quiz'}
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Pagination - Responsive text links */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 md:gap-6 mt-6 md:mt-8 text-xs md:text-sm">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`text-gray-400 hover:text-white transition ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Previous
                  </button>
                  <span className="text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`text-gray-400 hover:text-white transition ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-center py-8 md:py-12">
              <Code size={40} className="md:text-[48px] mx-auto text-gray-600 mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-medium text-white mb-1 md:mb-2">No quizzes found</h3>
              <p className="text-xs md:text-sm text-gray-500">Try selecting a different language or concept.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}