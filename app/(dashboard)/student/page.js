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

    const responses = await query(`
      SELECT r.*, qs.concept, qs.language
      FROM responses r
      JOIN quiz_sessions qs ON r.session_id = qs.session_id
      WHERE r.student_id = $1
      ORDER BY r.timestamp DESC
    `, [studentId]);

    return NextResponse.json({ responses: responses.rows });
  } catch (error) {
    console.error('Responses API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}