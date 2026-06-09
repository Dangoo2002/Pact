// lib/at-risk-utils.js
import { query } from './db';

// Single source of truth for at-risk calculation
export async function getAtRiskData() {
  // Get all students with their average mastery
  const result = await query(`
    WITH student_mastery AS (
      SELECT 
        u.user_id,
        u.full_name,
        COALESCE(ROUND(AVG(ia.mastery_score)), 0) as avg_mastery,
        COUNT(DISTINCT ia.session_id) as total_quizzes,
        MAX(ia.analysis_date) as last_activity,
        COUNT(ia.mastery_score) as data_count
      FROM users u
      LEFT JOIN instructor_analytics ia ON u.user_id = ia.student_id
      WHERE u.role = 'student'
      GROUP BY u.user_id, u.full_name
    )
    SELECT 
      COUNT(*) as total_students,
      SUM(CASE WHEN avg_mastery < 50 OR total_quizzes = 0 THEN 1 ELSE 0 END) as at_risk_count,
      SUM(CASE WHEN avg_mastery >= 50 THEN 1 ELSE 0 END) as not_at_risk_count,
      jsonb_agg(
        jsonb_build_object(
          'id', user_id,
          'name', full_name,
          'mastery', avg_mastery,
          'quizzes', total_quizzes,
          'at_risk', (avg_mastery < 50 OR total_quizzes = 0)
        )
      ) as students
    FROM student_mastery
  `);
  
  return result.rows[0];
}