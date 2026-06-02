// app/admin/settings/page.js
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, Shield, Bell, Database, Globe, Save, 
  Menu, X, LogOut, User, Loader2, CheckCircle,
  AlertCircle, RefreshCw, LayoutDashboard, Users, BookOpen,
  Settings, Moon, Sun, Smartphone, Laptop, Key, Mail, Lock
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
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/resources', label: 'Resources', icon: BookOpen },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628]/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="bg-green-500/20 p-2 rounded-xl">
              <Code className="h-5 w-5 text-green-400" />
            </div>
            <span className="text-xl font-bold text-white">PACT</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Admin Portal</p>
        </div>
        
        <nav className="p-3 space-y-1">
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
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <User className="h-4 w-4 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{session?.user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

// Toggle Switch Component
const ToggleSwitch = ({ enabled, onChange, label, description }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
          enabled ? 'bg-green-500' : 'bg-gray-600'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 ${
            enabled ? 'right-0.5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
};

// Settings Card Component
const SettingsCard = ({ title, icon: Icon, children, color = 'green' }) => {
  const colorClasses = {
    green: 'border-green-500/30',
    blue: 'border-blue-500/30',
    purple: 'border-purple-500/30',
    orange: 'border-orange-500/30'
  };

  return (
    <div className={`bg-white/5 backdrop-blur-sm border ${colorClasses[color]} rounded-xl p-4 md:p-5 hover:border-${color}-500/40 transition-all duration-300`}>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
        <div className={`p-2 rounded-lg bg-${color}-500/20`}>
          <Icon size={18} className={`text-${color}-400`} />
        </div>
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-400" />,
    error: <AlertCircle className="h-5 w-5 text-red-400" />,
    info: <AlertCircle className="h-5 w-5 text-blue-400" />
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl backdrop-blur-md border ${
        type === 'success' ? 'bg-green-500/20 border-green-500/30' :
        type === 'error' ? 'bg-red-500/20 border-red-500/30' :
        'bg-blue-500/20 border-blue-500/30'
      }`}>
        {icons[type]}
        <p className="text-sm text-white">{message}</p>
      </div>
    </div>
  );
};

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'PACT - Personalized Adaptive Coding Tutor',
    siteDescription: 'AI-powered personalized learning platform for programming education',
    adminEmail: 'admin@pact.com',
    defaultLanguage: 'python',
    
    // Security Settings
    enableRegistration: true,
    requireEmailVerification: false,
    maintenanceMode: false,
    apiRateLimit: 100,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    
    // Notification Settings
    emailNotifications: true,
    systemAlerts: true,
    weeklyReports: true,
    
    // Appearance Settings
    theme: 'dark',
    animationsEnabled: true,
    
    // API Settings
    deepseekApiKey: '',
    deepseekApiEndpoint: 'https://api.deepseek.com/v1',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetchSettings();
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        setToast({ message: 'Settings saved successfully!', type: 'success' });
      } else {
        setToast({ message: 'Failed to save settings', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Error saving settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="md:ml-64">
        {/* Navbar */}
        <div className="sticky top-0 z-30 bg-[#0A1628]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-white/10 relative">
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-green-400" />
                </div>
                <span className="text-sm text-white hidden sm:inline">{session?.user?.name?.split(' ')[0] || 'Admin'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">System Settings</h1>
            <p className="text-sm text-gray-400 mt-1">Configure system-wide settings and preferences</p>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* General Settings */}
            <SettingsCard title="General Settings" icon={Globe} color="green">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Site Description</label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => handleChange('siteDescription', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50 resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Admin Email</label>
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => handleChange('adminEmail', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Default Programming Language</label>
                <select
                  value={settings.defaultLanguage}
                  onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50"
                >
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                  <option value="csharp">C#</option>
                  <option value="cpp">C++</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </select>
              </div>
            </SettingsCard>

            {/* Security Settings */}
            <SettingsCard title="Security Settings" icon={Shield} color="blue">
              <ToggleSwitch
                enabled={settings.enableRegistration}
                onChange={() => handleChange('enableRegistration', !settings.enableRegistration)}
                label="Enable Public Registration"
                description="Allow new users to register on the platform"
              />
              <ToggleSwitch
                enabled={settings.requireEmailVerification}
                onChange={() => handleChange('requireEmailVerification', !settings.requireEmailVerification)}
                label="Require Email Verification"
                description="Users must verify their email before accessing content"
              />
              <ToggleSwitch
                enabled={settings.maintenanceMode}
                onChange={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
                label="Maintenance Mode"
                description="Put the site into maintenance mode"
              />
              <div>
                <label className="text-sm text-gray-400 mb-1 block">API Rate Limit (requests per minute)</label>
                <input
                  type="number"
                  value={settings.apiRateLimit}
                  onChange={(e) => handleChange('apiRateLimit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Max Login Attempts</label>
                <input
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
            </SettingsCard>

            {/* Notification Settings */}
            <SettingsCard title="Notification Settings" icon={Bell} color="purple">
              <ToggleSwitch
                enabled={settings.emailNotifications}
                onChange={() => handleChange('emailNotifications', !settings.emailNotifications)}
                label="Email Notifications"
                description="Send email notifications for important events"
              />
              <ToggleSwitch
                enabled={settings.systemAlerts}
                onChange={() => handleChange('systemAlerts', !settings.systemAlerts)}
                label="System Alerts"
                description="Show system alert notifications"
              />
              <ToggleSwitch
                enabled={settings.weeklyReports}
                onChange={() => handleChange('weeklyReports', !settings.weeklyReports)}
                label="Weekly Reports"
                description="Send weekly summary reports to admins"
              />
            </SettingsCard>

            {/* API Settings */}
            <SettingsCard title="API Settings" icon={Database} color="orange">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">DeepSeek API Key</label>
                <input
                  type="password"
                  value={settings.deepseekApiKey}
                  onChange={(e) => handleChange('deepseekApiKey', e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">DeepSeek API Endpoint</label>
                <input
                  type="url"
                  value={settings.deepseekApiEndpoint}
                  onChange={(e) => handleChange('deepseekApiEndpoint', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
            </SettingsCard>
          </div>

          {/* Save Button */}
          <div className="flex justify-end sticky bottom-4 z-20">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}