// app/api/admin/dashboard-stats/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total users count by role
    const usersResult = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'instructor' THEN 1 ELSE 0 END) as instructors,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
      FROM users
    `);
    
    const totalUsers = parseInt(usersResult.rows[0]?.total || 0);
    const studentsCount = parseInt(usersResult.rows[0]?.students || 0);
    const instructorsCount = parseInt(usersResult.rows[0]?.instructors || 0);
    const adminsCount = parseInt(usersResult.rows[0]?.admins || 0);

    // Get total resources count
    const resourcesResult = await query('SELECT COUNT(*) as count FROM resources');
    const totalResources = parseInt(resourcesResult.rows[0]?.count || 0);

    // Get total questions count
    const questionsResult = await query('SELECT COUNT(*) as count FROM questions');
    const totalQuestions = parseInt(questionsResult.rows[0]?.count || 0);

    // Get total responses count
    const responsesResult = await query('SELECT COUNT(*) as count FROM responses');
    const totalResponses = parseInt(responsesResult.rows[0]?.count || 0);

    // User distribution for pie chart
    const userDistribution = [
      { name: 'Students', value: studentsCount, color: '#3b82f6' },
      { name: 'Instructors', value: instructorsCount, color: '#8b5cf6' },
      { name: 'Admins', value: adminsCount, color: '#10b981' },
    ];

    // Get recent activity
    const recentActivity = [];

    // Get recent user registrations
    const recentUsers = await query(`
      SELECT email, full_name, role, created_at 
      FROM users 
      WHERE created_at IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 3
    `);

    recentUsers.rows.forEach(user => {
      recentActivity.push({
        action: `New ${user.role} registered`,
        details: `${user.full_name || user.email} joined as ${user.role}`,
        time: timeAgo(new Date(user.created_at)),
        icon: 'user',
        color: user.role === 'student' ? 'blue' : user.role === 'instructor' ? 'purple' : 'green'
      });
    });

    // Get recent resource additions
    const recentResources = await query(`
      SELECT title, resource_type, created_at 
      FROM resources 
      WHERE created_at IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 2
    `);

    recentResources.rows.forEach(resource => {
      recentActivity.push({
        action: `New resource added`,
        details: `${resource.title} (${resource.resource_type})`,
        time: timeAgo(new Date(resource.created_at)),
        icon: 'resource',
        color: 'green'
      });
    });

    // Return the response with proper structure
    return NextResponse.json({
      stats: {
        totalUsers: totalUsers,
        totalResources: totalResources,
        totalQuestions: totalQuestions,
        totalResponses: totalResponses
      },
      userDistribution: userDistribution,
      recentActivity: recentActivity.slice(0, 5)
    });
    
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    
    // Return fallback data on error
    return NextResponse.json({
      stats: {
        totalUsers: 0,
        totalResources: 0,
        totalQuestions: 0,
        totalResponses: 0
      },
      userDistribution: [
        { name: 'Students', value: 0, color: '#3b82f6' },
        { name: 'Instructors', value: 0, color: '#8b5cf6' },
        { name: 'Admins', value: 0, color: '#10b981' }
      ],
      recentActivity: [
        { action: 'No recent activity', details: 'Check back later', time: 'just now', icon: 'system', color: 'gray' }
      ]
    });
  }
}

// Helper function to format time ago
function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}