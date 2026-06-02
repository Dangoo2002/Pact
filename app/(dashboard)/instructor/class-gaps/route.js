// app/api/instructor/gap-insights/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get concept gap heatmap from responses
    const gapHeatmap = await query(`
      SELECT c.concept_name as concept,
             COUNT(DISTINCT r.student_id) as struggling_count,
             COUNT(r.response_id) as total_attempts,
             SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) as correct_count
      FROM responses r
      JOIN questions q ON r.question_id = q.question_id
      JOIN concepts c ON q.concept_id = c.concept_id
      WHERE r.is_correct = false
      GROUP BY c.concept_name
      ORDER BY struggling_count DESC
      LIMIT 10
    `);

    // Calculate struggling percentage
    const totalStudents = await query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['student']);
    const totalStudentsCount = parseInt(totalStudents.rows[0]?.count || 1);
    
    const classGapHeatmap = gapHeatmap.rows.map(gap => ({
      concept: gap.concept,
      struggling_percentage: Math.round((gap.struggling_count / totalStudentsCount) * 100),
      total_attempts: parseInt(gap.total_attempts),
      correct_count: parseInt(gap.correct_count)
    }));

    // Get common error patterns from responses
    const errorPatterns = await query(`
      SELECT error_message as pattern, COUNT(*) as frequency
      FROM responses
      WHERE error_message IS NOT NULL AND error_message != ''
      GROUP BY error_message
      ORDER BY frequency DESC
      LIMIT 10
    `);

    const commonErrorPatterns = errorPatterns.rows.map(pattern => ({
      pattern: pattern.pattern.length > 50 ? pattern.pattern.substring(0, 50) + '...' : pattern.pattern,
      frequency: parseInt(pattern.frequency)
    }));

    // Generate recommendations based on top gaps
    const recommendations = [];
    if (classGapHeatmap.length > 0) {
      const topGap = classGapHeatmap[0];
      recommendations.push(`Schedule review session on ${topGap.concept} (${topGap.struggling_percentage}% of students struggling)`);
      recommendations.push(`Provide additional practice materials for ${topGap.concept}`);
      recommendations.push(`Create targeted quiz focusing on identified gaps`);
    } else {
      recommendations.push('Complete more assessments to generate insights');
      recommendations.push('Review student performance regularly');
      recommendations.push('Create targeted practice materials');
    }

    return NextResponse.json({
      class_gap_heatmap: classGapHeatmap,
      common_error_patterns: commonErrorPatterns,
      recommendations
    });
  } catch (error) {
    console.error('Gap insights API error:', error);
    return NextResponse.json({ 
      class_gap_heatmap: [],
      common_error_patterns: [],
      recommendations: ['Complete more assessments to generate insights']
    });
  }
}