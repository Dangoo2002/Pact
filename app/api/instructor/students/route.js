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

    // Get all students with their mastery calculated from actual quiz scores
    const studentsResult = await query(`
      WITH student_quiz_performance AS (
        SELECT 
          u.user_id as id,
          u.full_name as name,
          u.email,
          u.created_at,
          COALESCE(
            ROUND(AVG(CASE WHEN qs.status = 'completed' THEN qs.score::numeric / qs.total_questions * 100 ELSE NULL END)),
            0
          ) as mastery,
          COUNT(CASE WHEN qs.status = 'completed' THEN 1 END) as quiz_count,
          COUNT(DISTINCT CASE WHEN qs.status = 'completed' THEN qs.concept END) as concepts_count,
          MAX(qs.completed_at) as last_active
        FROM users u
        LEFT JOIN quiz_sessions qs ON qs.student_id::integer = u.user_id
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
      FROM student_quiz_performance
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