'use client';

import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, Mail, Save, Code, Menu, LogOut, Bell,
  GraduationCap, Calendar, Award, Sparkles
} from 'lucide-react';
import { signOut } from 'next-auth/react';

// Static star background
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
        <div className="p-4 border-b border-white/10"><div className="flex items-center gap-2"><div className="bg-blue-500/20 p-2 rounded-xl"><Code className="h-5 w-5 text-blue-400" /></div><span className="text-xl font-bold text-white">PACT</span></div><p className="text-xs text-gray-500 mt-2">Student Portal</p></div>
        <nav className="p-3 space-y-1">{navItems.map((item) => { const Icon = item.icon; return (<Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"><Icon size={18} /><span className="text-sm">{item.label}</span></Link>); })}</nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10"><div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><User className="h-4 w-4 text-blue-400" /></div><div className="flex-1"><p className="text-sm font-medium text-white">{session?.user?.name || 'Student'}</p><p className="text-xs text-gray-500 capitalize">{role}</p></div></div><button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"><LogOut size={16} />Sign Out</button></div>
      </div>
    </>
  );
};

export default function StudentProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({ fullName: session?.user?.name || '', email: session?.user?.email || '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }
    // TODO: Implement API call to update profile
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setLoading(false);
    }, 1000);
  };

  if (!session) { router.push('/login'); return null; }

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:ml-64">
        <div className="sticky top-0 z-30 bg-[#0A1628]/80 backdrop-blur-xl border-b border-white/10"><div className="flex items-center justify-between px-4 py-3 md:px-6"><button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10"><Menu size={20} /></button><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><User className="h-4 w-4 text-blue-400" /></div><span className="text-sm text-white hidden sm:inline">{session?.user?.name?.split(' ')[0] || 'Student'}</span></div></div></div>
        <div className="p-4 md:p-6"><div className="max-w-2xl mx-auto"><div className="mb-6"><h1 className="text-2xl md:text-3xl font-bold text-white">My Profile</h1><p className="text-sm text-gray-400 mt-1">Manage your account settings</p></div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-4 pb-4 border-b border-white/10 mb-6"><div className="p-3 rounded-full bg-blue-500/20"><User size={28} className="text-blue-400" /></div><div><h2 className="font-semibold text-white">{session?.user?.name || 'Student'}</h2><p className="text-sm text-gray-500 capitalize">{session?.user?.role}</p></div></div>
            {message && <div className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>{message.text}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-sm font-medium text-gray-300 mb-1 block">Full Name</label><div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" /></div></div>
              <div><label className="text-sm font-medium text-gray-300 mb-1 block">Email Address</label><div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" /></div></div>
              <div className="pt-4 border-t border-white/10"><h3 className="font-medium text-white mb-4">Change Password</h3><div className="space-y-3"><input type="password" name="currentPassword" placeholder="Current password" value={formData.currentPassword} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" /><input type="password" name="newPassword" placeholder="New password" value={formData.newPassword} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" /><input type="password" name="confirmPassword" placeholder="Confirm new password" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" /></div></div>
              <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition flex items-center justify-center gap-2">{loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{loading ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </div>
        </div></div>
      </div>
    </div>
  );
}

import { LayoutDashboard, Target, BookOpen, Loader2 } from 'lucide-react';