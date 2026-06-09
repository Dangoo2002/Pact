// app/api/instructor/students/route.js
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

    // Get all students with their mastery (including those with no data)
    const studentsResult = await query(`
      WITH student_mastery AS (
        SELECT 
          u.user_id as id,
          u.full_name as name,
          u.email,
          u.created_at,
          COALESCE(ROUND(AVG(ia.mastery_score)), 0) as mastery,
          COUNT(ia.session_id) as quiz_count,
          COUNT(DISTINCT ia.concept) as concepts_count,
          MAX(ia.analysis_date) as last_active
        FROM users u
        LEFT JOIN instructor_analytics ia ON u.user_id = ia.student_id
        WHERE u.role = 'student'
        GROUP BY u.user_id, u.full_name, u.email, u.created_at
      )
      SELECT 
        id,
        name,
        email,
        mastery,
        quiz_count,
        concepts_count,
        last_active,
        created_at,
        CASE 
          WHEN mastery < 50 OR quiz_count = 0 THEN 'at_risk'
          ELSE 'not_at_risk'
        END as risk_status,
        CASE 
          WHEN last_active > NOW() - INTERVAL '7 days' THEN 'active'
          ELSE 'inactive'
        END as status
      FROM student_mastery
      ORDER BY mastery DESC, name ASC
    `);

    const formattedStudents = studentsResult.rows.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      mastery: Math.round(student.mastery || 0),
      status: student.status,
      total_quizzes: parseInt(student.quiz_count) || 0,
      concepts_practiced: parseInt(student.concepts_count) || 0,
      last_active: student.last_active || student.created_at,
      isAtRisk: student.risk_status === 'at_risk'
    }));

    return NextResponse.json({ students: formattedStudents });
  } catch (error) {
    console.error('Students API error:', error);
    return NextResponse.json({ students: [], error: error.message });
  }
}