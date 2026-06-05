'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { 
  User, Mail, Save, Loader2
} from 'lucide-react';

// 1. Ensure the component accepts NO props, or explicitly destructures an empty object {}
export default function StudentProfilePage() { 
  const { data: session } = useSession();
  
  const [formData, setFormData] = useState({ 
    fullName: session?.user?.name || '', 
    email: session?.user?.email || '', 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  
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

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">My Profile</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your account settings</p>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-4 pb-4 border-b border-white/10 mb-6">
          <div className="p-3 rounded-full bg-blue-500/20">
            <User size={28} className="text-blue-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">{session?.user?.name || 'Student'}</h2>
            <p className="text-sm text-gray-500 capitalize">{session?.user?.role}</p>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                name="fullName" 
                value={formData.fullName} 
                onChange={handleChange} 
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" 
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" 
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="font-medium text-white mb-4">Change Password</h3>
            <div className="space-y-3">
              <input 
                type="password" 
                name="currentPassword" 
                placeholder="Current password" 
                value={formData.currentPassword} 
                onChange={handleChange} 
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" 
              />
              <input 
                type="password" 
                name="newPassword" 
                placeholder="New password" 
                value={formData.newPassword} 
                onChange={handleChange} 
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" 
              />
              <input 
                type="password" 
                name="confirmPassword" 
                placeholder="Confirm new password" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}