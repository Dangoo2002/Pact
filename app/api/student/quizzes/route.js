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
    const language = searchParams.get('language') || 'python';
    const concept = searchParams.get('concept') || 'variables';

    // Get available quizzes from concepts
    const quizzes = await query(`
      SELECT DISTINCT 
        c.concept_name as title,
        c.concept_id as id,
        c.category as language,
        CASE 
          WHEN c.difficulty <= 2 THEN 'beginner'
          WHEN c.difficulty <= 4 THEN 'intermediate'
          ELSE 'advanced'
        END as difficulty,
        10 as question_count,
        15 as estimated_time
      FROM concepts c
      WHERE ($1::text IS NULL OR c.category = $1 OR c.concept_name ILIKE $1)
         OR ($2::text IS NULL OR c.concept_name = $2)
      ORDER BY c.difficulty
      LIMIT 10
    `, [language === 'all' ? null : language, concept === 'all' ? null : concept]);

    // Get user's progress for each quiz
    for (let quiz of quizzes.rows) {
      const progress = await query(`
        SELECT COUNT(*) as completed
        FROM responses r
        JOIN questions q ON r.question_id = q.question_id
        JOIN concepts c ON q.concept_id = c.concept_id
        WHERE r.student_id = $1 AND c.concept_name = $2
      `, [studentId, quiz.title]);
      
      quiz.progress = progress.rows[0]?.completed ? Math.min(100, Math.floor(progress.rows[0].completed / 10 * 100)) : 0;
    }

    return NextResponse.json({ quizzes: quizzes.rows });
  } catch (error) {
    console.error('Quizzes API error:', error);
    return NextResponse.json({ quizzes: [] });
  }
}