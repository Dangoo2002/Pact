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

    const result = await query(`
      SELECT total_quizzes, completed_quizzes, total_questions_answered, 
             total_correct_answers, average_score, overall_mastery, 
             current_streak, longest_streak, performance_tier, last_activity_date
      FROM student_performance
      WHERE student_id = $1
    `, [studentId]);

    if (result.rows.length === 0) {
      // Return default values if no record exists
      return NextResponse.json({
        total_quizzes: 0,
        completed_quizzes: 0,
        total_questions_answered: 0,
        total_correct_answers: 0,
        average_score: 0,
        overall_mastery: 0,
        current_streak: 0,
        longest_streak: 0,
        performance_tier: 'beginner',
        last_activity_date: null
      });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Student performance API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}