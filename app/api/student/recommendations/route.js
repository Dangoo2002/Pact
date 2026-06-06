import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const sessionId = searchParams.get('sessionId'); // Optional: get specific session

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    let analysisResult;

    if (sessionId) {
      // Get analysis for specific session
      analysisResult = await query(`
        SELECT session_id, concept, analysis_data, created_at
        FROM gap_analysis
        WHERE student_id = $1 AND session_id = $2
        ORDER BY created_at DESC
      `, [studentId, sessionId]);
    } else {
      // Get the most recent analysis for this student
      analysisResult = await query(`
        SELECT session_id, concept, analysis_data, created_at
        FROM gap_analysis
        WHERE student_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [studentId]);
    }

    console.log('Found analysis records:', analysisResult.rows.length);

    if (analysisResult.rows.length === 0) {
      return NextResponse.json({ 
        recommendations: [],
        message: "Complete a quiz and click 'Save & Analyze' to get personalized recommendations",
        has_data: false
      });
    }

    const latestAnalysis = analysisResult.rows[0];
    const analysis = latestAnalysis.analysis_data;
    
    console.log(`Analysis for session: ${latestAnalysis.session_id}, concept: ${latestAnalysis.concept}`);

    // Build recommendations from the analysis
    const recommendations = [];

    // Add AI-generated recommendations
    if (analysis.recommendations && Array.isArray(analysis.recommendations)) {
      for (const rec of analysis.recommendations) {
        recommendations.push({
          id: `${latestAnalysis.session_id}_${rec.title.replace(/\s/g, '_')}`,
          title: rec.title,
          type: rec.type || 'article',
          url: rec.url || '#',
          description: rec.description || `Learn more about ${latestAnalysis.concept}`,
          concept: latestAnalysis.concept,
          priority: rec.priority || 'high',
          session_id: latestAnalysis.session_id,
          generated_at: latestAnalysis.created_at
        });
      }
    }

    // Add next steps as recommendations
    if (analysis.next_steps && Array.isArray(analysis.next_steps)) {
      for (const step of analysis.next_steps) {
        recommendations.push({
          id: `${latestAnalysis.session_id}_step_${step.replace(/\s/g, '_')}`,
          title: step.length > 60 ? step.substring(0, 60) + '...' : step,
          type: 'exercise',
          url: `/student/quizzes?concept=${latestAnalysis.concept}`,
          description: step,
          concept: latestAnalysis.concept,
          priority: 'medium',
          session_id: latestAnalysis.session_id,
          generated_at: latestAnalysis.created_at
        });
      }
    }

    // If no recommendations in analysis, generate from weaknesses
    if (recommendations.length === 0 && analysis.weaknesses && analysis.weaknesses.length > 0) {
      for (const weakness of analysis.weaknesses.slice(0, 3)) {
        recommendations.push({
          id: `${latestAnalysis.session_id}_weakness_${weakness.replace(/\s/g, '_')}`,
          title: `Improve: ${weakness.substring(0, 50)}`,
          type: 'exercise',
          url: `/student/quizzes?concept=${latestAnalysis.concept}`,
          description: weakness,
          concept: latestAnalysis.concept,
          priority: 'high',
          session_id: latestAnalysis.session_id,
          generated_at: latestAnalysis.created_at
        });
      }
    }

    console.log(`Returning ${recommendations.length} recommendations`);

    return NextResponse.json({
      recommendations: recommendations,
      session_id: latestAnalysis.session_id,
      concept: latestAnalysis.concept,
      mastery_level: analysis.mastery_level,
      accuracy: analysis.accuracy_percentage,
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      total: recommendations.length,
      source: 'ai-analysis',
      generated_at: latestAnalysis.created_at
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ 
      error: error.message,
      recommendations: [] 
    }, { status: 500 });
  }
}