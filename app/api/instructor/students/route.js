// app/api/instructor/students/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const students = await query(`
      SELECT 
        u.user_id as id,
        u.full_name as name,
        u.email,
        COALESCE((gp.mastery_scores->>'overall')::float * 100, 0) as mastery,
        CASE WHEN r.timestamp > NOW() - INTERVAL '7 days' THEN 'active' ELSE 'inactive' END as status
      FROM users u
      LEFT JOIN gap_profiles gp ON u.user_id = gp.student_id
      LEFT JOIN (SELECT DISTINCT student_id, MAX(timestamp) as timestamp FROM responses GROUP BY student_id) r ON u.user_id = r.student_id
      WHERE u.role = 'student'
      ORDER BY u.full_name
    `);

    return NextResponse.json({ students: students.rows });
  } catch (error) {
    console.error('Students API error:', error);
    return NextResponse.json({ students: [] });
  }
}