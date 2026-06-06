'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Code, Clock, CheckCircle, XCircle, Loader2, 
  Menu, User, LogOut, Bell, Sparkles, Bot, LayoutDashboard, Target, BookOpen, Save,
  ChevronRight, Brain
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

// Format AI explanation without markdown
const formatAIExplanation = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/#{1,6}\s/g, '');
};

// Code Artifact Component
const CodeArtifact = ({ code, language, onChange, disabled }) => {
  return (
    <div className="rounded-lg overflow-hidden border border-white/10 bg-black/50">
      <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Code size={14} className="text-blue-400" />
          <span className="text-xs text-gray-400">{language || 'python'}</span>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
        </div>
      </div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={8}
        className="w-full font-mono text-xs md:text-sm p-3 bg-black/50 text-gray-300 placeholder-gray-600 focus:outline-none resize-y"
        placeholder='def solution():
    # Write your code here
    pass'
        spellCheck={false}
      />
    </div>
  );
};

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
  const [timeLeft, setTimeLeft] = useState(300);
  const [aiHint, setAiHint] = useState(null);
  const [gettingHint, setGettingHint] = useState(false);
  const [allAnswers, setAllAnswers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToDatabase, setSavedToDatabase] = useState(false);
  const [quizConcept, setQuizConcept] = useState('');
  const [quizLanguage, setQuizLanguage] = useState('');

  // Auth check
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
        setTimeLeft(data.time_left || 300);
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

  // Save quiz progress to sessionStorage
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

  // Timer
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
          concept: currentQuestion.concept || 'programming',
          language: currentQuestion.language || 'python',
          errorMessage: `Student needs help with: ${currentQuestion.text}`
        })
      });
      const data = await response.json();
      setAiHint(formatAIExplanation(data.explanation || "Think about the definition carefully."));
    } catch (error) {
      setAiHint("Think about the concept carefully. Review the basics and try again.");
    } finally {
      setGettingHint(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if ((!selectedAnswer && !codeAnswer) || submitting) return;
    
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
      
      const isCorrect = result.is_correct;
      const explanation = formatAIExplanation(result.explanation);
      
      setFeedback({
        isCorrect: isCorrect,
        explanation: explanation
      });
      
      const newAnswers = [...allAnswers, {
        questionId: currentQuestion?.id,
        question: currentQuestion?.text,
        answer: selectedAnswer || codeAnswer,
        isCorrect: isCorrect,
        correct_answer: currentQuestion?.correct_answer
      }];
      setAllAnswers(newAnswers);
      
      const newScore = score + (isCorrect ? 1 : 0);
      const newQuestionsAnswered = questionsAnswered + 1;
      
      setScore(newScore);
      setQuestionsAnswered(newQuestionsAnswered);
      
      if (result.quiz_completed) {
        setQuizCompleted(true);
        setSubmitting(false);
      } else if (result.next_question) {
        // Save progress before moving to next question
        saveQuizProgress(newScore, newQuestionsAnswered, result.next_question, newAnswers);
        
        setTimeout(() => {
          setCurrentQuestion(result.next_question);
          setCurrentQuestionIndex(newQuestionsAnswered);
          setSelectedAnswer(null);
          setCodeAnswer('');
          setFeedback(null);
          setSubmitting(false);
        }, 1500);
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
                  <p className="text-sm text-blue-400 mb-3">Get AI-Powered Insights</p>
                  <button
                    onClick={handleSaveAndAnalyze}
                    disabled={isSaving}
                    className="w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
                    {isSaving ? 'Analyzing with AI...' : 'Save & Analyze with AI'}
                  </button>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-6">
                  <p className="text-sm text-green-400 text-center">Analysis complete! Check your recommendations.</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/student" className="w-full sm:w-auto">
                  <button className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition text-sm">
                    Dashboard
                  </button>
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

  const isCodeQuestion = currentQuestion?.type === 'code_writing' || currentQuestion?.code_required;
  const progressPercentage = ((questionsAnswered + (feedback ? 1 : 0)) / totalQuestions) * 100;
  const displayQuestionNumber = questionsAnswered + (feedback ? 1 : 0);
  const displayScore = score + (feedback?.isCorrect ? 0 : 0);

  return (
    <div className="min-h-screen bg-[#0A1628] text-white relative">
      <StarBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        {/* Header with timer only */}
        <div className="sticky top-0 z-30 bg-[#0A1628]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/10">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="md:text-[16px] text-blue-400" />
                <span className={`font-mono text-sm md:text-base ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-gray-300'}`}>
                  {formatTime(timeLeft)}
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
                  <Code size={16} className="md:text-[18px] text-blue-400" />
                  <span className="text-xs md:text-sm font-medium text-gray-300">
                    {quizConcept?.replace(/_/g, ' ')} • {quizLanguage}
                  </span>
                </div>
                <button 
                  onClick={getAiHint} 
                  disabled={gettingHint || feedback !== null} 
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition disabled:opacity-50"
                >
                  {gettingHint ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
                  {gettingHint ? 'Getting hint...' : 'Get AI Hint'}
                </button>
              </div>

              <h3 className="text-sm md:text-lg font-medium text-white mb-4 md:mb-6">{currentQuestion?.text}</h3>

              {/* AI Hint */}
              {aiHint && (
                <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs md:text-sm text-purple-300">{aiHint}</p>
                </div>
              )}

              {/* Multiple Choice Options */}
              {!isCodeQuestion && currentQuestion?.options && (
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

              {/* Code Artifact for code questions */}
              {isCodeQuestion && (
                <div className="mb-6">
                  <CodeArtifact
                    code={codeAnswer}
                    language={quizLanguage}
                    onChange={setCodeAnswer}
                    disabled={feedback !== null}
                  />
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <div className={`p-3 md:p-4 rounded-lg mb-4 ${feedback.isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <p className={`text-xs md:text-sm font-medium mb-1 ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                  </p>
                  <p className="text-xs md:text-sm text-gray-400">{feedback.explanation}</p>
                </div>
              )}

              {/* Submit Button - Changed to "Submit & Analyze with AI" after feedback */}
              {!feedback ? (
                <button 
                  onClick={handleAnswerSubmit} 
                  disabled={(!selectedAnswer && !codeAnswer) || submitting} 
                  className="w-full py-2 md:py-2.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={14} className="md:text-[16px] animate-spin" />}
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                  {!submitting && <ChevronRight size={14} className="md:text-[16px]" />}
                </button>
              ) : (
                <div className="space-y-3">
                  <button 
                    onClick={handleAnswerSubmit} 
                    className="w-full py-2 md:py-2.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition text-sm font-medium flex items-center justify-center gap-2"
                  >
                    Next Question
                    <ChevronRight size={14} className="md:text-[16px]" />
                  </button>
                  
                  {questionsAnswered === totalQuestions - 1 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-gray-400 text-center mb-2">After this question, you can analyze your performance</p>
                      <button 
                        onClick={handleSaveAndAnalyze}
                        disabled={isSaving}
                        className="w-full py-2 md:py-2.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition text-sm font-medium flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                        {isSaving ? 'Analyzing...' : 'Save & Analyze with AI'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Progress Bar - Shows REAL-TIME progress */}
            <div className="mt-4 md:mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4">
              <div className="flex justify-between text-xs md:text-sm text-gray-400 mb-2">
                <span>Question {Math.min(displayQuestionNumber, totalQuestions)} of {totalQuestions}</span>
                <span>Score: {displayScore} / {totalQuestions}</span>
              </div>
              <div className="h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}