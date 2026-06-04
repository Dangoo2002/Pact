// ============================================================
// API CONFIGURATION - PRODUCTION ENDPOINTS
// ============================================================

const KGI_API = process.env.NEXT_PUBLIC_KGI_API_URL || 'https://pact-project.onrender.com';
const REC_API = process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL || 'https://pact-recommendation.onrender.com';
const ASSESSMENT_API = process.env.NEXT_PUBLIC_ASSESSMENT_API_URL || 'https://pact-assessment.onrender.com';

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
      primary_gaps: [],
      secondary_gaps: [],
      overall_mastery: 0,
      mastery_scores: {}
    };
  }
}

export async function fetchStudentGaps(studentId) {
  const profile = await fetchGapProfile(studentId);
  return {
    primary_gaps: profile.primary_gaps || [],
    secondary_gaps: profile.secondary_gaps || []
  };
}

export async function fetchClassInsights(classId = 'CS101') {
  try {
    const res = await fetch(`${KGI_API}/api/v1/kgi/class-insights?class_id=${classId}`);
    if (!res.ok) throw new Error('Failed to fetch class insights');
    return res.json();
  } catch (error) {
    console.error('KGI API error:', error);
    return {
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  } catch (error) {
    console.error('Recommendation API error:', error);
    return { recommendations: [] };
  }
}

export async function getRecommendationsWithExplanation(studentId, concept = null) {
  try {
    const url = concept 
      ? `${REC_API}/api/v1/recommend/recommend/${studentId}?concept=${concept}`
      : `${REC_API}/api/v1/recommend/recommend/${studentId}`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  } catch (error) {
    console.error('Recommendation API error:', error);
    return { recommendations: [] };
  }
}

// ============================================================
// ROLE 1: ADAPTIVE ASSESSMENT API
// ============================================================

export async function fetchAvailableQuizzes(studentId, concept = null, language = null) {
  try {
    let url = `${ASSESSMENT_API}/api/v1/assessment/quizzes?student_id=${studentId}`;
    if (concept) url += `&concept=${concept}`;
    if (language) url += `&language=${language}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch quizzes');
    return res.json();
  } catch (error) {
    console.error('Assessment API error:', error);
    return { quizzes: [] };
  }
}

export async function startQuizSession(quizId, studentId) {
  try {
    const res = await fetch(`${ASSESSMENT_API}/api/v1/assessment/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id: quizId, student_id: studentId })
    });
    if (!res.ok) throw new Error('Failed to start quiz');
    return res.json();
  } catch (error) {
    console.error('Start quiz error:', error);
    return {
      session_id: `session_${Date.now()}`,
      current_question: {
        id: 'q1',
        text: 'Sample question',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        type: 'multiple_choice'
      },
      total_questions: 10,
      time_limit: 600
    };
  }
}

export async function submitAnswer(sessionId, questionId, answer, codeSubmission = null) {
  try {
    const res = await fetch(`${ASSESSMENT_API}/api/v1/assessment/answer/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        session_id: sessionId, 
        question_id: questionId, 
        answer, 
        code_submission: codeSubmission 
      })
    });
    if (!res.ok) throw new Error('Failed to submit answer');
    return res.json();
  } catch (error) {
    console.error('Submit answer error:', error);
    return {
      is_correct: false,
      explanation: 'Unable to evaluate answer. Please try again.',
      next_question: null
    };
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export async function fetchStudentStats(studentId) {
  const profile = await fetchGapProfile(studentId);
  const masteryScores = profile.mastery_scores || {};
  const scores = Object.values(masteryScores);
  const avgMastery = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const primaryGaps = profile.primary_gaps || [];
  
  return {
    avgMastery: Math.round(avgMastery * 100),
    totalGaps: primaryGaps.length,
    highSeverityGaps: primaryGaps.filter(g => g.severity === 'high').length,
    languages: [...new Set(Object.keys(masteryScores).map(k => k.split(':')[0]))]
  };
}

export async function logEngagement(studentId, resourceId, clicked, completed, timeSpent = null) {
  try {
    await fetch(`${REC_API}/api/v1/recommend/engage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        student_id: studentId, 
        resource_id: resourceId, 
        clicked, 
        completed, 
        time_spent: timeSpent 
      })
    });
  } catch (error) {
    console.error('Failed to log engagement:', error);
  }
}