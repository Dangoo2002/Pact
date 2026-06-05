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

    // Get student performance
    const performanceResult = await query(`
      SELECT total_quizzes, completed_quizzes, total_questions_answered, 
             total_correct_answers, average_score, overall_mastery
      FROM student_performance
      WHERE student_id = $1
    `, [studentId]);

    // Get concept mastery
    const conceptResult = await query(`
      SELECT concept, total_questions, correct_answers, mastery_score, trend
      FROM concept_performance
      WHERE student_id = $1
      ORDER BY mastery_score ASC
    `, [studentId]);

    // Get weekly progress
    const weeklyResult = await query(`
      SELECT week_start, quizzes_completed, average_score
      FROM weekly_progress
      WHERE student_id = $1
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

    // Identify weak concepts (mastery < 60%)
    const weakConcepts = conceptResult.rows.filter(c => c.mastery_score < 60).slice(0, 3);

    return NextResponse.json({
      performance: {
        totalQuizzes: performance.total_quizzes,
        completedQuizzes: performance.completed_quizzes,
        totalQuestions: performance.total_questions_answered,
        correctAnswers: performance.total_correct_answers,
        accuracy: Math.round(performance.average_score),
        overallMastery: Math.round(performance.overall_mastery)
      },
      conceptMastery: conceptResult.rows.map(c => ({
        concept: c.concept,
        mastery: Math.round(c.mastery_score),
        totalQuestions: c.total_questions,
        correctAnswers: c.correct_answers,
        trend: c.trend
      })),
      weakConcepts: weakConcepts.map(c => ({
        concept: c.concept,
        mastery: Math.round(c.mastery_score),
        totalQuestions: c.total_questions,
        correctAnswers: c.correct_answers
      })),
      weeklyProgress: weeklyResult.rows.map(w => ({
        week_start: w.week_start,
        quizzes_completed: w.quizzes_completed,
        average_score: Math.round(w.average_score)
      })),
      gapAnalysis: gapResult.rows
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}