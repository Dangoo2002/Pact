// app/api/instructor/assessments-data/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all students with their mastery
    const studentMasteryResult = await query(`
      WITH student_mastery AS (
        SELECT 
          u.user_id as id,
          u.full_name as name,
          COALESCE(ROUND(AVG(ia.mastery_score)), 0) as mastery,
          COUNT(DISTINCT ia.session_id) as total_quizzes,
          COUNT(DISTINCT ia.concept) as concepts_mastered,
          MAX(ia.analysis_date) as last_active
        FROM users u
        LEFT JOIN instructor_analytics ia ON u.user_id = ia.student_id
        WHERE u.role = 'student'
        GROUP BY u.user_id, u.full_name
      )
      SELECT * FROM student_mastery ORDER BY mastery DESC
    `);
    
    const studentPerformance = studentMasteryResult.rows.map(s => ({
      id: s.id,
      name: s.name,
      mastery: parseInt(s.mastery) || 0,
      totalQuizzes: parseInt(s.total_quizzes) || 0,
      conceptsMastered: parseInt(s.concepts_mastered) || 0
    }));

    // Calculate at-risk count (mastery < 50)
    const atRiskCount = studentPerformance.filter(s => s.mastery < 50).length;
    const topPerformersCount = studentPerformance.filter(s => s.mastery >= 70).length;

    // Get overall stats from quiz_sessions
    const overallStatsResult = await query(`
      SELECT 
        COUNT(DISTINCT session_id) as total_assessments,
        COALESCE(ROUND(AVG(score::numeric / total_questions * 100)), 0) as avg_score,
        COALESCE(ROUND(COUNT(CASE WHEN score::numeric / total_questions * 100 >= 60 THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100), 0) as pass_rate
      FROM quiz_sessions
      WHERE status = 'completed'
    `);

    // Get performance trend (daily average scores for last 30 days)
    const trendResult = await query(`
      SELECT 
        DATE_TRUNC('day', started_at) as date,
        ROUND(AVG(score::numeric / total_questions * 100)) as avg_score
      FROM quiz_sessions
      WHERE status = 'completed' AND started_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', started_at)
      ORDER BY date ASC
    `);

    const performanceTrend = trendResult.rows.map(row => ({
      date: new Date(row.date).toLocaleDateString(),
      score: parseInt(row.avg_score) || 0
    }));

    // Get concept mastery from instructor_analytics
    const conceptResult = await query(`
      SELECT 
        concept,
        ROUND(AVG(mastery_score)) as mastery,
        COUNT(DISTINCT student_id) as student_count
      FROM instructor_analytics
      WHERE mastery_score IS NOT NULL
      GROUP BY concept
      ORDER BY mastery ASC
      LIMIT 10
    `);

    const conceptMastery = conceptResult.rows.map(row => ({
      concept: row.concept?.replace(/_/g, ' ') || row.concept,
      mastery: parseInt(row.mastery) || 0
    }));

    // Build performance distribution
    const distributionCounts = {
      excellent: studentPerformance.filter(s => s.mastery >= 80).length,
      good: studentPerformance.filter(s => s.mastery >= 60 && s.mastery < 80).length,
      average: studentPerformance.filter(s => s.mastery >= 50 && s.mastery < 60).length,
      atRisk: atRiskCount
    };

    const classDistribution = [
      { name: 'Excellent (80%+)', count: distributionCounts.excellent, color: '#10b981' },
      { name: 'Good (60-79%)', count: distributionCounts.good, color: '#8b5cf6' },
      { name: 'Average (50-59%)', count: distributionCounts.average, color: '#f59e0b' },
      { name: 'At Risk (<50%)', count: distributionCounts.atRisk, color: '#ef4444' }
    ];

    // Get weekly progress (last 6 weeks)
    const weeklyResult = await query(`
      SELECT 
        DATE_TRUNC('week', started_at) as week,
        COUNT(*) as completed
      FROM quiz_sessions
      WHERE status = 'completed' AND started_at > NOW() - INTERVAL '6 weeks'
      GROUP BY DATE_TRUNC('week', started_at)
      ORDER BY week ASC
    `);

    const weeklyProgress = weeklyResult.rows.map((row, idx) => ({
      week: `Week ${idx + 1}`,
      completed: parseInt(row.completed) || 0
    }));

    // Get recent assessments
    const recentResult = await query(`
      SELECT 
        qs.session_id,
        qs.student_id,
        u.full_name as student_name,
        qs.concept as title,
        ROUND(qs.score::numeric / qs.total_questions * 100) as score,
        qs.status,
        qs.completed_at as date
      FROM quiz_sessions qs
      JOIN users u ON u.user_id = qs.student_id::integer
      WHERE qs.status = 'completed'
      ORDER BY qs.completed_at DESC
      LIMIT 20
    `);

    const recentAssessments = recentResult.rows.map(row => ({
      sessionId: row.session_id,
      studentId: row.student_id,
      studentName: row.student_name,
      title: row.title?.replace(/_/g, ' ') || row.title,
      score: parseInt(row.score) || 0,
      status: row.status,
      date: row.date
    }));

    // Calculate improvement rate (compare last 2 weeks to previous 2 weeks)
    let improvementRate = 0;
    if (performanceTrend.length >= 4) {
      const recentAvg = performanceTrend.slice(-2).reduce((sum, d) => sum + d.score, 0) / 2;
      const previousAvg = performanceTrend.slice(-4, -2).reduce((sum, d) => sum + d.score, 0) / 2;
      improvementRate = Math.round(recentAvg - previousAvg);
    }

    const overallStats = overallStatsResult.rows[0] || {};

    return NextResponse.json({
      overallStats: {
        totalAssessments: parseInt(overallStats.total_assessments) || 0,
        averageScore: parseInt(overallStats.avg_score) || 0,
        passRate: parseInt(overallStats.pass_rate) || 0,
        improvementRate: improvementRate,
        atRiskCount: atRiskCount,
        topPerformers: topPerformersCount
      },
      performanceTrend: performanceTrend.length > 0 ? performanceTrend : [
        { date: 'No data', score: 0 }
      ],
      conceptMastery: conceptMastery.length > 0 ? conceptMastery : [
        { concept: 'No data', mastery: 0 }
      ],
      studentPerformance,
      classDistribution,
      weeklyProgress: weeklyProgress.length > 0 ? weeklyProgress : [
        { week: 'Week 1', completed: 0 }
      ],
      recentAssessments
    });
  } catch (error) {
    console.error('Assessments data API error:', error);
    return NextResponse.json({
      overallStats: {
        totalAssessments: 0,
        averageScore: 0,
        passRate: 0,
        improvementRate: 0,
        atRiskCount: 8,
        topPerformers: 0
      },
      performanceTrend: [{ date: 'No data', score: 0 }],
      conceptMastery: [{ concept: 'No data', mastery: 0 }],
      studentPerformance: [],
      classDistribution: [
        { name: 'Excellent (80%+)', count: 0, color: '#10b981' },
        { name: 'Good (60-79%)', count: 0, color: '#8b5cf6' },
        { name: 'Average (50-59%)', count: 1, color: '#f59e0b' },
        { name: 'At Risk (<50%)', count: 8, color: '#ef4444' }
      ],
      weeklyProgress: [{ week: 'Week 1', completed: 0 }],
      recentAssessments: []
    });
  }
}