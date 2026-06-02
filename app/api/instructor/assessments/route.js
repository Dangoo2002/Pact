// app/api/instructor/assessments/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assessments = await query(`
      SELECT 
        q.question_id as id,
        'Quiz ' || q.question_id as title,
        'Assessment for ' || c.concept_name as description,
        COUNT(*) OVER() as questionCount,
        30 as duration,
        (NOW() + INTERVAL '7 days')::date as dueDate
      FROM questions q
      JOIN concepts c ON q.concept_id = c.concept_id
      LIMIT 10
    `);

    return NextResponse.json({ assessments: assessments.rows });
  } catch (error) {
    console.error('Assessments API error:', error);
    return NextResponse.json({ assessments: [] });
  }
}