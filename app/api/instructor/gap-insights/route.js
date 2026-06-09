// app/api/instructor/gap-insights/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total students count
    const totalStudentsResult = await query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'student'
    `);
    const totalStudents = parseInt(totalStudentsResult.rows[0]?.count || 1);

    // Get concept gap heatmap from concept_performance
    const gapHeatmap = await query(`
      SELECT 
        concept,
        COUNT(DISTINCT student_id) as struggling_count,
        AVG(mastery_score) as avg_mastery,
        COUNT(*) as total_records
      FROM concept_performance
      WHERE mastery_score < 50
      GROUP BY concept
      ORDER BY avg_mastery ASC
      LIMIT 10
    `);

    const classGapHeatmap = gapHeatmap.rows.map(gap => ({
      concept: gap.concept,
      struggling_percentage: Math.min(100, Math.round((gap.struggling_count / totalStudents) * 100)),
      total_attempts: parseInt(gap.total_records),
      avg_mastery: Math.round(gap.avg_mastery || 0)
    }));

    // Get common error patterns from gap_analysis JSONB
    const errorPatterns = await query(`
      SELECT 
        analysis_data->>'weaknesses' as pattern,
        COUNT(*) as frequency,
        concept
      FROM gap_analysis
      WHERE analysis_data ? 'weaknesses'
      GROUP BY pattern, concept
      ORDER BY frequency DESC
      LIMIT 10
    `);

    const commonErrorPatterns = errorPatterns.rows.map(pattern => ({
      pattern: pattern.pattern ? pattern.pattern.substring(0, 80) : 'Unknown error',
      frequency: parseInt(pattern.frequency),
      concept: pattern.concept
    }));

    // Generate teaching recommendations
    const recommendations = [];
    if (classGapHeatmap.length > 0) {
      const topGap = classGapHeatmap[0];
      recommendations.push(`Schedule review session on ${topGap.concept} (${topGap.struggling_percentage}% of students struggling)`);
      recommendations.push(`Provide additional practice materials for ${topGap.concept}`);
      recommendations.push(`Create targeted quiz focusing on ${topGap.concept}`);
      
      if (commonErrorPatterns.length > 0) {
        recommendations.push(`Address common issues in ${commonErrorPatterns[0].concept || 'problem areas'}`);
      }
    } else {
      recommendations.push('Complete more assessments to generate insights');
      recommendations.push('Review student performance data regularly');
      recommendations.push('Encourage students to complete adaptive quizzes');
    }

    return NextResponse.json({
      class_gap_heatmap: classGapHeatmap,
      common_error_patterns: commonErrorPatterns,
      teaching_recommendations: recommendations
    });
  } catch (error) {
    console.error('Gap insights API error:', error);
    return NextResponse.json({
      class_gap_heatmap: [],
      common_error_patterns: [],
      teaching_recommendations: ['Complete more assessments to generate AI insights']
    });
  }
}