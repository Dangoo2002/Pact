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
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get quiz session - don't filter by student_id here
    const sessionResult = await query(`
      SELECT session_id, student_id, concept, language, total_questions, 
             current_question_index, score, status
      FROM quiz_sessions
      WHERE session_id = $1
    `, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const quizSession = sessionResult.rows[0];
    
    return NextResponse.json({
      session_id: sessionId,
      current_question: null,
      total_questions: parseInt(quizSession.total_questions),
      questions_answered: parseInt(quizSession.current_question_index || 0),
      score: parseInt(quizSession.score || 0),
      time_left: 600
    });
  } catch (error) {
    console.error('Load quiz error:', error);
    return NextResponse.json({ error: 'Failed to load quiz: ' + error.message }, { status: 500 });
  }
}