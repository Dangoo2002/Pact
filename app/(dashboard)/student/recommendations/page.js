'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Video, FileText, Code, ExternalLink, ThumbsUp, Clock, 
  Menu, User, LogOut, Bell, Sparkles, Star, Filter,
  BookOpen, Target, LayoutDashboard, GraduationCap, Bot, Loader2, ChevronLeft, Brain,
  Dumbbell, Youtube, Globe, Book, CheckCircle, ArrowRight
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

// ─── Skeleton Screen ──────────────────────────────────────────────────────────
const RecommendationsSkeleton = () => (
  <div className="pt-16 sm:pt-20 px-3 sm:px-4 md:px-6 pb-6 animate-pulse">
    <div className="h-7 w-48 bg-white/10 rounded mb-2" />
    <div className="h-4 w-64 bg-white/5 rounded mb-6" />
    <div className="h-28 bg-white/5 rounded-xl mb-6" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-xl p-4 h-52" />
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
    { href: '/student/gaps', label: 'Knowledge Gaps', icon: Target },
    { href: '/student/quizzes', label: 'Quizzes', icon: BookOpen },
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

// Resource type icons and colors
const typeIcons = {
  video: Video,
  article: FileText,
  exercise: Dumbbell,
  interactive: Code,
  documentation: FileText,
  tutorial: Book,
  course: Globe,
  youtube: Youtube
};

const typeColors = {
  video: 'bg-red-500/20 text-red-400',
  article: 'bg-blue-500/20 text-blue-400',
  exercise: 'bg-green-500/20 text-green-400',
  interactive: 'bg-purple-500/20 text-purple-400',
  documentation: 'bg-gray-500/20 text-gray-400',
  tutorial: 'bg-yellow-500/20 text-yellow-400',
  course: 'bg-indigo-500/20 text-indigo-400',
  youtube: 'bg-red-500/20 text-red-400'
};

export default function RecommendationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const conceptParam = searchParams.get('concept');
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysisInfo, setAnalysisInfo] = useState(null);
  const [error, setError] = useState(null);

  // ── Auth Guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.id) {
      fetchRecommendations();
    }
  }, [session, status, sessionId, conceptParam]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/student/recommendations?studentId=${session.user.id}`;
      if (sessionId) {
        url += `&sessionId=${sessionId}`;
      }
      if (conceptParam) {
        url += `&concept=${encodeURIComponent(conceptParam)}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setRecommendations(data.recommendations || []);
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

  // Separate resources by type
  const learningResources = recommendations.filter(r => r.type !== 'exercise');
  const exercises = recommendations.filter(r => r.type === 'exercise');

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
                Recommendations
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                AI-powered learning resources tailored to you
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
          <RecommendationsSkeleton />
        ) : (
          <div className="pt-16 sm:pt-20 px-3 sm:px-4 md:px-6 pb-6">
            {/* Back button if coming from a quiz */}
            {sessionId && (
              <Link href={`/student/quiz/${sessionId}`} className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-400 hover:text-white mb-4 transition">
                <ChevronLeft size={16} /> Back to Quiz Results
              </Link>
            )}

            {/* Header Section */}
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                Personalized Recommendations
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {sessionId || conceptParam 
                  ? 'AI-powered resources based on your performance'
                  : 'AI-powered learning resources tailored to your knowledge gaps'}
              </p>
            </div>

            {/* Analysis Summary Card */}
            {analysisInfo && analysisInfo.concept && (
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">Quiz Analysis</p>
                    <p className="text-base sm:text-lg font-semibold text-white capitalize">
                      {formatConceptName(analysisInfo.concept)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
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
                          <li key={i} className="text-xs text-gray-400 break-words">• {s}</li>
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
                          <li key={i} className="text-xs text-gray-400 break-words">• {w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Learning Resources Section */}
            {learningResources.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Book size={18} className="text-blue-400" />
                  <h2 className="text-base sm:text-lg font-semibold text-white">Learning Resources</h2>
                  <span className="text-xs text-gray-500 ml-auto">{learningResources.length} resources</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {learningResources.map((rec, idx) => {
                    const Icon = typeIcons[rec.type] || FileText;
                    const colorClass = typeColors[rec.type] || 'bg-gray-500/20 text-gray-400';
                    
                    return (
                      <div 
                        key={idx} 
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 group"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                              <Icon size={18} />
                            </div>
                            {rec.priority === 'high' && (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                                Top Pick
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2">{rec.title}</h3>
                          <p className="text-xs text-gray-400 mb-3 line-clamp-3">{rec.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                            {rec.duration_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock size={10} />
                                <span>{rec.duration_minutes} min</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span className="capitalize">{rec.type}</span>
                            </div>
                          </div>
                          
                          <a 
                            href={rec.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition flex items-center justify-center gap-2 text-sm"
                          >
                            <span>Access Resource</span>
                            <ExternalLink size={14} className="group-hover:translate-x-0.5 transition" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Practice Exercises Section */}
            {exercises.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Dumbbell size={18} className="text-green-400" />
                  <h2 className="text-base sm:text-lg font-semibold text-white">Practice Exercises</h2>
                  <span className="text-xs text-gray-500 ml-auto">{exercises.length} exercises</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {exercises.map((exercise, idx) => {
                    const Icon = Dumbbell;
                    
                    return (
                      <div 
                        key={idx} 
                        className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 backdrop-blur-sm border border-green-500/20 rounded-xl overflow-hidden hover:border-green-500/40 transition-all duration-300 hover:-translate-y-1 group"
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                              <Icon size={18} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-sm">{exercise.title}</h3>
                              <p className="text-xs text-gray-400 mt-1">{exercise.description}</p>
                            </div>
                            {exercise.priority === 'high' && (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                                Recommended
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                            {exercise.duration_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>{exercise.duration_minutes} min</span>
                              </div>
                            )}
                            {exercise.difficulty && (
                              <div className="flex items-center gap-1">
                                <Target size={12} />
                                <span className="capitalize">{exercise.difficulty}</span>
                              </div>
                            )}
                          </div>
                          
                          <Link href={exercise.url}>
                            <button className="w-full py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition flex items-center justify-center gap-2 text-sm">
                              <span>Start Exercise</span>
                              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* No Recommendations State */}
            {recommendations.length === 0 && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-center py-8 sm:py-12">
                <Brain size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No recommendations yet</h3>
                <p className="text-sm text-gray-500 mb-4 px-4">
                  {sessionId || conceptParam 
                    ? 'Complete a quiz and click "Save & Get AI Recommendations" to get personalized resources'
                    : 'Complete a quiz and click "Save & Get AI Recommendations" to get personalized AI-powered recommendations'}
                </p>
                <Link href="/student/quizzes">
                  <button className="px-5 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition text-sm">
                    Take a Quiz
                  </button>
                </Link>
              </div>
            )}

            {/* Study Tips Section */}
            {recommendations.length > 0 && (
              <div className="mt-4 p-4 sm:p-5 bg-gradient-to-r from-blue-500/5 to-purple-500/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <CheckCircle size={18} className="text-green-400" />
                  Recommended Study Plan
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <ArrowRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Start with the learning resources to understand the concepts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Complete the practice exercises to reinforce your learning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Take the quiz again to track your improvement</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}