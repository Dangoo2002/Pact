'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Video, FileText, Code, ExternalLink, ThumbsUp, Clock, 
  Menu, User, LogOut, Bell, Sparkles, Star, Filter,
  BookOpen, Target, LayoutDashboard, GraduationCap, Bot, Loader2
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { fetchRecommendations, logEngagement } from '@/lib/api';

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

const typeIcons = {
  video: Video,
  article: FileText,
  exercise: Code,
  interactive: Code,
  documentation: FileText,
};

const typeColors = {
  video: 'bg-red-500/20 text-red-400',
  article: 'bg-blue-500/20 text-blue-400',
  exercise: 'bg-green-500/20 text-green-400',
  interactive: 'bg-purple-500/20 text-purple-400',
  documentation: 'bg-gray-500/20 text-gray-400',
};

export default function RecommendationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiExplanations, setAiExplanations] = useState({});
  const [explaining, setExplaining] = useState({});
  const studentId = session?.user?.id;

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [studentId, session, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchRecommendations(studentId, 20);
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAiExplanation = async (concept) => {
    setExplaining(prev => ({ ...prev, [concept]: true }));
    try {
      const response = await fetch('/api/ai/explain-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, studentId, language: 'python' })
      });
      const data = await response.json();
      setAiExplanations(prev => ({ ...prev, [concept]: data.explanation }));
    } catch (error) {
      setAiExplanations(prev => ({ ...prev, [concept]: 'Unable to fetch explanation.' }));
    } finally {
      setExplaining(prev => ({ ...prev, [concept]: false }));
    }
  };

  const handleResourceClick = async (resourceId) => {
    await logEngagement(studentId, resourceId, true, false);
  };

  if (loading) {
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
            <div className="flex items-center gap-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><User className="h-4 w-4 text-blue-400" /></div><span className="text-sm text-white hidden sm:inline">{session?.user?.name?.split(' ')[0] || 'Student'}</span></div></div>
          </div>
        </div>
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Personalized Recommendations</h1>
            <p className="text-sm text-gray-400 mt-1">AI-powered learning resources tailored to your knowledge gaps</p>
          </div>

          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec, idx) => {
                const Icon = typeIcons[rec.type] || FileText;
                const colorClass = typeColors[rec.type] || 'bg-gray-500/20 text-gray-400';
                const concept = rec.concept || rec.title.split(' ')[0].toLowerCase();
                
                return (
                  <div key={idx} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-blue-500/30 transition">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}><Icon size={18} /></div>
                      <div className="flex-1"><h3 className="font-semibold text-white">{rec.title}</h3><p className="text-xs text-gray-500 capitalize">{rec.type}</p></div>
                      {rec.score && (<div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full"><ThumbsUp size={10} /><span>{Math.round(rec.score * 100)}% match</span></div>)}
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{rec.reason || 'Recommended for your learning gaps'}</p>
                    <button onClick={() => getAiExplanation(concept)} className="text-xs text-purple-400 hover:text-purple-300 transition flex items-center gap-1 mb-3">
                      {explaining[concept] ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
                      {explaining[concept] ? 'AI analyzing...' : 'Why this recommendation?'}
                    </button>
                    {aiExplanations[concept] && (<div className="mb-3 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20"><p className="text-xs text-gray-300">{aiExplanations[concept]}</p></div>)}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
                      <a href={rec.url || '#'} target="_blank" rel="noopener noreferrer" onClick={() => handleResourceClick(rec.resource_id)} className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-1">Access Resource <ExternalLink size={14} /></a>
                      {rec.duration && (<div className="flex items-center gap-1 text-xs text-gray-500"><Clock size={12} /><span>{rec.duration} min</span></div>)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-center py-12">
              <FileText size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No recommendations yet</h3>
              <p className="text-sm text-gray-500 mb-4">Complete more quizzes to get AI-powered personalized recommendations</p>
              <Link href="/student/quizzes"><button className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition">Take a Quiz</button></Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}