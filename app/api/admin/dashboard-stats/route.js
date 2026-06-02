// app/api/admin/dashboard-stats/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user counts
    const usersResult = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'instructor' THEN 1 ELSE 0 END) as instructors,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
      FROM users
    `);
    
    // Get resources count
    const resourcesResult = await query('SELECT COUNT(*) as count FROM resources');
    
    // Get questions count
    const questionsResult = await query('SELECT COUNT(*) as count FROM questions');
    
    // Get responses count
    const responsesResult = await query('SELECT COUNT(*) as count FROM responses');
    
    const totalUsers = parseInt(usersResult.rows[0]?.total || 0);
    const studentsCount = parseInt(usersResult.rows[0]?.students || 0);
    const instructorsCount = parseInt(usersResult.rows[0]?.instructors || 0);
    const adminsCount = parseInt(usersResult.rows[0]?.admins || 0);

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers,
        totalResources: parseInt(resourcesResult.rows[0]?.count || 0),
        totalQuestions: parseInt(questionsResult.rows[0]?.count || 0),
        totalResponses: parseInt(responsesResult.rows[0]?.count || 0)
      },
      userDistribution: [
        { name: 'Students', value: studentsCount, color: '#3b82f6' },
        { name: 'Instructors', value: instructorsCount, color: '#8b5cf6' },
        { name: 'Admins', value: adminsCount, color: '#10b981' }
      ],
      recentActivity: []
    });
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}