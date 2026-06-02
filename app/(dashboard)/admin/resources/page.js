// app/admin/resources/page.js
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, BookOpen, Search, Plus, Video, FileText, 
  ExternalLink, Edit, Trash2, Menu, X, Bell, 
  LogOut, Loader2, LayoutDashboard, Users, Settings,
  Star, StarHalf, Sparkles, Filter, XCircle, CheckCircle,
  User
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
            <div className="bg-green-500/20 p-2 rounded-xl"><Code className="h-5 w-5 text-green-400" /></div>
            <span className="text-xl font-bold text-white">PACT</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Admin Portal</p>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
                <Icon size={18} /><span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"><User className="h-4 w-4 text-green-400" /></div>
            <div className="flex-1"><p className="text-sm font-medium text-white">{session?.user?.name || 'Admin'}</p><p className="text-xs text-gray-500 capitalize">{role}</p></div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-sm"><LogOut size={16} /> Sign Out</button>
        </div>
      </div>
    </>
  );
};

// Resource Card Component
const ResourceCard = ({ resource, onEdit, onDelete }) => {
  const getResourceIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'video': return <Video size={16} className="text-red-400" />;
      case 'article': return <FileText size={16} className="text-blue-400" />;
      default: return <BookOpen size={16} className="text-green-400" />;
    }
  };

  const renderStars = (score) => {
    const stars = [];
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={12} className="fill-yellow-500 text-yellow-500" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" size={12} className="fill-yellow-500 text-yellow-500" />);
    }
    return stars;
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-green-500/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-white/10">
            {getResourceIcon(resource.resource_type)}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white line-clamp-1">{resource.title}</h3>
            <p className="text-xs text-gray-500 capitalize">{resource.resource_type}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(resource)} className="p-1 hover:bg-white/10 rounded transition">
            <Edit size={14} className="text-blue-400" />
          </button>
          <button onClick={() => onDelete(resource.resource_id)} className="p-1 hover:bg-white/10 rounded transition">
           <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>
      
      {resource.url && (
        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:underline flex items-center gap-1 mb-2">
          <ExternalLink size={12} /> View Resource
        </a>
      )}
      
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-1">
          {renderStars(resource.quality_score || 0.5)}
          <span className="text-xs text-gray-500 ml-1">{((resource.quality_score || 0.5) * 100).toFixed(0)}%</span>
        </div>
        {resource.difficulty_level && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
            Level {resource.difficulty_level}
          </span>
        )}
      </div>
    </div>
  );
};

export default function AdminResourcesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    resource_type: 'video',
    url: '',
    difficulty_level: 3,
    quality_score: 0.7,
    concept_ids: [],
    language_id: null
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetchResources();
  }, [session, status, router]);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/admin/resources');
      const data = await response.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowAddModal(false);
        setFormData({ title: '', resource_type: 'video', url: '', difficulty_level: 3, quality_score: 0.7, concept_ids: [], language_id: null });
        fetchResources();
      }
    } catch (error) {
      console.error('Failed to add resource:', error);
    }
  };

  const handleUpdateResource = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/resources/${editingResource.resource_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setEditingResource(null);
        setFormData({ title: '', resource_type: 'video', url: '', difficulty_level: 3, quality_score: 0.7, concept_ids: [], language_id: null });
        fetchResources();
      }
    } catch (error) {
      console.error('Failed to update resource:', error);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      try {
        const response = await fetch(`/api/admin/resources/${resourceId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchResources();
        }
      } catch (error) {
        console.error('Failed to delete resource:', error);
      }
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchesType = filterType === 'all' || r.resource_type === filterType;
    return matchesSearch && matchesType;
  });

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
      
      <div className="md:ml-64">
        <div className="sticky top-0 z-30 bg-[#0A1628]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10"><Menu size={20} /></button>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-white/10 relative"><Bell size={18} /><span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span></button>
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"><User className="h-4 w-4 text-green-400" /></div><span className="text-sm text-white hidden sm:inline">{session?.user?.name?.split(' ')[0] || 'Admin'}</span></div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Resource Library</h1>
              <p className="text-sm text-gray-400 mt-1">Manage learning resources</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition flex items-center gap-2 text-sm">
              <Plus size={16} /> Add Resource
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'video', 'article', 'interactive'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-2 rounded-lg text-sm transition ${
                    filterType === type
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.resource_id}
                resource={resource}
                onEdit={(res) => {
                  setEditingResource(res);
                  setFormData({
                    title: res.title,
                    resource_type: res.resource_type,
                    url: res.url || '',
                    difficulty_level: res.difficulty_level || 3,
                    quality_score: res.quality_score || 0.7,
                    concept_ids: res.concept_ids || [],
                    language_id: res.language_id
                  });
                }}
                onDelete={handleDeleteResource}
              />
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <BookOpen size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-500">No resources found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Resource Modal */}
      {(showAddModal || editingResource) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A1628] border border-white/10 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">{editingResource ? 'Edit Resource' : 'Add Resource'}</h2>
            <form onSubmit={editingResource ? handleUpdateResource : handleAddResource} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Resource Type</label>
                <select
                  value={formData.resource_type}
                  onChange={(e) => setFormData({...formData, resource_type: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50"
                >
                  <option value="video">Video</option>
                  <option value="article">Article</option>
                  <option value="interactive">Interactive</option>
                  <option value="documentation">Documentation</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Difficulty Level (1-5)</label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({...formData, difficulty_level: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50"
                >
                  <option value="1">Beginner (1)</option>
                  <option value="2">Easy (2)</option>
                  <option value="3">Intermediate (3)</option>
                  <option value="4">Advanced (4)</option>
                  <option value="5">Expert (5)</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Quality Score (0.1 - 1.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1.0"
                  value={formData.quality_score}
                  onChange={(e) => setFormData({...formData, quality_score: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition text-sm">
                  {editingResource ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => {
                  setShowAddModal(false);
                  setEditingResource(null);
                  setFormData({ title: '', resource_type: 'video', url: '', difficulty_level: 3, quality_score: 0.7, concept_ids: [], language_id: null });
                }} className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}