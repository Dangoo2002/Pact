// lib/analytics-helpers.js
import { query } from './db';

export async function getConsistentAtRiskCount() {
  // Get students with mastery < 50 from instructor_analytics
  const atRiskWithData = await query(`
    SELECT COUNT(DISTINCT student_id) as count
    FROM instructor_analytics
    WHERE mastery_score < 50
  `);
  
  // Get all students
  const allStudents = await query(`
    SELECT user_id FROM users WHERE role = 'student'
  `);
  
  // Get students with any data
  const studentsWithData = await query(`
    SELECT DISTINCT student_id FROM instructor_analytics
  `);
  
  const studentsWithDataIds = new Set(studentsWithData.rows.map(s => s.student_id));
  let noDataCount = 0;
  
  for (const student of allStudents.rows) {
    if (!studentsWithDataIds.has(student.user_id)) {
      noDataCount++;
    }
  }
  
  const atRiskWithDataCount = parseInt(atRiskWithData.rows[0]?.count || 0);
  
  return {
    total: atRiskWithDataCount + noDataCount,
    withData: atRiskWithDataCount,
    noData: noDataCount,
    totalStudents: allStudents.rows.length
  };
}

export async function getStudentMasteryList() {
  const allStudents = await query(`
    SELECT user_id, full_name FROM users WHERE role = 'student'
  `);
  
  const studentMastery = await query(`
    SELECT 
      student_id,
      MAX(student_name) as student_name,
      ROUND(AVG(mastery_score)) as avg_mastery,
      COUNT(*) as quiz_count,
      MAX(analysis_date) as last_active
    FROM instructor_analytics
    WHERE mastery_score IS NOT NULL
    GROUP BY student_id
  `);
  
  const masteryMap = new Map();
  for (const row of studentMastery.rows) {
    masteryMap.set(row.student_id, {
      mastery: row.avg_mastery || 0,
      quizCount: row.quiz_count,
      studentName: row.student_name,
      lastActive: row.last_active
    });
  }
  
  const result = [];
  for (const student of allStudents.rows) {
    const data = masteryMap.get(student.user_id);
    result.push({
      id: student.user_id,
      name: data?.studentName || student.full_name,
      mastery: data?.mastery || 0,
      quizCount: data?.quizCount || 0,
      lastActive: data?.lastActive || null,
      hasData: !!data
    });
  }
  
  return result;
}

export async function getAtRiskStudentsList(limit = 10) {
  // Get students with mastery < 50 from instructor_analytics
  const atRiskWithData = await query(`
    SELECT 
      ia.student_id as id,
      COALESCE(ia.student_name, u.full_name) as name,
      ROUND(AVG(ia.mastery_score)) as mastery,
      COUNT(*) as quiz_count,
      MAX(ia.analysis_date) as last_active
    FROM instructor_analytics ia
    JOIN users u ON u.user_id = ia.student_id
    WHERE ia.mastery_score < 50
    GROUP BY ia.student_id, ia.student_name, u.full_name
    ORDER BY mastery ASC
    LIMIT $1
  `, [limit]);
  
  // Get students with no data (mastery = 0, also at risk)
  const studentsWithData = await query(`SELECT DISTINCT student_id FROM instructor_analytics`);
  const studentsWithDataIds = new Set(studentsWithData.rows.map(s => s.student_id));
  
  const allStudents = await query(`SELECT user_id, full_name FROM users WHERE role = 'student'`);
  const noDataStudents = [];
  
  for (const student of allStudents.rows) {
    if (!studentsWithDataIds.has(student.user_id) && noDataStudents.length < (limit - atRiskWithData.rows.length)) {
      noDataStudents.push({
        id: student.user_id,
        name: student.full_name,
        mastery: 0,
        quiz_count: 0,
        last_active: null
      });
    }
  }
  
  return [...atRiskWithData.rows, ...noDataStudents];
}