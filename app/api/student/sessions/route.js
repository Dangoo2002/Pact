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

    const sessions = await query(`
      SELECT session_id, student_id, concept, status, score, total_questions, 
             started_at, completed_at
      FROM quiz_sessions
      WHERE student_id = $1
      ORDER BY started_at DESC
    `, [studentId]);

    return NextResponse.json({ sessions: sessions.rows });
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}