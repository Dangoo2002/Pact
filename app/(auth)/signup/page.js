'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Code, Mail, Lock, User, ArrowRight, GraduationCap, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-400" />,
    error: <XCircle className="h-5 w-5 text-red-400" />,
    info: <AlertCircle className="h-5 w-5 text-blue-400" />
  };

  const bgColors = {
    success: 'bg-green-500/20 border-green-500/30',
    error: 'bg-red-500/20 border-red-500/30',
    info: 'bg-blue-500/20 border-blue-500/30'
  };

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-md border ${bgColors[type]} animate-in slide-in-from-top-5 duration-300`}>
      {icons[type]}
      <p className="text-sm text-white">{message}</p>
    </div>
  );
};

// Static star background component
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

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!fullName || !email || !password || !confirmPassword) {
      showToast('Please fill in all fields', 'error');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Registration failed. Please try again.', 'error');
        setLoading(false);
      } else {
        showToast('Account created successfully! Redirecting to login...', 'success');
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch (err) {
      showToast('Something went wrong. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm md:max-w-md lg:max-w-lg">
          {/* Logo - Smaller on mobile */}
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center justify-center p-2 md:p-3 rounded-2xl bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 mb-3 md:mb-4">
              <Code className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">PACT</h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1">Personalized Adaptive Coding Tutor</p>
          </div>

          {/* Signup Card - More compact */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl md:rounded-2xl p-5 md:p-6">
            <div className="text-center mb-4 md:mb-5">
              <div className="inline-flex p-2 md:p-3 rounded-full bg-blue-500/20 mb-2 md:mb-3">
                <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white">Create Student Account</h2>
              <p className="text-xs md:text-sm text-gray-400">Start your personalized coding journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div>
                <label className="text-xs md:text-sm font-medium text-gray-300 mb-1 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2 text-sm bg-white/5 border border-white/10 rounded-lg md:rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs md:text-sm font-medium text-gray-300 mb-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2 text-sm bg-white/5 border border-white/10 rounded-lg md:rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs md:text-sm font-medium text-gray-300 mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 md:pl-10 pr-9 md:pr-10 py-1.5 md:py-2 text-sm bg-white/5 border border-white/10 rounded-lg md:rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs md:text-sm font-medium text-gray-300 mb-1 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 md:pl-10 pr-9 md:pr-10 py-1.5 md:py-2 text-sm bg-white/5 border border-white/10 rounded-lg md:rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                  >
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-1.5 md:py-2 rounded-lg md:rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={14} className="md:w-4 md:h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs md:text-sm text-gray-500 mt-5 md:mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}