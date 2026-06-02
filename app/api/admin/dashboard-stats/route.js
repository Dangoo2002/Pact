// app/api/admin/dashboard-stats/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usersResult = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'instructor' THEN 1 ELSE 0 END) as instructors,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
      FROM users
    `);
    
    const resourcesResult = await query('SELECT COUNT(*) as count FROM resources');
    const questionsResult = await query('SELECT COUNT(*) as count FROM questions');
    const responsesResult = await query('SELECT COUNT(*) as count FROM responses');

    return NextResponse.json({
      stats: {
        totalUsers: parseInt(usersResult.rows[0]?.total || 0),
        totalResources: parseInt(resourcesResult.rows[0]?.count || 0),
        totalQuestions: parseInt(questionsResult.rows[0]?.count || 0),
        totalResponses: parseInt(responsesResult.rows[0]?.count || 0)
      },
      userDistribution: [
        { name: 'Students', value: parseInt(usersResult.rows[0]?.students || 0), color: '#3b82f6' },
        { name: 'Instructors', value: parseInt(usersResult.rows[0]?.instructors || 0), color: '#8b5cf6' },
        { name: 'Admins', value: parseInt(usersResult.rows[0]?.admins || 0), color: '#10b981' }
      ],
      recentActivity: []
    });
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}