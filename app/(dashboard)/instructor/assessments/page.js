// app/(dashboard)/instructor/assessments/page.js
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, FileText, Plus, Edit, Trash2, Copy, 
  Menu, X, LogOut, Bell, User, Loader2, 
  LayoutDashboard, Users, Target, Settings,
  Clock, Calendar, Star, TrendingUp, Eye
} from 'lucide-react';
import { signOut } from 'next-auth/react';

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
    { href: '/instructor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/instructor/students', label: 'Students', icon: Users },
    { href: '/instructor/gaps', label: 'Class Gaps', icon: Target },
    { href: '/instructor/assessments', label: 'Assessments', icon: FileText },
    { href: '/instructor/settings', label: 'Settings', icon: Settings },
  ];
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628]/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 border-b border-white/10"><div className="flex items-center gap-2"><div className="bg-purple-500/20 p-2 rounded-xl"><Code className="h-5 w-5 text-purple-400" /></div><span className="text-xl font-bold text-white">PACT</span></div><p className="text-xs text-gray-500 mt-2">Instructor Portal</p></div>
        <nav className="p-3 space-y-1">{navItems.map((item) => { const Icon = item.icon; return (<Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"><Icon size={18} /><span className="text-sm">{item.label}</span></Link>); })}</nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10"><div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center"><User className="h-4 w-4 text-purple-400" /></div><div className="flex-1"><p className="text-sm font-medium text-white">{session?.user?.name || 'Instructor'}</p><p className="text-xs text-gray-500 capitalize">{role}</p></div></div><button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"><LogOut size={16} />Sign Out</button></div>
      </div>
    </>
  );
};

export default function InstructorAssessmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetchAssessments();
  }, [session, status, router]);

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/instructor/assessments');
      const data = await response.json();
      setAssessments(data.assessments || []);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-[#0A1628] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        <div className="sticky top-0 z-30 bg-[#0A1628]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10"><Menu size={20} /></button>
            <div className="flex items-center gap-3"><button className="p-2 rounded-lg hover:bg-white/10 relative"><Bell size={18} /><span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span></button><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center"><User className="h-4 w-4 text-purple-400" /></div><span className="text-sm text-white hidden sm:inline">{session?.user?.name?.split(' ')[0] || 'Instructor'}</span></div></div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <div><h1 className="text-2xl md:text-3xl font-bold text-white">Assessments</h1><p className="text-sm text-gray-400 mt-1">Create and manage quizzes and tests</p></div>
            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition flex items-center gap-2 text-sm"><Plus size={16} /> Create Assessment</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition">
                <div className="flex items-start justify-between mb-3"><div className="p-2 rounded-lg bg-purple-500/20"><FileText size={18} className="text-purple-400" /></div><div className="flex gap-1"><button className="p-1 hover:bg-white/10 rounded"><Edit size={14} className="text-blue-400" /></button><button className="p-1 hover:bg-white/10 rounded"><Trash2 size={14} className="text-red-400" /></button></div></div>
                <h3 className="font-semibold text-white mb-1">{assessment.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{assessment.description}</p>
                <div className="flex flex-wrap gap-2 mb-3"><span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">{assessment.questionCount} questions</span><span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">{assessment.duration} min</span></div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10"><span className="text-xs text-gray-500">Due: {assessment.dueDate}</span><button className="text-xs text-purple-400 hover:text-purple-300">View Details →</button></div>
              </div>
            ))}
          </div>

          {assessments.length === 0 && (<div className="text-center py-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl"><FileText size={48} className="mx-auto text-gray-600 mb-4" /><p className="text-gray-500">No assessments created yet.</p><button onClick={() => setShowCreateModal(true)} className="mt-4 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition">Create First Assessment</button></div>)}
        </div>
      </div>
    </div>
  );
}