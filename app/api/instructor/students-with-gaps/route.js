// app/api/instructor/students-with-gaps/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ALL students with their mastery (including those with no data)
    const studentsResult = await query(`
      WITH student_mastery AS (
        SELECT 
          u.user_id as id,
          u.full_name as name,
          COALESCE(ROUND(AVG(ia.mastery_score)), 0) as mastery,
          COUNT(DISTINCT ia.session_id) as quiz_count,
          COUNT(DISTINCT ia.concept) as gap_count,
          MAX(ia.analysis_date) as last_active,
          -- Get the concept with lowest mastery as top gap
          (
            SELECT concept 
            FROM instructor_analytics ia2 
            WHERE ia2.student_id = u.user_id 
            ORDER BY ia2.mastery_score ASC 
            LIMIT 1
          ) as top_gap
        FROM users u
        LEFT JOIN instructor_analytics ia ON u.user_id = ia.student_id
        WHERE u.role = 'student'
        GROUP BY u.user_id, u.full_name
      )
      SELECT 
        id,
        name,
        mastery,
        quiz_count,
        gap_count,
        last_active,
        top_gap,
        CASE 
          WHEN mastery < 50 OR quiz_count = 0 THEN 'at_risk'
          ELSE 'not_at_risk'
        END as risk_status
      FROM student_mastery
      ORDER BY mastery ASC
    `);

    // Filter to only at-risk students (mastery < 50 OR no quizzes)
    const atRiskStudents = studentsResult.rows.filter(s => s.risk_status === 'at_risk');

    // Format the response
    const formattedStudents = atRiskStudents.map(student => ({
      id: student.id,
      name: student.name,
      mastery: Math.round(student.mastery || 0),
      gap_count: parseInt(student.gap_count) || 0,
      quiz_count: parseInt(student.quiz_count) || 0,
      top_gap: student.top_gap?.replace(/_/g, ' ') || 'No quizzes taken yet',
      last_active: student.last_active,
      status: student.last_active && new Date(student.last_active) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 'active' : 'inactive'
    }));

    return NextResponse.json({ 
      students: formattedStudents,
      total_at_risk: formattedStudents.length
    });
  } catch (error) {
    console.error('Students with gaps API error:', error);
    return NextResponse.json({ students: [], total_at_risk: 0, error: error.message });
  }
}