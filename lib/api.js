// ============================================================
// API CONFIGURATION
// ============================================================

const KGI_API = process.env.NEXT_PUBLIC_KGI_API_URL || 'https://pact-project.onrender.com';
const REC_API = process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL || 'http://localhost:8003';
const ASSESSMENT_API = process.env.NEXT_PUBLIC_ASSESSMENT_API_URL || 'http://localhost:8001';

// ============================================================
// ROLE 1: ADAPTIVE ASSESSMENT API
// ============================================================

export async function fetchAvailableQuizzes(studentId, language = null, difficulty = null) {
  try {
    let url = `${ASSESSMENT_API}/api/v1/assessment/quizzes?student_id=${studentId}`;
    if (language) url += `&language=${language}`;
    if (difficulty) url += `&difficulty=${difficulty}`;
    
    const res = await fetch(url);
    if (res.ok) return res.json();
    throw new Error('API not available');
  } catch (error) {
    // Mock data as fallback
    return {
      quizzes: [
        { id: 'quiz_001', title: 'Python Basics', language: 'python', concepts: ['variables', 'data_types', 'operators'], difficulty: 'beginner', questionCount: 10, estimatedTime: 15, progress: 0 },
        { id: 'quiz_002', title: 'Control Flow Mastery', language: 'python', concepts: ['conditionals', 'loops'], difficulty: 'intermediate', questionCount: 8, estimatedTime: 12, progress: 30 },
        { id: 'quiz_003', title: 'Functions Fundamentals', language: 'python', concepts: ['functions', 'parameters', 'return_values'], difficulty: 'intermediate', questionCount: 10, estimatedTime: 15, progress: 0 },
        { id: 'quiz_004', title: 'Java Introduction', language: 'java', concepts: ['variables', 'syntax', 'classes'], difficulty: 'beginner', questionCount: 8, estimatedTime: 10, progress: 0 },
        { id: 'quiz_005', title: 'JavaScript Essentials', language: 'javascript', concepts: ['variables', 'functions', 'arrays'], difficulty: 'beginner', questionCount: 10, estimatedTime: 12, progress: 0 },
        { id: 'quiz_006', title: 'Advanced Python', language: 'python', concepts: ['decorators', 'generators', 'context_managers'], difficulty: 'advanced', questionCount: 12, estimatedTime: 20, progress: 0 }
      ]
    };
  }
}

export async function startQuizSession(quizId, studentId) {
  try {
    const res = await fetch(`${ASSESSMENT_API}/api/v1/assessment/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id: quizId, student_id: studentId })
    });
    if (res.ok) return res.json();
    throw new Error('API not available');
  } catch (error) {
    return {
      session_id: `session_${Date.now()}`,
      quiz_id: quizId,
      student_id: studentId,
      started_at: new Date().toISOString(),
      current_question_index: 0
    };
  }
}

export async function submitAnswer(sessionId, questionId, answer, codeSubmission = null) {
  try {
    const res = await fetch(`${ASSESSMENT_API}/api/v1/assessment/answer/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, question_id: questionId, answer, code_submission: codeSubmission })
    });
    if (res.ok) return res.json();
    throw new Error('API not available');
  } catch (error) {
    return {
      is_correct: Math.random() > 0.5,
      explanation: 'This is a sample explanation. In production, this would come from the AI.',
      next_question: { id: `q_${Date.now()}`, text: 'Sample question?', options: ['Option A', 'Option B', 'Option C', 'Option D'] }
    };
  }
}

export async function getQuizSession(sessionId) {
  try {
    const res = await fetch(`${ASSESSMENT_API}/api/v1/assessment/session/${sessionId}`);
    if (res.ok) return res.json();
    throw new Error('API not available');
  } catch (error) {
    return {
      session_id: sessionId,
      completed: false,
      current_question: { id: 'q_001', text: 'What is a variable?', options: ['A container for data', 'A function', 'A loop', 'A class'] },
      score: 0,
      questions_answered: 3,
      total_questions: 10
    };
  }
}

// ============================================================
// ROLE 2: KNOWLEDGE GAP IDENTIFICATION API
// ============================================================

export async function fetchGapProfile(studentId) {
  try {
    const res = await fetch(`${KGI_API}/api/v1/kgi/gap-profile/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch gap profile');
    return res.json();
  } catch (error) {
    console.error('KGI API error:', error);
    return {
      student_id: studentId,
      mastery_scores: {},
      primary_gaps: [],
      secondary_gaps: [],
      recommendations: []
    };
  }
}

export async function fetchClassInsights(classId = 'CS101') {
  try {
    const res = await fetch(`${KGI_API}/api/v1/kgi/class-insights?class_id=${classId}`);
    if (!res.ok) throw new Error('Failed to fetch class insights');
    return res.json();
  } catch (error) {
    console.error('KGI API error:', error);
    return {
      class_id: classId,
      total_students: 0,
      active_students: 0,
      average_mastery: 0,
      class_gap_heatmap: [],
      common_error_patterns: [],
      at_risk_students: [],
      teaching_recommendations: []
    };
  }
}

// ============================================================
// ROLE 3: RESOURCE RECOMMENDATION API
// ============================================================

export async function fetchRecommendations(studentId, limit = 10) {
  try {
    const res = await fetch(`${REC_API}/api/v1/recommend/recommend/${studentId}?limit=${limit}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  } catch (error) {
    console.error('Recommendation API error:', error);
    return { recommendations: [] };
  }
}

export async function fetchPopularResources(limit = 10) {
  try {
    const res = await fetch(`${REC_API}/api/v1/recommend/popular?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch popular resources');
    return res.json();
  } catch (error) {
    return {
      resources: [
        { resource_id: 1, title: 'Python Variables Explained', resource_type: 'video', url: '#', quality_score: 0.9 },
        { resource_id: 2, title: 'Loops Tutorial', resource_type: 'video', url: '#', quality_score: 0.85 },
        { resource_id: 3, title: 'Functions Deep Dive', resource_type: 'article', url: '#', quality_score: 0.88 }
      ]
    };
  }
}

export async function logEngagement(studentId, resourceId, clicked, completed, timeSpent = null, rating = null) {
  try {
    await fetch(`${REC_API}/api/v1/recommend/engage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, resource_id: resourceId, clicked, completed, time_spent: timeSpent, rating })
    });
  } catch (error) {
    console.error('Failed to log engagement:', error);
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export async function fetchStudentStats(studentId) {
  const profile = await fetchGapProfile(studentId);
  if (!profile) return null;
  
  const masteryScores = profile.mastery_scores || {};
  const scores = Object.values(masteryScores);
  const avgMastery = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const primaryGaps = profile.primary_gaps || [];
  
  return {
    avgMastery,
    totalGaps: primaryGaps.length,
    highSeverityGaps: primaryGaps.filter(g => g.severity === 'high').length,
    languages: [...new Set(Object.keys(masteryScores).map(k => k.split(':')[0]))]
  };
}