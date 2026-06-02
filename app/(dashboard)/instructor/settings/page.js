// app/(dashboard)/instructor/settings/page.js
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, User, Mail, Bell, Shield, Save, 
  Menu, X, LogOut, Loader2, LayoutDashboard, 
  Users, Target, FileText, Settings as SettingsIcon,
  Moon, Sun, Globe, Key, CheckCircle, AlertCircle
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
    { href: '/instructor/settings', label: 'Settings', icon: SettingsIcon },
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

export default function InstructorSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notificationsEnabled: true,
    emailNotifications: true
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        fullName: session.user.name || '',
        email: session.user.email || ''
      }));
    }
    setLoading(false);
  }, [session, status, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggle = (key) => {
    setFormData({ ...formData, [key]: !formData[key] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/instructor/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          notificationsEnabled: formData.notificationsEnabled,
          emailNotifications: formData.emailNotifications
        })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings' });
    } finally {
      setSaving(false);
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
          <div className="mb-6"><h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1><p className="text-sm text-gray-400 mt-1">Manage your account preferences</p></div>

          <div className="max-w-2xl mx-auto">
            {message && (<div className={`p-3 rounded-lg mb-4 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>{message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}{message.text}</div>)}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"><h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><User size={18} className="text-purple-400" /> Profile Information</h2><div className="space-y-4"><div><label className="text-sm text-gray-400 mb-1 block">Full Name</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50" /></div><div><label className="text-sm text-gray-400 mb-1 block">Email Address</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50" /></div></div></div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"><h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Key size={18} className="text-purple-400" /> Change Password</h2><div className="space-y-4"><div><label className="text-sm text-gray-400 mb-1 block">Current Password</label><input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50" /></div><div><label className="text-sm text-gray-400 mb-1 block">New Password</label><input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50" /></div><div><label className="text-sm text-gray-400 mb-1 block">Confirm New Password</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50" /></div></div></div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"><h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Bell size={18} className="text-purple-400" /> Notifications</h2><div className="space-y-3"><div className="flex justify-between items-center"><span className="text-sm text-gray-300">Push Notifications</span><button type="button" onClick={() => handleToggle('notificationsEnabled')} className={`w-10 h-5 rounded-full transition ${formData.notificationsEnabled ? 'bg-purple-500' : 'bg-gray-600'}`}><div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.notificationsEnabled ? 'translate-x-5' : 'translate-x-1'}`} /></button></div><div className="flex justify-between items-center"><span className="text-sm text-gray-300">Email Notifications</span><button type="button" onClick={() => handleToggle('emailNotifications')} className={`w-10 h-5 rounded-full transition ${formData.emailNotifications ? 'bg-purple-500' : 'bg-gray-600'}`}><div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.emailNotifications ? 'translate-x-5' : 'translate-x-1'}`} /></button></div></div></div>

              <button type="submit" disabled={saving} className="w-full py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition flex items-center justify-center gap-2">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{saving ? 'Saving...' : 'Save Settings'}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}