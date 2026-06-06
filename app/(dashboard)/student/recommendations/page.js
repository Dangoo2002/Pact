'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Video, FileText, Code, ExternalLink, ThumbsUp, Clock, 
  Menu, User, LogOut, Bell, Sparkles, Star, Filter,
  BookOpen, Target, LayoutDashboard, GraduationCap, Bot, Loader2, ChevronLeft,
  Brain, TrendingUp, Award, CheckCircle, AlertCircle, Zap, Flame, Medal,
  LineChart, PieChart, Send, X, HelpCircle, Hexagon, MessageCircle, ChevronRight
} from 'lucide-react';
import { signOut } from 'next-auth/react';

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

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const RecommendationsSkeleton = () => (
  <div className="pt-20 px-4 md:px-6 pb-6 animate-pulse">
    {/* Header Skeleton */}
    <div className="mb-6">
      <div className="h-8 w-64 bg-white/10 rounded mb-2" />
      <div className="h-4 w-96 bg-white/5 rounded" />
    </div>

    {/* Analysis Summary Skeleton */}
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-4 w-24 bg-white/10 rounded mb-2" />
          <div className="h-6 w-32 bg-white/10 rounded mb-2" />
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-white/10 rounded-full" />
            <div className="h-5 w-16 bg-white/10 rounded-full" />
          </div>
        </div>
        <div className="h-3 w-32 bg-white/5 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
        <div>
          <div className="h-3 w-16 bg-white/10 rounded mb-2" />
          <div className="space-y-1">
            <div className="h-3 w-48 bg-white/5 rounded" />
            <div className="h-3 w-40 bg-white/5 rounded" />
          </div>
        </div>
        <div>
          <div className="h-3 w-24 bg-white/10 rounded mb-2" />
          <div className="space-y-1">
            <div className="h-3 w-52 bg-white/5 rounded" />
            <div className="h-3 w-44 bg-white/5 rounded" />
          </div>
        </div>
      </div>
    </div>

    {/* Resources Grid Skeleton - 6 cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="h-10 w-10 bg-white/10 rounded-lg" />
            <div className="h-5 w-16 bg-white/10 rounded-full" />
          </div>
          <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />
          <div className="h-4 w-full bg-white/5 rounded mb-2" />
          <div className="h-4 w-2/3 bg-white/5 rounded mb-4" />
          <div className="flex items-center gap-3 mb-4">
            <div className="h-3 w-16 bg-white/5 rounded" />
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
          <div className="h-9 w-full bg-white/10 rounded-lg" />
        </div>
      ))}
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
      
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628] backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
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
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Student'}</p>
                <p className="text-xs text-gray-500 capitalize truncate">{role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Resource Card Component ──────────────────────────────────────────────────
const typeIcons = {
  video: Video,
  article: FileText,
  exercise: Code,
  interactive: Code,
  documentation: FileText,
  tutorial: BookOpen,
  youtube: Video,
  course: GraduationCap,
};

const typeColors = {
  video: 'bg-red-500/20 text-red-400 border-red-500/30',
  article: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  exercise: 'bg-green-500/20 text-green-400 border-green-500/30',
  interactive: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  documentation: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  tutorial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  course: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  youtube: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const ResourceCard = ({ resource, onClick }) => {
  const Icon = typeIcons[resource.type] || FileText;
  const colorClass = typeColors[resource.type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 group">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon size={18} />
          </div>
          {resource.priority === 'high' && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
              High Priority
            </span>
          )}
          {resource.difficulty && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              resource.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
              resource.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {resource.difficulty}
            </span>
          )}
        </div>
        
        <h3 className="font-semibold text-white mb-2 line-clamp-2">{resource.title}</h3>
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{resource.description}</p>
        
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          {resource.duration_minutes && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{resource.duration_minutes} min</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <BookOpen size={12} />
            <span className="capitalize">{resource.type}</span>
          </div>
        </div>
        
        <button 
          onClick={() => onClick(resource)}
          className="w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition flex items-center justify-center gap-2 group"
        >
          <span>Access Resource</span>
          <ExternalLink size={14} className="group-hover:translate-x-0.5 transition" />
        </button>
      </div>
    </div>
  );
};

// ─── Get Greeting Helper ──────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RecommendationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysisInfo, setAnalysisInfo] = useState(null);
  const [error, setError] = useState(null);
  const [dataReady, setDataReady] = useState(false);

  // Auth guard
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.id) {
      fetchRecommendations();
    }
  }, [status, session?.user?.id, sessionId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/student/recommendations?studentId=${session.user.id}`;
      if (sessionId) {
        url += `&sessionId=${sessionId}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        // Process recommendations to ensure exactly 6 cards (4 resources + 2 exercises)
        let allRecommendations = data.recommendations || [];
        
        // Separate resources and exercises
        const resources = allRecommendations.filter(r => r.type !== 'exercise');
        const exercises = allRecommendations.filter(r => r.type === 'exercise');
        
        // Take top 4 resources and top 2 exercises
        const finalResources = resources.slice(0, 4);
        const finalExercises = exercises.slice(0, 2);
        
        // If we don't have enough resources, generate fallback ones
        let combined = [...finalResources, ...finalExercises];
        
        // Ensure we have exactly 6 items
        while (combined.length < 6) {
          combined.push({
            id: `fallback_${combined.length}`,
            title: `Practice ${analysisInfo?.concept || 'Programming'} Concepts`,
            type: 'exercise',
            url: `/student/quizzes?concept=${analysisInfo?.concept || ''}`,
            description: `Complete interactive exercises to strengthen your understanding.`,
            priority: 'medium',
            duration_minutes: 30,
            difficulty: 'beginner'
          });
        }
        
        setRecommendations(combined);
        setAnalysisInfo({
          concept: data.concept,
          mastery_level: data.mastery_level,
          accuracy: data.accuracy,
          strengths: data.strengths || [],
          weaknesses: data.weaknesses || [],
          session_id: data.session_id,
          generated_at: data.generated_at
        });
      } else {
        setError(data.message || 'Failed to fetch recommendations');
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setDataReady(true);
    }
  };

  const handleResourceClick = async (resource) => {
    try {
      await fetch('/api/student/log-engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: session.user.id,
          resourceId: resource.id || resource.title,
          concept: analysisInfo?.concept,
          action: 'click'
        })
      });
    } catch (error) {
      console.error('Failed to log engagement:', error);
    }
    
    if (resource.url && resource.url !== '#') {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatConceptName = (name) => {
    if (!name) return '';
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Auth loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const greeting = getGreeting();
  const studentName = session?.user?.name?.split(' ')[0] || 'Student';

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        {/* Fixed Header with Welcome */}
        <div className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
            >
              <Menu size={20} className="text-white" />
            </button>
            
            {/* Welcome Section in Header */}
            <div className="flex-1 ml-2 md:ml-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">
                {greeting}, {studentName}!
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                AI-powered personalized learning recommendations
              </p>
            </div>

            {/* Notification Bell */}
            <button className="p-2 rounded-lg hover:bg-white/10 transition relative">
              <Bell size={18} className="text-gray-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Content Area with proper spacing */}
        <div className="pt-20 px-4 md:px-6 pb-6">
          {/* Back button if coming from a quiz */}
          {sessionId && (
            <Link href={`/student/quiz/${sessionId}`} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4 transition">
              <ChevronLeft size={16} /> Back to Quiz Results
            </Link>
          )}

          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Personalized Recommendations</h1>
            <p className="text-sm text-gray-400 mt-1">
              {sessionId ? 'AI-powered resources based on your recent quiz' : 'Tailored learning resources to close your knowledge gaps'}
            </p>
          </div>

          {/* Show skeleton while loading */}
          {!dataReady || loading ? (
            <RecommendationsSkeleton />
          ) : (
            <>
              {/* Analysis Summary Card */}
              {analysisInfo && analysisInfo.concept && (
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Quiz Analysis</p>
                      <p className="text-lg font-semibold text-white capitalize">
                        {formatConceptName(analysisInfo.concept)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          analysisInfo.mastery_level === 'advanced' ? 'bg-green-500/20 text-green-400' :
                          analysisInfo.mastery_level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {analysisInfo.mastery_level || 'beginner'} level
                        </span>
                        {analysisInfo.accuracy && (
                          <span className="text-xs text-gray-400">Accuracy: {Math.round(analysisInfo.accuracy)}%</span>
                        )}
                      </div>
                    </div>
                    {analysisInfo.generated_at && (
                      <p className="text-xs text-gray-500">Analyzed: {formatDate(analysisInfo.generated_at)}</p>
                    )}
                  </div>
                  
                  {/* Strengths and Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                    {analysisInfo.strengths && analysisInfo.strengths.length > 0 && (
                      <div>
                        <p className="text-xs text-green-400 mb-2 flex items-center gap-1">
                          <ThumbsUp size={12} /> Strengths
                        </p>
                        <ul className="space-y-1">
                          {analysisInfo.strengths.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-xs text-gray-400">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysisInfo.weaknesses && analysisInfo.weaknesses.length > 0 && (
                      <div>
                        <p className="text-xs text-red-400 mb-2 flex items-center gap-1">
                          <Target size={12} /> Areas to Improve
                        </p>
                        <ul className="space-y-1">
                          {analysisInfo.weaknesses.slice(0, 3).map((w, i) => (
                            <li key={i} className="text-xs text-gray-400">• {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Resources Grid - Exactly 6 cards */}
              {recommendations.length > 0 ? (
                <>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles size={18} className="text-yellow-400" />
                    Recommended Learning Resources
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.map((rec, idx) => (
                      <ResourceCard key={idx} resource={rec} onClick={handleResourceClick} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No recommendations yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {sessionId 
                      ? 'Click "Save & Get AI Recommendations" on your quiz results page first'
                      : 'Complete a quiz to get personalized AI-powered recommendations'}
                  </p>
                  <Link href="/student/quizzes">
                    <button className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition">
                      Take a Quiz
                    </button>
                  </Link>
                </div>
              )}

              {/* Study Tips Section */}
              {recommendations.length > 0 && (
                <div className="mt-8 p-5 bg-gradient-to-r from-blue-500/5 to-purple-500/5 backdrop-blur-sm border border-white/10 rounded-xl">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-400" />
                    Study Tips for Success
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Start with high-priority recommendations to address your biggest knowledge gaps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Complete the practice exercises to reinforce what you've learned</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Retake the quiz after reviewing resources to track your improvement</span>
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}