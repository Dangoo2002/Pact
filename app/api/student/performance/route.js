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
    const concept = searchParams.get('concept');

    if (!studentId || !concept) {
      return NextResponse.json({ error: 'Student ID and concept required' }, { status: 400 });
    }

    const responses = await query(`
      SELECT r.*
      FROM responses r
      JOIN quiz_sessions qs ON r.session_id = qs.session_id
      WHERE r.student_id = $1 AND qs.concept = $2
    `, [studentId, concept]);

    const totalCount = responses.rows.length;
    const correctCount = responses.rows.filter(r => r.is_correct).length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    return NextResponse.json({
      concept,
      total_count: totalCount,
      correct_count: correctCount,
      accuracy: accuracy,
      responses: responses.rows.slice(0, 20)
    });
  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}