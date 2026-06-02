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
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);

    let totalUsers = 0;
    const userDistribution = [];

    usersResult.rows.forEach(row => {
      totalUsers += parseInt(row.count);
      let color = '';
      let name = '';
      
      if (row.role === 'student') {
        name = 'Students';
        color = '#3b82f6';
      } else if (row.role === 'instructor') {
        name = 'Instructors';
        color = '#8b5cf6';
      } else if (row.role === 'admin') {
        name = 'Admins';
        color = '#10b981';
      }
      
      userDistribution.push({
        name,
        value: parseInt(row.count),
        color
      });
    });

    // Get total resources count
    const resourcesResult = await query('SELECT COUNT(*) as count FROM resources');
    const totalResources = parseInt(resourcesResult.rows[0]?.count || 0);

    // Get total questions count
    const questionsResult = await query('SELECT COUNT(*) as count FROM questions');
    const totalQuestions = parseInt(questionsResult.rows[0]?.count || 0);

    // Get total responses count
    const responsesResult = await query('SELECT COUNT(*) as count FROM responses');
    const totalResponses = parseInt(responsesResult.rows[0]?.count || 0);

    // Get recent activity
    const recentActivity = [];

    // Get recent user registrations
    const recentUsers = await query(`
      SELECT email, full_name, role, created_at 
      FROM users 
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

    // Sort by time (most recent first) and limit to 5
    recentActivity.sort((a, b) => {
      const timeA = parseTimeAgo(a.time);
      const timeB = parseTimeAgo(b.time);
      return timeA - timeB;
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalResources,
        totalQuestions,
        totalResponses
      },
      userDistribution,
      recentActivity: recentActivity.slice(0, 5)
    });
  } catch (error) {
    console.error('Dashboard stats API error:', error);
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
      recentActivity: []
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

// Helper function to parse time ago string to timestamp for sorting
function parseTimeAgo(timeStr) {
  if (timeStr === 'just now') return Date.now();
  const minutes = parseInt(timeStr);
  if (timeStr.includes('min')) return Date.now() - minutes * 60 * 1000;
  const hours = parseInt(timeStr);
  if (timeStr.includes('hour')) return Date.now() - hours * 60 * 60 * 1000;
  const days = parseInt(timeStr);
  if (timeStr.includes('day')) return Date.now() - days * 24 * 60 * 60 * 1000;
  return 0;
}