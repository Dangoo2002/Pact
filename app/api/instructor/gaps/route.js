import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get concept gap heatmap
    const gapHeatmapResult = await query(`
      SELECT 
        c.concept_name as concept,
        COUNT(DISTINCT r.student_id) as struggling_count,
        COUNT(r.response_id) as total_attempts,
        SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) as correct_count,
        ROUND(SUM(CASE WHEN r.is_correct THEN 0 ELSE 1 END)::numeric / NULLIF(COUNT(r.response_id), 0) * 100, 1) as struggling_percentage
      FROM concepts c
      JOIN questions q ON c.concept_id = q.concept_id
      LEFT JOIN responses r ON q.question_id = r.question_id
      GROUP BY c.concept_name
      HAVING COUNT(r.response_id) > 0
      ORDER BY struggling_percentage DESC
      LIMIT 10
    `);

    // Get common error patterns
    const errorPatternsResult = await query(`
      SELECT 
        SUBSTRING(r.error_message, 1, 100) as pattern,
        COUNT(*) as frequency
      FROM responses r
      WHERE r.error_message IS NOT NULL 
        AND r.error_message != ''
        AND r.error_message != 'null'
      GROUP BY pattern
      ORDER BY frequency DESC
      LIMIT 10
    `);

    // Calculate total students
    const totalStudentsResult = await query(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`);
    const totalStudents = parseInt(totalStudentsResult.rows[0]?.count || 1);

    const classGapHeatmap = gapHeatmapResult.rows.map(gap => ({
      concept: gap.concept,
      struggling_percentage: Math.min(100, Math.round((gap.struggling_count / totalStudents) * 100)),
      total_attempts: parseInt(gap.total_attempts),
      correct_count: parseInt(gap.correct_count)
    }));

    const commonErrorPatterns = errorPatternsResult.rows.map(pattern => ({
      pattern: pattern.pattern.length > 80 ? pattern.pattern.substring(0, 80) + '...' : pattern.pattern,
      frequency: parseInt(pattern.frequency)
    }));

    // Generate teaching recommendations
    const recommendations = [];
    if (classGapHeatmap.length > 0) {
      const topGap = classGapHeatmap[0];
      recommendations.push(`Review ${topGap.concept} - ${topGap.struggling_percentage}% of students struggling`);
      recommendations.push(`Provide additional practice for ${topGap.concept}`);
      if (commonErrorPatterns.length > 0) {
        recommendations.push(`Address common error: "${commonErrorPatterns[0].pattern.substring(0, 50)}"`);
      }
      recommendations.push(`Create targeted interventions for at-risk students`);
    } else {
      recommendations.push('Complete more assessments to generate AI insights');
      recommendations.push('Review student performance data regularly');
      recommendations.push('Encourage students to complete adaptive quizzes');
    }

    return NextResponse.json({
      class_gap_heatmap: classGapHeatmap,
      common_error_patterns: commonErrorPatterns,
      teaching_recommendations: recommendations
    });
  } catch (error) {
    console.error('Gaps API error:', error);
    return NextResponse.json({
      class_gap_heatmap: [],
      common_error_patterns: [],
      teaching_recommendations: ['Complete more assessments to generate AI insights']
    });
  }
}