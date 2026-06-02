// app/api/student/quizzes/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    const quizzes = await query(`
      SELECT 
        q.question_id as id,
        'Quiz ' || q.question_id as title,
        c.concept_name as language,
        CASE 
          WHEN q.difficulty < 3 THEN 'beginner'
          WHEN q.difficulty < 7 THEN 'intermediate'
          ELSE 'advanced'
        END as difficulty,
        10 as estimated_time,
        1 as question_count,
        COALESCE(
          (SELECT COUNT(*) FROM responses r WHERE r.question_id = q.question_id AND r.student_id = $1 AND r.is_correct = true)::float / 
          NULLIF((SELECT COUNT(*) FROM responses r WHERE r.question_id = q.question_id AND r.student_id = $1), 0) * 100, 
          0
        ) as progress
      FROM questions q
      JOIN concepts c ON q.concept_id = c.concept_id
      LIMIT 10
    `, [studentId]);

    return NextResponse.json({ 
      quizzes: quizzes.rows.map(q => ({ 
        ...q, 
        progress: Math.round(q.progress),
        language: q.language || 'Python'
      })) 
    });
  } catch (error) {
    console.error('Quizzes API error:', error);
    return NextResponse.json({ quizzes: [] });
  }
}