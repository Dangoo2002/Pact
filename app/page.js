'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Code, Brain, Target, Zap, ArrowRight, Users, 
  Sparkles, BookOpen, Cpu, Award, Menu, X,
  Database, Layout, BarChart3, Infinity,
  Star, Shield, Cloud, Lock
} from 'lucide-react';
import Button from '@/components/ui/Button';

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

// Feature card
const FeatureCard = ({ icon: Icon, title, description, tags }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 transition-all duration-300 h-full">
      <div className="relative p-6">
        <div className="mb-4 inline-flex p-3 rounded-xl bg-white/10 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
        <p className="text-gray-400 text-sm mb-3 leading-relaxed">{description}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded-full bg-white/10 text-blue-400 border border-white/20">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      const role = session.user?.role;
      if (role === 'student') router.push('/student');
      else if (role === 'instructor') router.push('/instructor');
      else if (role === 'admin') router.push('/admin');
    }
  }, [status, session, router]);

  const features = [
    { icon: Brain, title: 'Intelligent Gap Analysis', description: 'Mistral AI identifies exactly which programming concepts you struggle with.', tags: ['Real-time', 'Pattern Recognition'] },
    { icon: Target, title: 'Personalized Learning Paths', description: 'Get custom-tailored recommendations based on your unique knowledge gaps.', tags: ['Adaptive', 'Smart Sequencing'] },
    { icon: Code, title: 'Multi-Language Support', description: 'Learn and practice across 7 programming languages on one platform.', tags: ['Python', 'Java', 'JavaScript'] },
    { icon: Zap, title: 'Mistral AI Insights', description: 'Get instant, human-like explanations with actionable advice from advanced AI.', tags: ['24/7 AI', 'Code Review'] },
    { icon: BarChart3, title: 'Progress Analytics', description: 'Visual dashboards show your mastery across concepts over time.', tags: ['Metrics', 'Tracking'] },
    { icon: Infinity, title: 'Unlimited Practice', description: 'Access thousands of coding challenges adapted to your level.', tags: ['Auto-graded', 'Feedback'] },
  ];

  const technologies = [
    { name: 'Mistral AI', description: 'Advanced LLM', icon: Cpu },
    { name: 'Next.js 14', description: 'React framework', icon: Layout },
    { name: 'PostgreSQL', description: 'Database', icon: Database },
    { name: 'Neon Tech', description: 'Serverless', icon: Cloud },
  ];

  const stats = [
    { value: '10,000+', label: 'Students', icon: Users },
    { value: '95%', label: 'Success Rate', icon: Award },
    { value: '7', label: 'Languages', icon: Code },
    { value: '1,000+', label: 'Challenges', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      
      {/* Navbar - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-xl backdrop-blur-sm">
                <Code className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-white">PACT</span>
              <span className="hidden md:inline text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                Powered by Mistral AI
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {status === 'loading' ? (
                <div className="h-9 w-20 bg-white/10 animate-pulse rounded-full" />
              ) : session ? (
                <Link href={session.user?.role === 'student' ? '/student' : '/dashboard'}>
                  <Button className="backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-5 py-2 text-sm">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login">
                    <Button variant="ghost" className="backdrop-blur-xl hover:bg-white/10 rounded-full px-5 py-2 text-sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-5 py-2 text-sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <button 
                className="p-2 rounded-lg hover:bg-white/10"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0A1628]/95 backdrop-blur-xl">
            <div className="p-4 flex flex-col gap-3">
              <div className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-center mb-2">
                Powered by Mistral AI
              </div>
              {status === 'loading' ? (
                <div className="h-9 w-full bg-white/10 animate-pulse rounded-full" />
              ) : session ? (
                <Link href={session.user?.role === 'student' ? '/student' : '/dashboard'} onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-full py-2">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full backdrop-blur-xl hover:bg-white/10 rounded-full py-2">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-full py-2">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main content with top padding to account for fixed navbar */}
      <main className="relative z-10 pt-16">
        {/* Hero Section */}
        <div className="min-h-[calc(100vh-4rem)] flex items-center">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Powered by Mistral AI</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                  Master Programming with{' '}
                  <span className="text-blue-400">
PACT                  </span>
                </h1>
                
                <p className="text-base md:text-lg text-gray-400 max-w-2xl mb-8 leading-relaxed">
                  PACT identifies your knowledge gaps and delivers custom learning paths across 7 programming languages. 
                  Powered by Mistral AI for deep code understanding and intelligent feedback.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/signup">
                    <Button className="backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-6 py-2 text-sm">
                      Start Learning Free
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="ghost" className="backdrop-blur-xl hover:bg-white/10 rounded-full px-6 py-2 text-sm">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>

              <div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="text-xs text-gray-500 font-mono">Mistral AI Analytics</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Knowledge Mastery</div>
                      <div className="text-2xl font-bold text-blue-400">87%</div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '87%' }} />
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Active Streak</div>
                      <div className="text-2xl font-bold text-blue-400">23 days</div>
                      <div className="text-xs text-green-500 mt-1">↑ 12% this week</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs text-gray-500 mb-2">Skill Overview</div>
                    {[
                      { name: 'Python', value: 92 },
                      { name: 'Algorithms', value: 78 },
                      { name: 'Data Structures', value: 85 },
                    ].map((skill) => (
                      <div key={skill.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">{skill.name}</span>
                          <span className="text-white font-mono">{skill.value}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${skill.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-y border-white/10">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="text-center">
                    <div className="inline-flex p-3 rounded-xl bg-white/10 mb-3">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
              Powerful Features
            </h2>
            <p className="text-gray-400 text-base md:text-lg">Everything you need to master programming efficiently</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white/5 border-y border-white/10">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
                How It Works
              </h2>
              <p className="text-gray-400 text-base md:text-lg">Three simple steps to accelerated learning</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { step: '01', title: 'Adaptive Assessment', desc: 'Take intelligent quizzes that adapt to your skill level' },
                { step: '02', title: 'Mistral AI Analysis', desc: 'Advanced AI analyzes your code and identifies gaps' },
                { step: '03', title: 'Personalized Learning', desc: 'Receive custom-tailored resources based on your gaps' },
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 flex items-center justify-center mx-auto mb-6">
                    <span className="text-xl md:text-2xl font-bold text-blue-400">{item.step}</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-white">{item.title}</h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technology Section */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
              Modern Technology Stack
            </h2>
            <p className="text-gray-400 text-base md:text-lg">Powered by industry-leading Mistral AI and scalable architecture</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {technologies.map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <div key={idx} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:border-blue-500/50 transition-all">
                  <div className="inline-flex p-3 rounded-xl bg-white/10 mb-4">
                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-1 text-white text-sm md:text-base">{tech.name}</h3>
                  <p className="text-xs text-gray-500">{tech.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-white/5 border-y border-white/10">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
                What Our Users Say
              </h2>
              <p className="text-gray-400 text-base md:text-lg">Join thousands of successful learners</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {[
                { name: 'Kennedy Wanakacha', role: 'CS Student', content: 'PACT transformed how I learn programming. The Mistral AI gap analysis helped me understand my weak points.' },
                { name: 'Alvine Allan', role: 'Software Engineering Student', content: 'The adaptive quizzes and real-time AI feedback completely changed my learning experience.' },
                { name: 'Princeton Mwachala', role: 'Computer Science Student', content: 'PACT\'s multi-language support with Mistral AI is incredible. Learning multiple languages on one platform is a game-changer.' },
              ].map((testimonial, idx) => (
                <div key={idx} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-sm text-white">{testimonial.name}</p>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-white">
              Ready to Accelerate Your Coding Journey?
            </h2>
            <p className="text-base md:text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of students using PACT with Mistral AI to master programming through personalized learning.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup">
                <Button className="backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-6 py-2 text-sm">
                  Start Learning Free
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="backdrop-blur-xl hover:bg-white/10 rounded-full px-6 py-2 text-sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-white/5">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto pb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-blue-500/20 p-2 rounded-xl backdrop-blur-sm">
                    <Code className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-xl font-bold text-white">PACT</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">Personalized Adaptive Coding Tutor — Powered by Mistral AI.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-white text-sm">Platform</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><a href="#" className="hover:text-blue-400 transition">Features</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition">Documentation</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition">Support</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-white text-sm">Resources</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><a href="#" className="hover:text-blue-400 transition">API Reference</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition">GitHub</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition">Blog</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-white text-sm">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><a href="#" className="hover:text-blue-400 transition">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            <div className="text-center text-xs text-gray-500 pt-8 border-t border-white/10">
              <p>&copy; 2026 PACT - Personalized Adaptive Coding Tutor. Powered by Mistral AI. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}