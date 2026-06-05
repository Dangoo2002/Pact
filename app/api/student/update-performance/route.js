import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, sessionId } = await request.json();

    // Get the completed quiz session
    const quizResult = await query(`
      SELECT session_id, concept, total_questions, score, percentage_score, performance_level, completed_at
      FROM quiz_sessions
      WHERE session_id = $1 AND student_id = $2 AND status = 'completed'
    `, [sessionId, studentId]);

    if (quizResult.rows.length === 0) {
      return NextResponse.json({ error: 'Quiz session not found' }, { status: 404 });
    }

    const quiz = quizResult.rows[0];
    const percentage = quiz.percentage_score || Math.round((quiz.score / quiz.total_questions) * 100);

    // Update student_performance table
    await query(`
      INSERT INTO student_performance (student_id, total_quizzes, completed_quizzes, total_questions_answered, total_correct_answers, average_score, overall_mastery, last_activity_date, updated_at)
      VALUES ($1, 1, 1, $2, $3, $4, $4, CURRENT_DATE, NOW())
      ON CONFLICT (student_id) DO UPDATE SET
        total_quizzes = student_performance.total_quizzes + 1,
        completed_quizzes = student_performance.completed_quizzes + 1,
        total_questions_answered = student_performance.total_questions_answered + $2,
        total_correct_answers = student_performance.total_correct_answers + $3,
        average_score = ((student_performance.average_score * student_performance.total_quizzes) + $4) / (student_performance.total_quizzes + 1),
        overall_mastery = ((student_performance.overall_mastery * student_performance.total_quizzes) + $4) / (student_performance.total_quizzes + 1),
        last_activity_date = CURRENT_DATE,
        updated_at = NOW()
    `, [studentId, quiz.total_questions, quiz.score, percentage]);

    // Update concept_performance
    const responses = await query(`
      SELECT concept, is_correct
      FROM responses r
      JOIN quiz_sessions qs ON r.session_id = qs.session_id
      WHERE r.student_id = $1 AND qs.concept = $2
    `, [studentId, quiz.concept]);

    const totalForConcept = responses.rows.length;
    const correctForConcept = responses.rows.filter(r => r.is_correct).length;
    const mastery = totalForConcept > 0 ? (correctForConcept / totalForConcept) * 100 : 0;

    await query(`
      INSERT INTO concept_performance (student_id, concept, total_questions, correct_answers, mastery_score, last_practiced)
      VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
      ON CONFLICT (student_id, concept) DO UPDATE SET
        total_questions = concept_performance.total_questions + $3,
        correct_answers = concept_performance.correct_answers + $4,
        mastery_score = ((concept_performance.mastery_score * concept_performance.total_questions) + $5) / (concept_performance.total_questions + $3),
        last_practiced = CURRENT_DATE
    `, [studentId, quiz.concept, quiz.total_questions, quiz.score, mastery]);

    // Update weekly progress
    const weekStart = getWeekStart(new Date());
    await query(`
      INSERT INTO weekly_progress (student_id, week_start, quizzes_completed, average_score)
      VALUES ($1, $2, 1, $3)
      ON CONFLICT (student_id, week_start) DO UPDATE SET
        quizzes_completed = weekly_progress.quizzes_completed + 1,
        average_score = ((weekly_progress.average_score * weekly_progress.quizzes_completed) + $3) / (weekly_progress.quizzes_completed + 1)
    `, [studentId, weekStart, percentage]);

    // Determine and update performance tier
    const performanceResult = await query(`
      SELECT average_score FROM student_performance WHERE student_id = $1
    `, [studentId]);
    
    const avgScore = performanceResult.rows[0]?.average_score || 0;
    let performanceTier = 'beginner';
    if (avgScore >= 80) performanceTier = 'excellent';
    else if (avgScore >= 60) performanceTier = 'average';
    else performanceTier = 'needs_improvement';

    await query(`
      UPDATE student_performance SET performance_tier = $1 WHERE student_id = $2
    `, [performanceTier, studentId]);

    return NextResponse.json({
      success: true,
      performance_tier: performanceTier,
      average_score: avgScore
    });
  } catch (error) {
    console.error('Update performance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}