// app/api/admin/dashboard-stats/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get user counts
    const userStats = await query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);
    
    const totalUsers = userStats.rows.reduce((acc, curr) => acc + parseInt(curr.count), 0);
    
    // Get resource count
    const resourceCount = await query('SELECT COUNT(*) as count FROM resources');
    
    // Get question count
    const questionCount = await query('SELECT COUNT(*) as count FROM questions');
    
    // Get response count
    const responseCount = await query('SELECT COUNT(*) as count FROM responses');
    
    const userDistribution = [
      { name: 'Students', value: 0, color: '#3b82f6' },
      { name: 'Instructors', value: 0, color: '#8b5cf6' },
      { name: 'Admins', value: 0, color: '#10b981' }
    ];
    
    userStats.rows.forEach(stat => {
      if (stat.role === 'student') userDistribution[0].value = parseInt(stat.count);
      if (stat.role === 'instructor') userDistribution[1].value = parseInt(stat.count);
      if (stat.role === 'admin') userDistribution[2].value = parseInt(stat.count);
    });
    
    const recentActivity = [
      { action: 'System running', details: 'All systems operational', time: 'Just now', icon: 'system', color: 'green' }
    ];
    
    return NextResponse.json({
      stats: {
        totalUsers,
        totalResources: parseInt(resourceCount.rows[0].count),
        totalQuestions: parseInt(questionCount.rows[0].count),
        totalResponses: parseInt(responseCount.rows[0].count)
      },
      userDistribution,
      recentActivity
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}