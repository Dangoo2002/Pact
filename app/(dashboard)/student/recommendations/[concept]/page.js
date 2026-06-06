'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Video, FileText, Code, ExternalLink, Clock, ChevronLeft, BookOpen,
  Menu, User, LogOut, LayoutDashboard, Target, Sparkles, Loader2, 
  CheckCircle, XCircle, ArrowRight, Star, Youtube, Book, Globe
} from 'lucide-react';
import { signOut } from 'next-auth/react';

// Star Background Component
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

// Sidebar Component
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
                <Icon size={18} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{session?.user?.name || 'Student'}</p>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

// Resource type icons and colors
const typeIcons = {
  video: Video,
  article: FileText,
  exercise: Code,
  interactive: Code,
  documentation: FileText,
  tutorial: Book,
  course: Globe,
  youtube: Youtube
};

const typeColors = {
  video: 'bg-red-500/20 text-red-400 border-red-500/30',
  article: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  exercise: 'bg-green-500/20 text-green-400 border-green-500/30',
  interactive: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  documentation: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  tutorial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  course: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  youtube: 'bg-red-500/20 text-red-400 border-red-500/30'
};

export default function RecommendationDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const concept = params.concept;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState(null);
  const [studentPerformance, setStudentPerformance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    if (concept) {
      fetchResources();
      fetchStudentPerformance();
    }
  }, [session, concept]);

  const fetchStudentPerformance = async () => {
    try {
      const response = await fetch(`/api/student/performance?studentId=${session.user.id}&concept=${concept}`);
      const data = await response.json();
      setStudentPerformance(data);
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ai/resources?concept=${encodeURIComponent(concept)}&studentId=${session.user.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResources(data.resources || []);
      setAiSummary(data.summary || `Resources to help you master ${concept}`);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      setError(error.message);
      // Set fallback resources based on concept
      setResources(getFallbackResources(concept));
      setAiSummary(`Learning resources for ${concept}. Complete quizzes to get personalized AI recommendations.`);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackResources = (conceptName) => {
    const formattedConcept = conceptName.replace(/_/g, ' ');
    return [
      {
        title: `${formattedConcept} Tutorial for Beginners`,
        type: "tutorial",
        url: `https://www.w3schools.com/python/python_${conceptName.toLowerCase()}.asp`,
        description: `Learn the fundamentals of ${formattedConcept} with examples and practice exercises.`,
        duration_minutes: 30,
        difficulty: "beginner"
      },
      {
        title: `${formattedConcept} Explained in 10 Minutes`,
        type: "youtube",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(formattedConcept)}+programming+tutorial`,
        description: `Quick video tutorial covering the basics of ${formattedConcept}.`,
        duration_minutes: 10,
        difficulty: "beginner"
      },
      {
        title: `Practice ${formattedConcept} with Interactive Exercises`,
        type: "exercise",
        url: `/student/quizzes?concept=${conceptName}`,
        description: `Test your knowledge with interactive coding exercises on ${formattedConcept}.`,
        duration_minutes: 45,
        difficulty: "intermediate"
      }
    ];
  };

  const formatConceptName = (name) => {
    if (!name) return '';
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleResourceClick = async (resource) => {
    // Log engagement
    try {
      await fetch('/api/student/log-engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: session.user.id,
          resourceId: resource.title,
          concept: concept,
          action: 'click'
        })
      });
    } catch (error) {
      console.error('Failed to log engagement:', error);
    }
    
    // Open URL in new tab
    if (resource.url && resource.url !== '#') {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="ml-3 text-gray-400">AI is curating personalized resources...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[#0A1628]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm text-white hidden sm:inline">
                  {session?.user?.name?.split(' ')[0] || 'Student'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {/* Back Button */}
          <Link 
            href="/student/recommendations" 
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition" />
            Back to Recommendations
          </Link>

          {/* Concept Title */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-4xl font-bold text-white capitalize">
              Master {formatConceptName(concept)}
            </h1>
            <p className="text-gray-400 mt-2">
              AI-powered learning resources tailored to your knowledge gaps
            </p>
          </div>

          {/* Performance Summary */}
          {studentPerformance && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400">Your Performance</p>
                  <p className="text-2xl font-bold text-white">
                    {studentPerformance.correct_count || 0}/{studentPerformance.total_count || 0} correct
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {studentPerformance.accuracy || 0}% accuracy on {formatConceptName(concept)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link href={`/student/quizzes?concept=${concept}`}>
                    <button className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition flex items-center gap-2">
                      <Code size={16} />
                      Practice More
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* AI Summary */}
          {aiSummary && (
            <div className="bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Sparkles size={20} className="text-purple-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-400 mb-1">AI Analysis</p>
                  <p className="text-gray-300">{aiSummary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Resources Grid */}
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Star size={18} className="text-yellow-400" />
            Recommended Learning Resources
          </h2>

          {resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((resource, idx) => {
                const Icon = typeIcons[resource.type] || FileText;
                const colorClass = typeColors[resource.type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                
                return (
                  <div 
                    key={idx} 
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon size={18} />
                        </div>
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
                      
                      <h3 className="font-semibold text-white mb-2">{resource.title}</h3>
                      <p className="text-sm text-gray-400 mb-4">{resource.description}</p>
                      
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
                        onClick={() => handleResourceClick(resource)}
                        className="w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition flex items-center justify-center gap-2 group"
                      >
                        <span>Access Resource</span>
                        <ExternalLink size={14} className="group-hover:translate-x-0.5 transition" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-center py-12">
              <FileText size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No resources found</h3>
              <p className="text-sm text-gray-500 mb-4">
                Complete a quiz on {formatConceptName(concept)} to get personalized AI recommendations
              </p>
              <Link href={`/student/quizzes?concept=${concept}`}>
                <button className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition flex items-center gap-2 mx-auto">
                  <Code size={16} />
                  Take a Quiz
                </button>
              </Link>
            </div>
          )}

          {/* Study Tips Section */}
          {resources.length > 0 && (
            <div className="mt-8 p-5 bg-gradient-to-r from-blue-500/5 to-purple-500/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-400" />
                Study Tips for Success
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <ArrowRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Watch video tutorials first to understand the concept visually</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Practice with interactive exercises to reinforce your learning</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Take the quiz again after reviewing resources to track improvement</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}