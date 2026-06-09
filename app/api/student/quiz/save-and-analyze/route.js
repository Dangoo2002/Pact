// app/api/student/quiz/save-and-analyze/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, studentId, concept, language, questions, answers, score, totalQuestions } = await request.json();

    // Calculate statistics
    const percentage = Math.round((score / totalQuestions) * 100);
    
    // Calculate concept-level performance
    const conceptPerformance = {};
    for (const question of questions) {
      const answer = answers.find(a => a.questionId === question.id);
      const isCorrect = answer?.isCorrect || false;
      
      if (!conceptPerformance[question.concept]) {
        conceptPerformance[question.concept] = { total: 0, correct: 0 };
      }
      conceptPerformance[question.concept].total++;
      if (isCorrect) {
        conceptPerformance[question.concept].correct++;
      }
    }
    
    // Calculate strengths and weaknesses
    const strengths = [];
    const weaknesses = [];
    for (const [conceptName, data] of Object.entries(conceptPerformance)) {
      const mastery = (data.correct / data.total) * 100;
      if (mastery >= 70) {
        strengths.push(`${conceptName} (${Math.round(mastery)}% mastery)`);
      } else if (mastery < 50) {
        weaknesses.push(`${conceptName} (${Math.round(mastery)}% mastery)`);
      }
    }
    
    // Determine performance tier
    let performanceTier = 'beginner';
    if (percentage >= 80) performanceTier = 'excellent';
    else if (percentage >= 60) performanceTier = 'average';
    else performanceTier = 'needs_improvement';
    
    // Generate recommendations
    const recommendations = [];
    if (weaknesses.length > 0) {
      recommendations.push({
        title: `Master ${weaknesses[0].split('(')[0].trim()}`,
        type: "exercise",
        url: `/student/quizzes?concept=${concept}`,
        description: `Practice ${weaknesses[0].split('(')[0].trim()} to improve your skills`
      });
    }
    recommendations.push({
      title: `${concept} Tutorial`,
      type: "tutorial",
      url: `https://www.w3schools.com/python/python_${concept.toLowerCase()}.asp`,
      description: `Review ${concept} fundamentals`
    });
    
    // Get student name
    const studentNameResult = await query(`
      SELECT full_name FROM users WHERE user_id = $1
    `, [studentId]);
    const studentName = studentNameResult.rows[0]?.full_name || 'Unknown';
    
    // 1. Save to gap_analysis (existing)
    const analysisData = {
      overall_mastery: percentage,
      mastery_level: performanceTier,
      accuracy_percentage: percentage,
      strengths: strengths,
      weaknesses: weaknesses,
      recommendations: recommendations,
      concept_performance: conceptPerformance,
      total_questions: totalQuestions,
      score: score,
      language: language
    };
    
    await query(`
      INSERT INTO gap_analysis (student_id, concept, session_id, analysis_data, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [studentId, concept, sessionId, JSON.stringify(analysisData)]);
    
    // 2. Save to instructor_analytics with CORRECT values
    await query(`
      INSERT INTO instructor_analytics (
        student_id, 
        student_name, 
        concept, 
        mastery_score, 
        accuracy_percentage,
        total_questions, 
        correct_answers, 
        quiz_score, 
        total_quizzes, 
        completed_quizzes,
        current_streak, 
        longest_streak, 
        performance_tier,
        strengths, 
        weaknesses, 
        recommendations,
        analysis_date, 
        session_id,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 1, 0, 0, $9, $10, $11, $12, NOW(), $13, NOW(), NOW())
    `, [
      studentId, 
      studentName, 
      concept, 
      percentage,  // mastery_score
      percentage,  // accuracy_percentage
      totalQuestions,  // total_questions
      score,  // correct_answers
      score,  // quiz_score
      performanceTier,
      JSON.stringify(strengths),
      JSON.stringify(weaknesses),
      JSON.stringify(recommendations),
      sessionId
    ]);
    
    // 3. Update student_performance
    const existingPerf = await query(`
      SELECT * FROM student_performance WHERE student_id = $1
    `, [studentId]);
    
    if (existingPerf.rows.length === 0) {
      await query(`
        INSERT INTO student_performance (
          student_id, total_quizzes, completed_quizzes, total_questions_answered,
          total_correct_answers, average_score, overall_mastery, current_streak, 
          longest_streak, performance_tier, last_activity_date
        )
        VALUES ($1, 1, 1, $2, $3, $4, $4, 1, 1, $5, CURRENT_DATE)
      `, [studentId, totalQuestions, score, percentage, performanceTier]);
    } else {
      const current = existingPerf.rows[0];
      const newTotalQuizzes = current.total_quizzes + 1;
      const newTotalQuestions = current.total_questions_answered + totalQuestions;
      const newCorrectAnswers = current.total_correct_answers + score;
      const newAvgScore = Math.round((newCorrectAnswers / newTotalQuestions) * 100);
      
      await query(`
        UPDATE student_performance 
        SET 
          total_quizzes = total_quizzes + 1,
          completed_quizzes = completed_quizzes + 1,
          total_questions_answered = total_questions_answered + $2,
          total_correct_answers = total_correct_answers + $3,
          average_score = $4,
          overall_mastery = $4,
          current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          performance_tier = $5,
          last_activity_date = CURRENT_DATE,
          updated_at = NOW()
        WHERE student_id = $1
      `, [studentId, totalQuestions, score, newAvgScore, performanceTier]);
    }
    
    // 4. Update quiz_sessions
    await query(`
      UPDATE quiz_sessions 
      SET 
        score = $1,
        status = 'completed',
        completed_at = NOW(),
        analysis_complete = true,
        analysis_data = $2
      WHERE session_id = $3
    `, [score, JSON.stringify(analysisData), sessionId]);
    
    return NextResponse.json({
      success: true,
      analysis: analysisData,
      session_id: sessionId,
      message: "Quiz analysis complete and saved to all tables"
    });
  } catch (error) {
    console.error('Save and analyze error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}