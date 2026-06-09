// app/api/instructor/student-gaps/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
  let studentId = null; // Declare studentId outside try block so it's accessible in catch
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Get student details with mastery
    const studentResult = await query(`
      SELECT 
        u.user_id as id,
        u.full_name as name,
        u.email,
        COALESCE(ROUND(AVG(ia.mastery_score)), 0) as mastery,
        COUNT(DISTINCT ia.session_id) as total_quizzes,
        COUNT(DISTINCT ia.concept) as total_gaps
      FROM users u
      LEFT JOIN instructor_analytics ia ON u.user_id = ia.student_id
      WHERE u.user_id = $1 AND u.role = 'student'
      GROUP BY u.user_id, u.full_name, u.email
    `, [studentId]);

    // Get specific gaps for this student (concepts with mastery < 50)
    const gapsResult = await query(`
      SELECT 
        concept,
        ROUND(mastery_score) as mastery,
        total_questions,
        correct_answers,
        CASE 
          WHEN mastery_score < 50 THEN 'critical'
          WHEN mastery_score < 70 THEN 'moderate'
          ELSE 'minor'
        END as severity
      FROM instructor_analytics
      WHERE student_id = $1 AND mastery_score < 70
      ORDER BY mastery_score ASC
    `, [studentId]);

    // Get weaknesses from gap_analysis
    const weaknessesResult = await query(`
      SELECT DISTINCT
        jsonb_array_elements_text(analysis_data->'weaknesses') as weakness
      FROM gap_analysis
      WHERE student_id = $1 AND analysis_data ? 'weaknesses'
      LIMIT 10
    `, [studentId]);

    const student = studentResult.rows[0] || { 
      id: studentId, 
      name: 'Student', 
      mastery: 0, 
      total_gaps: 0,
      total_quizzes: 0
    };
    
    student.gaps = gapsResult.rows;
    student.weaknesses = weaknessesResult.rows.map(w => w.weakness).filter(Boolean);

    return NextResponse.json(student);
  } catch (error) {
    console.error('Student gaps API error:', error);
    return NextResponse.json({ 
      id: studentId || 'unknown', 
      name: 'Student', 
      mastery: 0, 
      gaps: [], 
      weaknesses: [] 
    });
  }
}