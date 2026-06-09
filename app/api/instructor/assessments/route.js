// app/api/instructor/assessments/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get assessments from concepts table with question counts
    const assessments = await query(`
      SELECT 
        c.concept_id as id,
        'Assessment: ' || c.concept_name as title,
        'Test your knowledge on ' || c.concept_name || ' concepts' as description,
        COALESCE(COUNT(DISTINCT q.question_id), 5) as "questionCount",
        30 as duration,
        NOW() as "createdAt"
      FROM concepts c
      LEFT JOIN questions q ON c.concept_id = q.concept_id
      GROUP BY c.concept_id, c.concept_name
      ORDER BY c.concept_name
      LIMIT 10
    `);

    return NextResponse.json({ assessments: assessments.rows || [] });
  } catch (error) {
    console.error('Assessments API error:', error);
    return NextResponse.json({ assessments: [], error: error.message });
  }
}