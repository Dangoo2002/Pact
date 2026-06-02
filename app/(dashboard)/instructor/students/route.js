// app/api/instructor/dashboard-data/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    // Get total students
    const totalStudentsResult = await query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
    );
    const totalStudents = parseInt(totalStudentsResult.rows[0]?.count || 0);

    // Get active students (with responses in last 7 days)
    const activeStudentsResult = await query(`
      SELECT COUNT(DISTINCT r.student_id) as count 
      FROM responses r
      WHERE r.timestamp > NOW() - INTERVAL '7 days'
    `);
    const activeStudents = parseInt(activeStudentsResult.rows[0]?.count || 0);

    // Get average mastery from gap_profiles
    const avgMasteryResult = await query(`
      SELECT AVG((mastery_scores->>'overall')::float) as avg 
      FROM gap_profiles 
      WHERE generated_at > NOW() - INTERVAL '30 days'
    `);
    const averageMastery = Math.round(avgMasteryResult.rows[0]?.avg || 0);

    // Get class progress by concept from questions and responses
    const classProgressResult = await query(`
      SELECT 
        c.concept_name as concept,
        COALESCE(ROUND(AVG(CASE WHEN r.is_correct THEN 100 ELSE 0 END)), 0) as mastery
      FROM concepts c
      LEFT JOIN questions q ON c.concept_id = q.concept_id
      LEFT JOIN responses r ON q.question_id = r.question_id
      GROUP BY c.concept_name
      ORDER BY mastery DESC
      LIMIT 6
    `);

    // Get performance trend over weeks
    const weeksToShow = period === 'week' ? 6 : period === 'month' ? 12 : 24;
    const performanceTrendResult = await query(`
      SELECT 
        DATE_TRUNC('week', timestamp) as week,
        ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END)) as avg
      FROM responses
      WHERE timestamp > NOW() - INTERVAL '${weeksToShow} weeks'
      GROUP BY DATE_TRUNC('week', timestamp)
      ORDER BY week ASC
    `);

    // Get at-risk students (mastery below 50%)
    const atRiskResult = await query(`
      SELECT 
        u.user_id as id,
        u.full_name as name,
        ROUND((gp.mastery_scores->>'overall')::float) as mastery,
        COALESCE(MAX(r.timestamp)::date, CURRENT_DATE) as last_active
      FROM users u
      JOIN gap_profiles gp ON u.user_id = gp.student_id
      LEFT JOIN responses r ON u.user_id = r.student_id
      WHERE u.role = 'student'
        AND (gp.mastery_scores->>'overall')::float < 50
      GROUP BY u.user_id, u.full_name, gp.mastery_scores
      ORDER BY mastery ASC
      LIMIT 5
    `);

    // Get recent activity
    const recentActivityResult = await query(`
      (SELECT 
        'quiz' as type,
        'New quiz attempt' as action,
        CONCAT(u.full_name, ' completed a quiz') as details,
        r.timestamp as time,
        'purple' as color
      FROM responses r
      JOIN users u ON r.student_id = u.user_id
      ORDER BY r.timestamp DESC
      LIMIT 2)
      UNION ALL
      (SELECT 
        'student' as type,
        'New student' as action,
        CONCAT(u.full_name, ' joined the class') as details,
        u.created_at as time,
        'green' as color
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.created_at DESC
      LIMIT 1)
      ORDER BY time DESC
      LIMIT 5
    `);

    // Get student distribution counts
    const distributionResult = await query(`
      SELECT 
        CASE 
          WHEN (gp.mastery_scores->>'overall')::float >= 90 THEN 'excellent'
          WHEN (gp.mastery_scores->>'overall')::float >= 70 THEN 'good'
          WHEN (gp.mastery_scores->>'overall')::float >= 50 THEN 'average'
          ELSE 'at_risk'
        END as category,
        COUNT(*) as count
      FROM gap_profiles gp
      WHERE gp.generated_at > NOW() - INTERVAL '30 days'
      GROUP BY category
    `);

    let excellentCount = 0, goodCount = 0, averageCount = 0;
    distributionResult.rows.forEach(row => {
      if (row.category === 'excellent') excellentCount = parseInt(row.count);
      if (row.category === 'good') goodCount = parseInt(row.count);
      if (row.category === 'average') averageCount = parseInt(row.count);
    });

    return NextResponse.json({
      totalStudents,
      activeStudents,
      averageMastery,
      pendingReviews: 0,
      classProgress: classProgressResult.rows,
      performanceTrend: performanceTrendResult.rows.map(row => ({
        week: `Week ${new Date(row.week).getWeek()}`,
        avg: parseInt(row.avg)
      })),
      excellentCount,
      goodCount,
      averageCount,
      atRiskStudents: atRiskResult.rows.map(student => ({
        id: student.id,
        name: student.name,
        mastery: parseInt(student.mastery),
        lastActive: new Date(student.last_active).toLocaleDateString()
      })),
      recentActivity: recentActivityResult.rows.map(activity => ({
        type: activity.type,
        action: activity.action,
        details: activity.details,
        time: timeAgo(new Date(activity.time)),
        color: activity.color
      }))
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

// Add getWeek prototype for Date
Date.prototype.getWeek = function() {
  const date = new Date(this);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};