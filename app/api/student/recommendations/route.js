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

    // Build recommendations from the analysis - ensure we have variety
    const recommendations = [];

    // Add AI-generated educational resources (videos, articles, tutorials)
    if (analysis.recommendations && Array.isArray(analysis.recommendations)) {
      for (const rec of analysis.recommendations) {
        // Only add non-exercise types as resources
        if (rec.type !== 'exercise') {
          recommendations.push({
            id: `${latestAnalysis.session_id}_${rec.title.replace(/\s/g, '_')}`,
            title: rec.title,
            type: rec.type || 'article',
            url: rec.url || '#',
            description: rec.description || `Learn more about ${latestAnalysis.concept}`,
            concept: latestAnalysis.concept,
            priority: rec.priority || 'high',
            session_id: latestAnalysis.session_id,
            generated_at: latestAnalysis.created_at,
            duration_minutes: rec.duration_minutes || 20,
            difficulty: rec.difficulty || 'beginner'
          });
        }
      }
    }

    // Add practice exercises (exactly 2)
    let exerciseCount = 0;
    
    // First, try to get exercises from next_steps
    if (analysis.next_steps && Array.isArray(analysis.next_steps) && exerciseCount < 2) {
      for (const step of analysis.next_steps) {
        if (exerciseCount < 2) {
          recommendations.push({
            id: `${latestAnalysis.session_id}_exercise_${exerciseCount}`,
            title: `Practice: ${step.length > 50 ? step.substring(0, 50) + '...' : step}`,
            type: 'exercise',
            url: `/student/quizzes?concept=${latestAnalysis.concept}`,
            description: step,
            concept: latestAnalysis.concept,
            priority: 'high',
            session_id: latestAnalysis.session_id,
            generated_at: latestAnalysis.created_at,
            duration_minutes: 30,
            difficulty: 'intermediate'
          });
          exerciseCount++;
        }
      }
    }

    // If still need exercises, create from weaknesses
    if (exerciseCount < 2 && analysis.weaknesses && analysis.weaknesses.length > 0) {
      for (const weakness of analysis.weaknesses) {
        if (exerciseCount < 2) {
          recommendations.push({
            id: `${latestAnalysis.session_id}_weakness_exercise_${exerciseCount}`,
            title: `Improve: ${weakness.substring(0, 50)}`,
            type: 'exercise',
            url: `/student/quizzes?concept=${latestAnalysis.concept}`,
            description: `Practice exercises focused on: ${weakness}`,
            concept: latestAnalysis.concept,
            priority: 'high',
            session_id: latestAnalysis.session_id,
            generated_at: latestAnalysis.created_at,
            duration_minutes: 25,
            difficulty: 'beginner'
          });
          exerciseCount++;
        }
      }
    }

    // If still need exercises, add generic concept exercises
    while (exerciseCount < 2) {
      recommendations.push({
        id: `${latestAnalysis.session_id}_generic_exercise_${exerciseCount}`,
        title: `Master ${latestAnalysis.concept.replace(/_/g, ' ')} with Practice`,
        type: 'exercise',
        url: `/student/quizzes?concept=${latestAnalysis.concept}`,
        description: `Comprehensive exercises to strengthen your understanding of ${latestAnalysis.concept.replace(/_/g, ' ')}.`,
        concept: latestAnalysis.concept,
        priority: 'medium',
        session_id: latestAnalysis.session_id,
        generated_at: latestAnalysis.created_at,
        duration_minutes: 35,
        difficulty: 'intermediate'
      });
      exerciseCount++;
    }

    // Ensure we have exactly 4 educational resources
    const educationalResources = recommendations.filter(r => r.type !== 'exercise');
    const exercises = recommendations.filter(r => r.type === 'exercise');
    
    // Take top 4 educational resources
    const finalResources = educationalResources.slice(0, 4);
    
    // If we don't have 4 educational resources, add curated fallbacks based on concept
    const conceptName = latestAnalysis.concept.replace(/_/g, ' ');
    const fallbackResources = [
      {
        id: `fallback_video_${latestAnalysis.session_id}`,
        title: `${conceptName} Tutorial for Beginners`,
        type: 'video',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(conceptName)}+tutorial`,
        description: `Watch this comprehensive video tutorial to understand ${conceptName} fundamentals.`,
        concept: latestAnalysis.concept,
        priority: 'high',
        session_id: latestAnalysis.session_id,
        generated_at: latestAnalysis.created_at,
        duration_minutes: 15,
        difficulty: 'beginner'
      },
      {
        id: `fallback_article_${latestAnalysis.session_id}`,
        title: `${conceptName} - Complete Guide`,
        type: 'article',
        url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(conceptName)}`,
        description: `Read this detailed guide covering all aspects of ${conceptName}.`,
        concept: latestAnalysis.concept,
        priority: 'high',
        session_id: latestAnalysis.session_id,
        generated_at: latestAnalysis.created_at,
        duration_minutes: 20,
        difficulty: 'beginner'
      },
      {
        id: `fallback_interactive_${latestAnalysis.session_id}`,
        title: `Interactive ${conceptName} Practice`,
        type: 'interactive',
        url: `/student/quizzes?concept=${latestAnalysis.concept}`,
        description: `Hands-on interactive exercises to test your ${conceptName} knowledge.`,
        concept: latestAnalysis.concept,
        priority: 'medium',
        session_id: latestAnalysis.session_id,
        generated_at: latestAnalysis.created_at,
        duration_minutes: 25,
        difficulty: 'intermediate'
      },
      {
        id: `fallback_docs_${latestAnalysis.session_id}`,
        title: `${conceptName} Documentation & Examples`,
        type: 'documentation',
        url: `https://www.w3schools.com/python/python_${latestAnalysis.concept.toLowerCase()}.asp`,
        description: `Official documentation with code examples for ${conceptName}.`,
        concept: latestAnalysis.concept,
        priority: 'medium',
        session_id: latestAnalysis.session_id,
        generated_at: latestAnalysis.created_at,
        duration_minutes: 30,
        difficulty: 'intermediate'
      }
    ];
    
    // Fill missing resources with fallbacks
    while (finalResources.length < 4) {
      const fallback = fallbackResources[finalResources.length % fallbackResources.length];
      finalResources.push(fallback);
    }
    
    // Combine exactly 4 resources + 2 exercises = 6 total
    const combinedRecommendations = [...finalResources.slice(0, 4), ...exercises.slice(0, 2)];

    console.log(`Returning ${combinedRecommendations.length} recommendations (${finalResources.slice(0, 4).length} resources, ${exercises.slice(0, 2).length} exercises)`);

    return NextResponse.json({
      recommendations: combinedRecommendations,
      session_id: latestAnalysis.session_id,
      concept: latestAnalysis.concept,
      mastery_level: analysis.mastery_level,
      accuracy: analysis.accuracy_percentage,
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      total: combinedRecommendations.length,
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