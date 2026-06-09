// app/api/admin/dashboard-stats/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user statistics
    const userStats = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'instructor' THEN 1 ELSE 0 END) as instructors,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
      FROM users
    `);

    // Get quiz statistics
    const quizStats = await query(`
      SELECT COUNT(*) as count FROM quiz_sessions
    `);

    // Get response statistics
    const responseStats = await query(`
      SELECT COUNT(*) as count FROM responses
    `);

    // Get question statistics
    const questionStats = await query(`
      SELECT COUNT(*) as count FROM questions
    `);

    // Get resource statistics
    const resourceStats = await query(`
      SELECT COUNT(*) as count FROM resources
    `);

    // Get recent user registrations
    const recentUsers = await query(`
      SELECT 
        email, 
        full_name, 
        role, 
        created_at,
        'user_registration' as type
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    // Get recent quiz completions
    const recentQuizzes = await query(`
      SELECT 
        qs.session_id,
        u.full_name as user_name,
        qs.concept,
        qs.score,
        qs.completed_at,
        'quiz_completed' as type
      FROM quiz_sessions qs
      JOIN users u ON u.user_id = qs.student_id::integer
      WHERE qs.status = 'completed' AND qs.completed_at IS NOT NULL
      ORDER BY qs.completed_at DESC
      LIMIT 10
    `);

    // Build recent activities
    const recentActivities = [];
    
    for (const user of recentUsers.rows) {
      recentActivities.push({
        action: `New ${user.role} registered`,
        details: `${user.full_name || user.email} joined the platform`,
        time: timeAgo(new Date(user.created_at)),
        type: 'user_registration'
      });
    }
    
    for (const quiz of recentQuizzes.rows) {
      recentActivities.push({
        action: `Quiz completed`,
        details: `${quiz.user_name} completed ${quiz.concept} quiz`,
        time: timeAgo(new Date(quiz.completed_at)),
        type: 'quiz_completed'
      });
    }
    
    // Sort by time (most recent first)
    recentActivities.sort((a, b) => {
      const timeA = parseTimeAgo(a.time);
      const timeB = parseTimeAgo(b.time);
      return timeB - timeA;
    });

    // Get daily activity for last 7 days
    const dailyActivity = await query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC
    `);

    const formattedDailyActivity = dailyActivity.rows.map(row => ({
      date: new Date(row.date).toLocaleDateString(),
      count: parseInt(row.count)
    }));

    // Build user distribution
    const userDistribution = [
      { name: 'Students', value: parseInt(userStats.rows[0]?.students || 0), color: '#3b82f6' },
      { name: 'Instructors', value: parseInt(userStats.rows[0]?.instructors || 0), color: '#8b5cf6' },
      { name: 'Admins', value: parseInt(userStats.rows[0]?.admins || 0), color: '#10b981' }
    ];

    return NextResponse.json({
      stats: {
        totalUsers: parseInt(userStats.rows[0]?.total || 0),
        totalStudents: parseInt(userStats.rows[0]?.students || 0),
        totalInstructors: parseInt(userStats.rows[0]?.instructors || 0),
        totalAdmins: parseInt(userStats.rows[0]?.admins || 0),
        totalQuizzes: parseInt(quizStats.rows[0]?.count || 0),
        totalResponses: parseInt(responseStats.rows[0]?.count || 0),
        totalQuestions: parseInt(questionStats.rows[0]?.count || 0),
        totalResources: parseInt(resourceStats.rows[0]?.count || 0)
      },
      userDistribution,
      recentActivities: recentActivities.slice(0, 10),
      dailyActivity: formattedDailyActivity
    });
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json({ 
      stats: {
        totalUsers: 0,
        totalStudents: 0,
        totalInstructors: 0,
        totalAdmins: 0,
        totalQuizzes: 0,
        totalResponses: 0,
        totalQuestions: 0,
        totalResources: 0
      },
      userDistribution: [
        { name: 'Students', value: 0, color: '#3b82f6' },
        { name: 'Instructors', value: 0, color: '#8b5cf6' },
        { name: 'Admins', value: 0, color: '#10b981' }
      ],
      recentActivities: [],
      dailyActivity: []
    });
  }
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

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