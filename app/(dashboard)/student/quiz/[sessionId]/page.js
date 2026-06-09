// app/student/quiz/[sessionId]/page.jsx
'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Code, Clock, CheckCircle, XCircle, Loader2, 
  Menu, User, LogOut, Bell, Sparkles, Bot, LayoutDashboard, Target, BookOpen, Save,
  ChevronRight, Copy, Check
} from 'lucide-react';
import { signOut } from 'next-auth/react';

// Star Background Component
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

// Enhanced Code Artifact Component
const CodeArtifact = ({ code, language, onChange, disabled, readOnly, placeholder }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="rounded-lg overflow-hidden border border-white/10 bg-[#1E1E2E]">
      <div className="flex items-center justify-between px-3 py-2 bg-[#2D2D3D] border-b border-white/10">
        <div className="flex items-center gap-2">
          <Code size={14} className="text-blue-400" />
          <span className="text-xs text-gray-400 font-mono">{language || 'python'}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="p-1 hover:bg-white/10 rounded transition flex items-center gap-1">
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-400" />}
            <span className="text-xs text-gray-400">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
          </div>
        </div>
      </div>
      {readOnly ? (
        <pre className="p-3 overflow-x-auto text-xs md:text-sm font-mono text-gray-300 bg-[#1E1E2E] whitespace-pre-wrap break-words">
          <code>{code}</code>
        </pre>
      ) : (
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={10}
          className="w-full font-mono text-xs md:text-sm p-3 bg-[#1E1E2E] text-gray-300 placeholder-gray-500 focus:outline-none resize-y"
          placeholder={placeholder || 'def solution():\n    # Write your code here\n    pass'}
          spellCheck={false}
        />
      )}
    </div>
  );
};

// Helper function to extract code from markdown code blocks
const extractCodeFromText = (text) => {
  if (!text) return '';
  const match = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : '';
};

// Quiz Skeleton Loader
const QuizSkeleton = () => (
  <div className="min-h-screen bg-[#0A1628]">
    <StarBackground />
    <div className="md:ml-64">
      <div className="pt-20 px-4 md:px-6 pb-6 animate-pulse">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6">
            <div className="flex justify-between mb-4 pb-2 border-b border-white/10">
              <div className="h-5 w-32 bg-white/10 rounded" />
              <div className="h-5 w-24 bg-white/10 rounded" />
            </div>
            <div className="h-24 w-full bg-white/10 rounded mb-6" />
            <div className="space-y-3 mb-6">
              {[1,2,3,4].map(i => <div key={i} className="h-14 bg-white/10 rounded" />)}
            </div>
            <div className="h-10 w-full bg-white/10 rounded mb-4" />
            <div className="h-2 bg-white/10 rounded-full"><div className="h-full w-1/3 bg-blue-500/30 rounded-full" /></div>
            <div className="flex justify-between mt-2"><div className="h-3 w-24 bg-white/10 rounded" /><div className="h-3 w-16 bg-white/10 rounded" /></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function QuizPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [codeAnswer, setCodeAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [aiHint, setAiHint] = useState(null);
  const [gettingHint, setGettingHint] = useState(false);
  const [allAnswers, setAllAnswers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToDatabase, setSavedToDatabase] = useState(false);
  const [quizConcept, setQuizConcept] = useState('');
  const [quizLanguage, setQuizLanguage] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && sessionId) {
      loadQuizData();
    }
  }, [status, session, sessionId, router]);

  const loadQuizData = async () => {
    setLoading(true);
    try {
      const storedData = sessionStorage.getItem(`quiz_${sessionId}`);
      if (storedData) {
        const data = JSON.parse(storedData);
        setAllQuestions(data.all_questions || []);
        setCurrentQuestion(data.current_question || null);
        setTotalQuestions(data.total_questions || 0);
        setScore(data.score || 0);
        setQuestionsAnswered(data.questions_answered || 0);
        setCurrentQuestionIndex(data.questions_answered || 0);
        setTimeLeft(data.time_left || 90);
        setQuizConcept(data.concept || data.all_questions?.[0]?.concept || 'general');
        setQuizLanguage(data.language || data.all_questions?.[0]?.language || 'python');
        setAllAnswers(data.answers || []);
      }
    } catch (error) {
      console.error('Failed to load quiz data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveQuizProgress = (updatedScore, updatedQuestionsAnswered, updatedCurrentQuestion, updatedAllAnswers) => {
    try {
      const quizData = {
        all_questions: allQuestions,
        current_question: updatedCurrentQuestion,
        total_questions: totalQuestions,
        score: updatedScore,
        questions_answered: updatedQuestionsAnswered,
        time_left: timeLeft,
        concept: quizConcept,
        language: quizLanguage,
        answers: updatedAllAnswers
      };
      sessionStorage.setItem(`quiz_${sessionId}`, JSON.stringify(quizData));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  // Timer - 90 seconds (1 minute 30 seconds)
  useEffect(() => {
    if (quizCompleted || loading || !currentQuestion) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setQuizCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizCompleted, loading, currentQuestion]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAiHint = async () => {
    if (!currentQuestion) return;
    setGettingHint(true);
    try {
      const response = await fetch('/api/ai/explain-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: currentQuestion.concept || quizConcept || 'programming',
          language: currentQuestion.language || quizLanguage || 'python',
          errorMessage: `Student needs help with: ${currentQuestion.text}`,
          codeContext: currentQuestion.code_snippet || currentQuestion.starter_code || null
        })
      });
      const data = await response.json();
      setAiHint(data.explanation || "Think about the definition carefully. Review the concept and try again.");
    } catch (error) {
      setAiHint("Think about the concept carefully. Review the basics and try again.");
    } finally {
      setGettingHint(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (submitting) return;
    
    // Check if answer is provided based on question type
    if (currentQuestion?.type === 'coding') {
      if (!codeAnswer.trim()) {
        setFeedback({
          isCorrect: false,
          explanation: "Please write your solution in the code editor before submitting.",
          correctAnswer: null
        });
        return;
      }
    } else {
      if (!selectedAnswer) {
        setFeedback({
          isCorrect: false,
          explanation: "Please select an answer before submitting.",
          correctAnswer: null
        });
        return;
      }
    }
    
    setSubmitting(true);
    setAiHint(null);
    
    try {
      const response = await fetch('/api/student/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          questionId: currentQuestion?.id,
          questionIndex: currentQuestionIndex,
          answer: selectedAnswer,
          codeSubmission: codeAnswer,
          allQuestions: allQuestions
        })
      });
      
      const result = await response.json();
      
      setFeedback({
        isCorrect: result.is_correct,
        explanation: result.explanation,
        correctAnswer: result.correct_answer
      });
      
      const newAnswers = [...allAnswers, {
        questionId: currentQuestion?.id,
        question: currentQuestion?.text,
        answer: selectedAnswer || codeAnswer,
        isCorrect: result.is_correct,
        correct_answer: currentQuestion?.correct_answer,
        feedback: result.explanation
      }];
      setAllAnswers(newAnswers);
      
      const newScore = score + (result.is_correct ? 1 : 0);
      const newQuestionsAnswered = questionsAnswered + 1;
      
      setScore(newScore);
      setQuestionsAnswered(newQuestionsAnswered);
      
      if (result.quiz_completed) {
        setQuizCompleted(true);
        setSubmitting(false);
      } else if (result.next_question) {
        saveQuizProgress(newScore, newQuestionsAnswered, result.next_question, newAnswers);
        
        setTimeout(() => {
          setCurrentQuestion(result.next_question);
          setCurrentQuestionIndex(newQuestionsAnswered);
          setSelectedAnswer(null);
          setCodeAnswer('');
          setFeedback(null);
          setSubmitting(false);
        }, 2000);
      } else {
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitting(false);
    }
  };

  const handleSaveAndAnalyze = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/student/quiz/save-and-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          studentId: session.user.id,
          concept: quizConcept,
          language: quizLanguage,
          questions: allQuestions,
          answers: allAnswers,
          score: score,
          totalQuestions: totalQuestions
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setSavedToDatabase(true);
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || (loading && !quizCompleted)) {
    return <QuizSkeleton />;
  }

  if (quizCompleted) {
    const percentage = Math.round((score / totalQuestions) * 100);
    return (
      <div className="min-h-screen bg-[#0A1628] relative">
        <StarBackground />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="md:ml-64 relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 md:p-8 max-w-md w-full">
            <div className="text-center">
              {percentage >= 70 ? (
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="md:text-[36px] text-green-400" />
                </div>
              ) : (
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <XCircle size={32} className="md:text-[36px] text-red-400" />
                </div>
              )}
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Quiz Completed</h2>
              <p className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">{score}/{totalQuestions}</p>
              <p className="text-gray-400 text-sm md:text-base mb-6">You scored {percentage}%</p>

              {!savedToDatabase ? (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-400 mb-3">Save & Analyze Your Results</p>
                  <button
                    onClick={handleSaveAndAnalyze}
                    disabled={isSaving}
                    className="w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {isSaving ? 'Analyzing with AI...' : 'Get AI Recommendations'}
                  </button>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-6">
                  <p className="text-sm text-green-400 text-center">Analysis complete! Your recommendations are ready.</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/student" className="w-full sm:w-auto">
                  <button className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition text-sm">Dashboard</button>
                </Link>
                <Link href={`/student/recommendations?sessionId=${sessionId}`} className="w-full sm:w-auto">
                  <button className="w-full px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition text-sm flex items-center justify-center gap-2">
                    View Recommendations <ChevronRight size={14} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <QuizSkeleton />;
  }

  // Determine if this is a coding question (type === 'coding')
  const isCodingQuestion = currentQuestion?.type === 'coding';
  const progressPercentage = (questionsAnswered / totalQuestions) * 100;
  const displayScore = score;
  const displayTime = formatTime(timeLeft);
  
  // Get starter code for coding questions
  const starterCode = currentQuestion?.starter_code || currentQuestion?.code_snippet || null;

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        {/* Header with timer */}
        <div className="sticky top-0 z-30 bg-[#0A1628]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10"><Menu size={20} /></button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full">
                <Clock size={14} className="text-blue-400" />
                <span className={`font-mono text-sm md:text-base font-medium ${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {displayTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 md:p-6">
          <div className="max-w-3xl mx-auto">
            {/* Question Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Code size={16} className="text-blue-400" />
                  <span className="text-xs md:text-sm font-medium text-gray-300">
                    {quizConcept?.replace(/_/g, ' ')} • {quizLanguage}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${isCodingQuestion ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {isCodingQuestion ? 'Coding Challenge' : 'Multiple Choice'}
                  </span>
                  <button 
                    onClick={getAiHint} 
                    disabled={gettingHint || feedback !== null} 
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition disabled:opacity-50"
                  >
                    {gettingHint ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
                    {gettingHint ? 'Getting hint...' : 'Get AI Hint'}
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-sm md:text-lg font-medium text-white mb-4 md:mb-6 leading-relaxed">
                {currentQuestion?.text}
              </h3>

              {/* AI Hint */}
              {aiHint && (
                <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-start gap-2">
                    <Bot size={14} className="text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs md:text-sm text-purple-300 leading-relaxed">{aiHint}</p>
                  </div>
                </div>
              )}

              {/* Multiple Choice Options */}
              {!isCodingQuestion && currentQuestion?.options && (
                <div className="space-y-2 md:space-y-3 mb-6">
                  {currentQuestion.options.map((option, idx) => (
                    <label 
                      key={idx} 
                      className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border cursor-pointer transition ${
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
                        className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" 
                      />
                      <span className="text-xs md:text-sm text-gray-300">{String.fromCharCode(65 + idx)}. {option}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Coding Question Area */}
              {isCodingQuestion && (
                <div className="mb-6">
                  {starterCode && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                        <Code size={12} className="text-blue-400" />
                        <span>Starter Code:</span>
                      </div>
                      <CodeArtifact
                        code={starterCode}
                        language={quizLanguage}
                        onChange={() => {}}
                        disabled={true}
                        readOnly={true}
                      />
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mb-2">Your Solution:</div>
                  <CodeArtifact
                    code={codeAnswer}
                    language={quizLanguage}
                    onChange={setCodeAnswer}
                    disabled={feedback !== null}
                    placeholder={starterCode || `def solution():\n    # Write your code here\n    pass`}
                  />
                  {currentQuestion?.hints && currentQuestion.hints.length > 0 && !feedback && (
                    <div className="mt-3 p-2 rounded bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs text-blue-400 mb-1">💡 Hints:</p>
                      <ul className="text-xs text-gray-400 space-y-1">
                        {currentQuestion.hints.slice(0, 2).map((hint, i) => (
                          <li key={i}>• {hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback Section */}
              {feedback && (
                <div className={`p-3 md:p-4 rounded-lg mb-4 ${feedback.isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className="flex items-start gap-2">
                    {feedback.isCorrect ? (
                      <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-xs md:text-sm font-medium mb-1 ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                      </p>
                      <p className="text-xs md:text-sm text-gray-300 leading-relaxed">{feedback.explanation}</p>
                      {!feedback.isCorrect && feedback.correctAnswer && (
                        <div className="mt-2 pt-2 border-t border-gray-700/50">
                          <p className="text-xs text-blue-400">
                            <span className="font-semibold">Expected solution:</span> {feedback.correctAnswer}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button 
                onClick={handleAnswerSubmit} 
                disabled={(!selectedAnswer && !codeAnswer && !isCodingQuestion) || submitting || feedback !== null} 
                className="w-full py-2 md:py-2.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? 'Processing...' : feedback ? 'Next Question' : 'Submit Answer'}
                {!submitting && feedback && <ChevronRight size={14} />}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 md:mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4">
              <div className="flex justify-between text-xs md:text-sm text-gray-400 mb-2">
                <span>Question {Math.min(questionsAnswered + 1, totalQuestions)} of {totalQuestions}</span>
                <span>Score: {displayScore} / {totalQuestions}</span>
              </div>
              <div className="h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}