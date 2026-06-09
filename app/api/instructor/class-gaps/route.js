// app/api/instructor/class-gaps/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total students who have completed quizzes
    const totalStudentsResult = await query(`
      SELECT COUNT(DISTINCT student_id) as count 
      FROM quiz_sessions 
      WHERE status = 'completed'
    `);
    const totalStudents = parseInt(totalStudentsResult.rows[0]?.count || 1);

    // Get class gap heatmap from quiz_sessions (mastery < 50)
    const gapResult = await query(`
      SELECT 
        qs.concept,
        COUNT(DISTINCT qs.student_id) as struggling_count,
        ROUND(COUNT(DISTINCT qs.student_id)::numeric / $1 * 100) as struggling_percentage,
        ROUND(AVG(qs.score::numeric / qs.total_questions * 100)) as avg_mastery,
        COUNT(qs.session_id) as total_attempts,
        SUM(qs.score) as correct_count,
        CASE 
          WHEN COUNT(DISTINCT qs.student_id)::numeric / $1 * 100 >= 50 THEN 'high'
          WHEN COUNT(DISTINCT qs.student_id)::numeric / $1 * 100 >= 30 THEN 'medium'
          ELSE 'low'
        END as priority
      FROM quiz_sessions qs
      WHERE qs.status = 'completed' AND qs.score::numeric / qs.total_questions * 100 < 50 AND qs.concept IS NOT NULL
      GROUP BY qs.concept
      ORDER BY struggling_percentage DESC
      LIMIT 10
    `, [totalStudents]);

    // Get error patterns from gap_analysis JSONB data (keep as is)
    const errorResult = await query(`
      SELECT 
        ga.concept,
        jsonb_array_elements_text(ga.analysis_data->'weaknesses') as weakness,
        COUNT(*) as frequency
      FROM gap_analysis ga
      WHERE ga.analysis_data ? 'weaknesses' 
        AND jsonb_array_length(ga.analysis_data->'weaknesses') > 0
      GROUP BY ga.concept, weakness
      ORDER BY frequency DESC
      LIMIT 15
    `);

    const commonErrorPatterns = errorResult.rows.map(row => ({
      pattern: row.weakness,
      frequency: parseInt(row.frequency),
      concept: row.concept
    }));

    // Generate teaching recommendations
    const recommendations = [];
    
    if (gapResult.rows.length > 0) {
      const topGap = gapResult.rows[0];
      recommendations.push(`Schedule review session on ${topGap.concept.replace(/_/g, ' ')} (${topGap.struggling_percentage}% of students struggling)`);
      recommendations.push(`Provide additional practice materials focusing on ${topGap.concept.replace(/_/g, ' ')}`);
      recommendations.push(`Create a targeted quiz specifically for ${topGap.concept.replace(/_/g, ' ')}`);
      
      if (commonErrorPatterns.length > 0) {
        recommendations.push(`Address common misconception: "${commonErrorPatterns[0].pattern.substring(0, 60)}"`);
      }
      
      if (gapResult.rows.length > 1) {
        recommendations.push(`Secondary focus: ${gapResult.rows[1].concept.replace(/_/g, ' ')} (${gapResult.rows[1].struggling_percentage}% struggling)`);
      }
    } else {
      recommendations.push('Complete more assessments to generate AI insights');
      recommendations.push('Review student performance data regularly');
      recommendations.push('Encourage students to complete adaptive quizzes');
      recommendations.push('Monitor class progress as more data comes in');
    }

    return NextResponse.json({
      class_gap_heatmap: gapResult.rows,
      common_error_patterns: commonErrorPatterns,
      teaching_recommendations: recommendations
    });
  } catch (error) {
    console.error('Class gaps API error:', error);
    return NextResponse.json({
      class_gap_heatmap: [],
      common_error_patterns: [],
      teaching_recommendations: ['Complete more assessments to generate AI insights']
    });
  }
}