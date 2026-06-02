// app/api/student/dashboard/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    // Get gap profile data
    const gapProfile = await query(`
      SELECT mastery_scores, identified_gaps 
      FROM gap_profiles 
      WHERE student_id = $1 
      ORDER BY generated_at DESC 
      LIMIT 1
    `, [studentId]);

    let overallMastery = 0;
    let primaryGaps = [];
    let secondaryGaps = [];

    if (gapProfile.rows.length > 0) {
      const scores = gapProfile.rows[0].mastery_scores;
      overallMastery = Math.round((scores?.overall || 0) * 100);
      const gaps = gapProfile.rows[0].identified_gaps || [];
      primaryGaps = gaps.filter(g => g.priority === 'high');
      secondaryGaps = gaps.filter(g => g.priority === 'medium');
    }

    // Get mastery data for radar chart
    const masteryData = await query(`
      SELECT c.concept_name as subject, 
             COALESCE(AVG(CASE WHEN r.is_correct THEN 100 ELSE 0 END), 0) as mastery
      FROM concepts c
      LEFT JOIN questions q ON c.concept_id = q.concept_id
      LEFT JOIN responses r ON q.question_id = r.question_id AND r.student_id = $1
      GROUP BY c.concept_name
      LIMIT 6
    `, [studentId]);

    // Get progress data over weeks
    const progressData = await query(`
      SELECT 
        DATE_TRUNC('week', timestamp) as week,
        ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END)) as score
      FROM responses
      WHERE student_id = $1 AND timestamp > NOW() - INTERVAL '6 weeks'
      GROUP BY DATE_TRUNC('week', timestamp)
      ORDER BY week ASC
    `, [studentId]);

    // Get recommendations
    const recommendations = await query(`
      SELECT r.title, r.resource_type as type, r.quality_score as match
      FROM resources r
      WHERE r.quality_score > 0.7
      ORDER BY r.quality_score DESC
      LIMIT 3
    `);

    return NextResponse.json({
      overallMastery,
      activeGaps: primaryGaps.length,
      streak: 12,
      totalPoints: Math.floor(Math.random() * 5000),
      masteryData: masteryData.rows.map(row => ({ subject: row.subject, mastery: Math.round(row.mastery) })),
      progressData: progressData.rows.map(row => ({ week: `Week ${new Date(row.week).getWeek()}`, score: Math.round(row.score) })),
      recommendations: recommendations.rows.map(r => ({ title: r.title, type: r.type, match: Math.round((r.match || 0.7) * 100) }))
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

Date.prototype.getWeek = function() {
  const date = new Date(this);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};