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
      SELECT concept, total_questions, correct_answers, mastery_score, last_practiced, trend
      FROM concept_performance
      WHERE student_id = $1
      ORDER BY mastery_score DESC
    `, [studentId]);

    return NextResponse.json({
      concepts: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Concept performance API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}