// app/api/student/dashboard-stats/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Get student performance from quiz_sessions (consistent with gaps API)
    const performanceResult = await query(`
      SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_quizzes,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_quizzes,
        SUM(CASE WHEN status = 'completed' THEN total_questions ELSE 0 END) as total_questions_answered,
        SUM(CASE WHEN status = 'completed' THEN score ELSE 0 END) as total_correct_answers,
        COALESCE(ROUND(AVG(CASE WHEN status = 'completed' THEN score::numeric / total_questions * 100 ELSE NULL END)), 0) as average_score,
        COALESCE(ROUND(AVG(CASE WHEN status = 'completed' THEN score::numeric / total_questions * 100 ELSE NULL END)), 0) as overall_mastery
      FROM quiz_sessions
      WHERE student_id::integer = $1
    `, [studentId]);

    // Get concept mastery from quiz_sessions (consistent calculation)
    const conceptResult = await query(`
      SELECT 
        concept,
        COUNT(*) as total_questions,
        SUM(score) as correct_answers,
        ROUND(AVG(score::numeric / total_questions * 100)) as mastery_score
      FROM quiz_sessions
      WHERE student_id::integer = $1 AND status = 'completed' AND concept IS NOT NULL
      GROUP BY concept
      ORDER BY mastery_score ASC
    `, [studentId]);

    // Get weekly progress from quiz_sessions
    const weeklyResult = await query(`
      SELECT 
        DATE_TRUNC('week', completed_at) as week_start,
        COUNT(*) as quizzes_completed,
        ROUND(AVG(score::numeric / total_questions * 100)) as average_score
      FROM quiz_sessions
      WHERE student_id::integer = $1 AND status = 'completed' AND completed_at IS NOT NULL
      GROUP BY DATE_TRUNC('week', completed_at)
      ORDER BY week_start DESC
      LIMIT 6
    `, [studentId]);

    // Get gap analysis
    const gapResult = await query(`
      SELECT concept, analysis_data, created_at
      FROM gap_analysis
      WHERE student_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [studentId]);

    const performance = performanceResult.rows[0] || {
      total_quizzes: 0,
      completed_quizzes: 0,
      total_questions_answered: 0,
      total_correct_answers: 0,
      average_score: 0,
      overall_mastery: 0
    };

    // Calculate mastery from gap_analysis if available, otherwise use quiz_sessions
    let overallMasteryFromGaps = 0;
    let masteredConcepts = 0;
    
    for (const row of gapResult.rows) {
      const analysis = row.analysis_data;
      if (analysis) {
        const accuracy = analysis.accuracy_percentage || 
                        (analysis.mastery_level === 'advanced' ? 85 : 
                         analysis.mastery_level === 'intermediate' ? 65 : 45);
        overallMasteryFromGaps += accuracy;
        masteredConcepts++;
      }
    }
    
    const gapAnalysisMastery = masteredConcepts > 0 ? Math.round(overallMasteryFromGaps / masteredConcepts) : 0;
    
    // Use the higher of the two masteries (quiz_sessions or gap_analysis)
    const finalOverallMastery = Math.max(performance.overall_mastery, gapAnalysisMastery);

    // Identify weak concepts (mastery < 60%)
    const weakConcepts = conceptResult.rows.filter(c => c.mastery_score < 60).slice(0, 3);

    return NextResponse.json({
      performance: {
        totalQuizzes: parseInt(performance.total_quizzes) || 0,
        completedQuizzes: parseInt(performance.completed_quizzes) || 0,
        totalQuestions: parseInt(performance.total_questions_answered) || 0,
        correctAnswers: parseInt(performance.total_correct_answers) || 0,
        accuracy: Math.round(performance.average_score),
        overallMastery: finalOverallMastery
      },
      conceptMastery: conceptResult.rows.map(c => ({
        concept: c.concept,
        mastery: Math.round(c.mastery_score || 0),
        totalQuestions: parseInt(c.total_questions) || 0,
        correctAnswers: parseInt(c.correct_answers) || 0
      })),
      weakConcepts: weakConcepts.map(c => ({
        concept: c.concept,
        mastery: Math.round(c.mastery_score || 0),
        totalQuestions: parseInt(c.total_questions) || 0,
        correctAnswers: parseInt(c.correct_answers) || 0
      })),
      weeklyProgress: weeklyResult.rows.map(w => ({
        week_start: w.week_start,
        quizzes_completed: parseInt(w.quizzes_completed) || 0,
        average_score: Math.round(w.average_score || 0)
      })),
      gapAnalysis: gapResult.rows
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ 
      performance: {
        totalQuizzes: 0,
        completedQuizzes: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        overallMastery: 0
      },
      conceptMastery: [],
      weakConcepts: [],
      weeklyProgress: [],
      gapAnalysis: [],
      error: error.message 
    }, { status: 500 });
  }
}