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
    const languageFilter = searchParams.get('language') || 'all';
    const conceptFilter = searchParams.get('concept') || 'all';

    // Get concepts from concepts table
    let queryText = `
      SELECT 
        c.concept_id as id,
        c.concept_name as title,
        c.category as language,
        CASE 
          WHEN c.difficulty = 1 THEN 'beginner'
          WHEN c.difficulty <= 3 THEN 'intermediate'
          ELSE 'advanced'
        END as difficulty,
        COUNT(q.question_id) as question_count,
        15 as estimated_time,
        c.difficulty as level
      FROM concepts c
      LEFT JOIN questions q ON c.concept_id = q.concept_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (languageFilter !== 'all') {
      queryText += ` AND c.category = $${params.length + 1}`;
      params.push(languageFilter);
    }
    
    if (conceptFilter !== 'all') {
      queryText += ` AND c.concept_name ILIKE $${params.length + 1}`;
      params.push(`%${conceptFilter}%`);
    }
    
    queryText += ` GROUP BY c.concept_id, c.concept_name, c.category, c.difficulty ORDER BY c.difficulty LIMIT 20`;
    
    const result = await query(queryText, params);
    let quizzes = result.rows;

    // Get user's progress for each concept
    for (let quiz of quizzes) {
      // Get total questions for this concept
      const totalQuestionsResult = await query(`
        SELECT COUNT(*) as total
        FROM questions q
        WHERE q.concept_id = $1
      `, [quiz.id]);
      
      const totalQuestions = parseInt(totalQuestionsResult.rows[0]?.total || 1);
      
      // Get completed questions by student for this concept
      const progressResult = await query(`
        SELECT COUNT(DISTINCT r.question_id) as completed
        FROM responses r
        JOIN questions q ON r.question_id = q.question_id
        WHERE r.student_id = $1 AND q.concept_id = $2 AND r.is_correct = true
      `, [studentId, quiz.id]);
      
      const completed = parseInt(progressResult.rows[0]?.completed || 0);
      quiz.progress = Math.min(100, Math.floor((completed / totalQuestions) * 100));
      quiz.question_count = totalQuestions;
    }

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('Quizzes API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}