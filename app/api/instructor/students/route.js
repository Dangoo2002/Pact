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
        COALESCE(ROUND(AVG(CASE WHEN r.is_correct THEN 100 ELSE 0 END)), 0) as mastery,
        CASE 
          WHEN MAX(r.timestamp) > NOW() - INTERVAL '7 days' THEN 'active'
          ELSE 'inactive'
        END as status,
        COALESCE(MAX(r.timestamp), u.created_at) as last_active,
        COUNT(DISTINCT r.response_id) as total_attempts
      FROM users u
      LEFT JOIN responses r ON u.user_id = r.student_id
      WHERE u.role = 'student'
      GROUP BY u.user_id, u.full_name, u.email, u.created_at
      ORDER BY u.full_name
    `);

    return NextResponse.json({ 
      students: students.rows.map(s => ({
        ...s,
        mastery: Math.round(s.mastery || 0)
      }))
    });
  } catch (error) {
    console.error('Students API error:', error);
    return NextResponse.json({ students: [] });
  }
}