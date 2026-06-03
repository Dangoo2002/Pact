// app/api/instructor/dashboard/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    // Get total students count from users table
    const totalStudentsResult = await query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'student'
    `);
    const totalStudents = parseInt(totalStudentsResult.rows[0]?.count || 0);

    // Get active students (with responses in last 7 days)
    const activeStudentsResult = await query(`
      SELECT COUNT(DISTINCT student_id) as count 
      FROM responses 
      WHERE timestamp > NOW() - INTERVAL '7 days'
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
    let intervalWeeks = period === 'week' ? 6 : period === 'month' ? 12 : 24;
    const performanceTrendResult = await query(`
      SELECT 
        DATE_TRUNC('week', timestamp) as week,
        ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END)) as avg
      FROM responses
      WHERE timestamp > NOW() - INTERVAL '${intervalWeeks} weeks'
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
      LEFT JOIN gap_profiles gp ON u.user_id = gp.student_id
      LEFT JOIN responses r ON u.user_id = r.student_id
      WHERE u.role = 'student'
        AND (gp.mastery_scores->>'overall')::float < 50
      GROUP BY u.user_id, u.full_name, gp.mastery_scores
      ORDER BY mastery ASC
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

    let excellentCount = 0, goodCount = 0, averageCount = 0, atRiskCount = 0;
    distributionResult.rows.forEach(row => {
      if (row.category === 'excellent') excellentCount = parseInt(row.count);
      if (row.category === 'good') goodCount = parseInt(row.count);
      if (row.category === 'average') averageCount = parseInt(row.count);
      if (row.category === 'at_risk') atRiskCount = parseInt(row.count);
    });

    const distributionData = [
      { name: 'Excellent (90%+)', value: excellentCount || 0, color: '#10b981' },
      { name: 'Good (70-89%)', value: goodCount || 0, color: '#8b5cf6' },
      { name: 'Average (50-69%)', value: averageCount || 0, color: '#f59e0b' },
      { name: 'At Risk (<50%)', value: atRiskCount || 0, color: '#ef4444' },
    ];

    // Format class progress data
    const classProgress = classProgressResult.rows.map(row => ({
      concept: row.concept,
      mastery: Math.round(row.mastery || 0)
    }));

    // Format performance trend data
    const performanceTrend = performanceTrendResult.rows.map((row, index) => ({
      week: `Week ${index + 1}`,
      avg: Math.round(row.avg || 0)
    }));

    // Format at-risk students
    const atRiskStudents = atRiskResult.rows.map(student => ({
      id: student.id,
      name: student.name || 'Unknown Student',
      mastery: parseInt(student.mastery) || 0,
      lastActive: student.last_active ? new Date(student.last_active).toLocaleDateString() : 'Never'
    }));

    return NextResponse.json({
      totalStudents,
      activeStudents,
      averageMastery,
      pendingAssignments: 0,
      classProgress: classProgress.length > 0 ? classProgress : [],
      performanceTrend: performanceTrend.length > 0 ? performanceTrend : [],
      distributionData,
      atRiskStudents
    });
  } catch (error) {
    console.error('Instructor Dashboard API error:', error);
    return NextResponse.json({
      totalStudents: 0,
      activeStudents: 0,
      averageMastery: 0,
      pendingAssignments: 0,
      classProgress: [],
      performanceTrend: [],
      distributionData: [
        { name: 'Excellent (90%+)', value: 0, color: '#10b981' },
        { name: 'Good (70-89%)', value: 0, color: '#8b5cf6' },
        { name: 'Average (50-69%)', value: 0, color: '#f59e0b' },
        { name: 'At Risk (<50%)', value: 0, color: '#ef4444' },
      ],
      atRiskStudents: []
    });
  }
}