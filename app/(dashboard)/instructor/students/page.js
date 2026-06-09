// app/instructor/students/page.jsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code, Users, Search, Menu, LogOut, Bell, User, Loader2, 
  LayoutDashboard, Target, FileText, Settings, Star, AlertCircle, RefreshCw,
  ChevronLeft, ChevronRight, TrendingUp, Clock, Award, Brain, Activity
} from 'lucide-react';
import { signOut } from 'next-auth/react';

// Star Background
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
    { href: '/instructor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/instructor/students', label: 'Students', icon: Users },
    { href: '/instructor/gaps', label: 'Class Gaps', icon: Target },
    { href: '/instructor/assessments', label: 'Assessments', icon: FileText },
    { href: '/instructor/settings', label: 'Settings', icon: Settings },
  ];
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628] backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="bg-purple-500/20 p-2 rounded-xl"><Code className="h-5 w-5 text-purple-400" /></div>
              <span className="text-xl font-bold text-white">PACT</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Instructor Portal</p>
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
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'Instructor'}</p>
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

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 mt-8 mb-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg transition text-sm font-medium ${
          currentPage === 1 
            ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
            : 'bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 hover:scale-105'
        }`}
      >
        <ChevronLeft size={16} />
        <span>Prev</span>
      </button>
      
      <div className="flex items-center gap-1 sm:gap-2 bg-white/5 rounded-lg p-1">
        {getPageNumbers().map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`min-w-[36px] sm:min-w-[40px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
              currentPage === pageNum
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {pageNum}
          </button>
        ))}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg transition text-sm font-medium ${
          currentPage === totalPages 
            ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
            : 'bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 hover:scale-105'
        }`}
      >
        <span>Next</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

// Student Card Component - Fixed mastery formatting
const StudentCard = ({ student, isAtRisk }) => {
  // Safely convert mastery to number
  let masteryValue = 0;
  if (typeof student.mastery === 'number') {
    masteryValue = student.mastery;
  } else if (typeof student.mastery === 'string') {
    masteryValue = parseFloat(student.mastery) || 0;
  } else {
    masteryValue = Number(student.mastery) || 0;
  }
  
  return (
    <div className={`bg-white/5 backdrop-blur-sm border rounded-xl p-4 ${isAtRisk ? 'border-red-500/30' : 'border-white/10'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isAtRisk ? 'bg-red-500/20' : 'bg-purple-500/20'}`}>
          <User size={24} className={isAtRisk ? 'text-red-400' : 'text-purple-400'} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{student.name || 'Student'}</h3>
          <p className="text-xs text-gray-500 truncate">{student.email}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3 pt-2">
        <div className="flex items-center gap-1">
          <Star size={12} className="text-yellow-400" />
          <span className="text-xs text-gray-300">{masteryValue.toFixed(2)}% Mastery</span>
        </div>
        <div className="flex items-center gap-1">
          <Brain size={12} className="text-blue-400" />
          <span className="text-xs text-gray-300">{student.concepts_practiced || 0} Concepts</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp size={12} className="text-green-400" />
          <span className="text-xs text-gray-300">{student.total_quizzes || 0} Quizzes</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} className="text-gray-400" />
          <span className="text-xs text-gray-400">
            {student.last_active ? new Date(student.last_active).toLocaleDateString() : 'Never'}
          </span>
        </div>
      </div>
      
      <div className="flex justify-start items-center pt-2 border-t border-white/10">
        <div className="flex items-center gap-2">
          {student.status === 'active' ? (
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Active</span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">Inactive</span>
          )}
          {isAtRisk && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">At Risk</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Stats Summary Card - Fixed average mastery formatting
const StatsSummary = ({ totalStudents, activeStudents, atRiskCount, averageMastery }) => {
  // Safely convert averageMastery to number
  let avgMasteryValue = 0;
  if (typeof averageMastery === 'number') {
    avgMasteryValue = averageMastery;
  } else if (typeof averageMastery === 'string') {
    avgMasteryValue = parseFloat(averageMastery) || 0;
  } else {
    avgMasteryValue = Number(averageMastery) || 0;
  }
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
        <Users size={18} className="text-purple-400 mx-auto mb-1" />
        <p className="text-xl font-bold text-white">{totalStudents}</p>
        <p className="text-xs text-gray-500">Total Students</p>
      </div>
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
        <Activity size={18} className="text-green-400 mx-auto mb-1" />
        <p className="text-xl font-bold text-white">{activeStudents}</p>
        <p className="text-xs text-gray-500">Active</p>
      </div>
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
        <Brain size={18} className="text-blue-400 mx-auto mb-1" />
        <p className="text-xl font-bold text-white">{avgMasteryValue.toFixed(2)}%</p>
        <p className="text-xs text-gray-500">Avg Mastery</p>
      </div>
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
        <AlertCircle size={18} className="text-red-400 mx-auto mb-1" />
        <p className="text-xl font-bold text-white">{atRiskCount}</p>
        <p className="text-xs text-gray-500">At Risk</p>
      </div>
    </div>
  );
};

export default function InstructorStudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'instructor') {
        router.replace('/student');
        return;
      }
      fetchStudents();
    }
  }, [session, status, router]);

  const fetchStudents = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/instructor/students');
      const data = await response.json();
      
      if (data.students && Array.isArray(data.students)) {
        setStudents(data.students);
      } else {
        console.error('Invalid response format:', data);
        setStudents([]);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const atRiskCount = students.filter(s => {
    let mastery = 0;
    if (typeof s.mastery === 'number') mastery = s.mastery;
    else if (typeof s.mastery === 'string') mastery = parseFloat(s.mastery) || 0;
    else mastery = Number(s.mastery) || 0;
    return mastery < 50;
  }).length;
  
  const averageMastery = students.length > 0 
    ? students.reduce((sum, s) => {
        let mastery = 0;
        if (typeof s.mastery === 'number') mastery = s.mastery;
        else if (typeof s.mastery === 'string') mastery = parseFloat(s.mastery) || 0;
        else mastery = Number(s.mastery) || 0;
        return sum + mastery;
      }, 0) / students.length
    : 0;

  // Filter students based on search
  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        {/* Fixed Header - No welcome title */}
        <div className="fixed top-0 right-0 left-0 md:left-64 z-40 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition">
              <Menu size={20} className="text-white" />
            </button>
            
            <div className="flex-1 ml-2 md:ml-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">
                Students
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={fetchStudents} disabled={refreshing} className="p-2 rounded-lg hover:bg-white/10 transition">
                <RefreshCw size={18} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/10 transition relative">
                <Bell size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area - Starts from top */}
        <div className="pt-16 px-3 sm:px-4 md:px-6 pb-6">
          
          {/* Stats Summary Cards */}
          <StatsSummary 
            totalStudents={totalStudents}
            activeStudents={activeStudents}
            atRiskCount={atRiskCount}
            averageMastery={averageMastery}
          />

          {/* At-Risk Warning Banner */}
          {atRiskCount > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400" />
                <span className="text-sm text-gray-300">{atRiskCount} student(s) need attention (mastery below 50%)</span>
              </div>
              <Link href="/instructor/gaps">
                <button className="text-xs text-red-400 hover:text-red-300">View Details →</button>
              </Link>
            </div>
          )}

          {/* Search Bar */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search students by name or email..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50" 
              />
            </div>
          </div>

          {/* Students Grid */}
          {paginatedStudents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedStudents.map((student) => {
                  let mastery = 0;
                  if (typeof student.mastery === 'number') mastery = student.mastery;
                  else if (typeof student.mastery === 'string') mastery = parseFloat(student.mastery) || 0;
                  else mastery = Number(student.mastery) || 0;
                  const isAtRisk = mastery < 50;
                  
                  return (
                    <StudentCard 
                      key={student.id} 
                      student={student} 
                      isAtRisk={isAtRisk}
                    />
                  );
                })}
              </div>
              
              {/* Pagination */}
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
              
              {/* Page Info */}
              <div className="text-center text-xs text-gray-500 mt-4">
                Showing {filteredStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <Users size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-500">No students found.</p>
              <p className="text-xs text-gray-600 mt-2">
                {search ? 'Try a different search term.' : 'Students will appear here once they register.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}