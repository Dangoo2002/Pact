'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Code, Clock, CheckCircle, XCircle, Loader2, ChevronLeft,
  Menu, User, LogOut, Bell, Sparkles
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { startQuizSession, submitAnswer } from '@/lib/api';

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
            <div className="bg-blue-500/20 p-2 rounded-xl">
              <Code className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-xl font-bold text-white">PACT</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Student Portal</p>
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

export default function QuizPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [codeAnswer, setCodeAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session?.user?.id && quizId) {
      startQuizSession(quizId, session.user.id).then(data => {
        setSessionId(data.session_id);
        setCurrentQuestion(data.current_question || {
          id: 'q1',
          text: 'What is the correct way to declare a variable in Python?',
          options: ['var x = 5', 'let x = 5', 'x = 5', 'int x = 5'],
          type: 'multiple_choice'
        });
        setTotalQuestions(data.total_questions || 10);
        setTimeLeft(data.time_limit || 600);
        setLoading(false);
      }).catch(() => {
        setCurrentQuestion({
          id: 'q1',
          text: 'What is the correct way to declare a variable in Python?',
          options: ['var x = 5', 'let x = 5', 'x = 5', 'int x = 5'],
          type: 'multiple_choice'
        });
        setTotalQuestions(10);
        setTimeLeft(600);
        setLoading(false);
      });
    }
  }, [session, quizId, router]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !quizCompleted && !loading) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !quizCompleted) {
      setQuizCompleted(true);
    }
  }, [timeLeft, quizCompleted, loading]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer && !codeAnswer) return;
    
    setSubmitting(true);
    
    try {
      const result = await submitAnswer(sessionId, currentQuestion?.id, selectedAnswer, codeAnswer);
      
      setFeedback({
        isCorrect: result.is_correct,
        explanation: result.explanation || (result.is_correct ? 'Great job! Correct answer.' : 'Incorrect. Review the concept and try again.')
      });
      
      if (result.is_correct) setScore(prev => prev + 1);
      setQuestionsAnswered(prev => prev + 1);
      
      if (result.next_question) {
        setTimeout(() => {
          setCurrentQuestion(result.next_question);
          setSelectedAnswer(null);
          setCodeAnswer('');
          setFeedback(null);
          setSubmitting(false);
        }, 2000);
      } else if (questionsAnswered + 1 >= totalQuestions) {
        setQuizCompleted(true);
        setSubmitting(false);
      } else {
        setTimeout(() => {
          setCurrentQuestion({
            id: `q${questionsAnswered + 2}`,
            text: `Sample question ${questionsAnswered + 2}: Continue practicing your skills!`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            type: 'multiple_choice'
          });
          setSelectedAnswer(null);
          setCodeAnswer('');
          setFeedback(null);
          setSubmitting(false);
        }, 2000);
      }
    } catch (error) {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / totalQuestions) * 100);
    return (
      <div className="min-h-screen bg-[#0A1628] relative">
        <StarBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
            {percentage >= 70 ? (
              <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
            ) : (
              <XCircle size={64} className="text-red-400 mx-auto mb-4" />
            )}
            <h2 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h2>
            <p className="text-3xl font-bold text-blue-400 mb-4">{score}/{totalQuestions}</p>
            <p className="text-gray-400 mb-6">You scored {percentage}%</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/student">
                <button className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition">
                  Back to Dashboard
                </button>
              </Link>
              <Link href={`/student/quiz/${quizId}`}>
                <button className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/10 transition">
                  Retake Quiz
                </button>
              </Link>
            </div>
          </div>
        </div>
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
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-400" />
                <span className={timeLeft < 60 ? 'text-red-400' : 'text-gray-300'}>{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            <Link href="/student/quizzes" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4 transition">
              <ChevronLeft size={16} /> Back to Quizzes
            </Link>

            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Question {questionsAnswered + 1} of {totalQuestions}</span>
                <span>Score: {score}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${((questionsAnswered + 1) / totalQuestions) * 100}%` }} />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                <Code size={18} className="text-blue-400" />
                <span className="text-sm font-medium text-gray-300">Question {questionsAnswered + 1}</span>
              </div>
              
              <h3 className="text-lg font-medium text-white mb-6">{currentQuestion?.text}</h3>
              
              {currentQuestion?.type !== 'code_writing' && currentQuestion?.options && (
                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((option, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        selectedAnswer === option ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:bg-white/5'
                      } ${feedback !== null ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={selectedAnswer === option}
                        onChange={() => setSelectedAnswer(option)}
                        disabled={feedback !== null}
                        className="w-4 h-4 text-blue-500"
                      />
                      <span className="text-sm text-gray-300">{String.fromCharCode(65 + idx)}. {option}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {currentQuestion?.type === 'code_writing' && (
                <div className="mb-6">
                  <textarea
                    value={codeAnswer}
                    onChange={(e) => setCodeAnswer(e.target.value)}
                    disabled={feedback !== null}
                    rows={8}
                    className="w-full font-mono text-sm p-3 rounded-lg bg-black/30 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                    placeholder='def solution():
    # Write your code here
    pass'
                  />
                </div>
              )}
              
              {feedback && (
                <div className={`p-4 rounded-lg mb-4 ${feedback.isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <p className={`text-sm font-medium mb-1 ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                  </p>
                  <p className="text-sm text-gray-400">{feedback.explanation}</p>
                </div>
              )}
              
              <button
                onClick={handleAnswerSubmit}
                disabled={(!selectedAnswer && !codeAnswer) || submitting || feedback !== null}
                className="w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}
                {submitting ? 'Processing...' : feedback ? 'Next Question →' : 'Submit Answer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { LayoutDashboard, Target, BookOpen } from 'lucide-react';