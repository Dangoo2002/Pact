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

    // All 7 languages mapping
    const languageMapping = {
      'python': 'python',
      'javascript': 'javascript',
      'java': 'java',
      'c++': 'cpp',
      'typescript': 'typescript',
      'go': 'go',
      'rust': 'rust'
    };

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
        5 as question_count,
        5 as estimated_time,
        c.difficulty as level
      FROM concepts c
      WHERE 1=1
    `;
    
    const params = [];
    
    if (languageFilter !== 'all') {
      queryText += ` AND LOWER(c.category) = $${params.length + 1}`;
      params.push(languageFilter.toLowerCase());
    }
    
    if (conceptFilter !== 'all') {
      queryText += ` AND c.concept_name ILIKE $${params.length + 1}`;
      params.push(`%${conceptFilter}%`);
    }
    
    queryText += ` ORDER BY c.difficulty LIMIT 50`;
    
    const result = await query(queryText, params);
    
    // If no concepts found for the selected language, create dynamic concepts
    let quizzes = result.rows;
    
    if (quizzes.length === 0 && languageFilter !== 'all') {
      // Generate dynamic concepts for the selected language
      const dynamicConcepts = ['variables', 'data_types', 'operators', 'conditionals', 'loops', 'functions', 'arrays', 'strings'];
      quizzes = dynamicConcepts.map((concept, idx) => ({
        id: idx + 1000,
        title: concept,
        language: languageFilter,
        difficulty: idx < 3 ? 'beginner' : idx < 6 ? 'intermediate' : 'advanced',
        question_count: 5,
        estimated_time: 5,
        level: idx < 3 ? 1 : idx < 6 ? 2 : 3,
        progress: 0
      }));
    }

    // Get user's progress for each concept
    for (let quiz of quizzes) {
      try {
        const progressResult = await query(`
          SELECT COUNT(DISTINCT r.response_id) as completed
          FROM responses r
          JOIN quiz_sessions qs ON r.session_id = qs.session_id
          WHERE r.student_id = $1 AND qs.concept = $2 AND r.is_correct = true
        `, [studentId, quiz.title]);
        
        const completed = parseInt(progressResult.rows[0]?.completed || 0);
        quiz.progress = Math.min(100, Math.floor((completed / 5) * 100));
      } catch (err) {
        quiz.progress = 0;
      }
    }

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('Quizzes API error:', error);
    return NextResponse.json({ quizzes: [] });
  }
}