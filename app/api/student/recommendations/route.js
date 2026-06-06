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
    const sessionId = searchParams.get('sessionId');
    const conceptParam = searchParams.get('concept');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    let analysisResult;
    let targetConcept = conceptParam;

    // If specific concept is requested, get gap analysis for that concept
    if (conceptParam) {
      analysisResult = await query(`
        SELECT session_id, concept, analysis_data, created_at
        FROM gap_analysis
        WHERE student_id = $1 AND concept = $2
        ORDER BY created_at DESC
        LIMIT 1
      `, [studentId, conceptParam]);
    } 
    // If sessionId is provided, get analysis for that session
    else if (sessionId) {
      analysisResult = await query(`
        SELECT session_id, concept, analysis_data, created_at
        FROM gap_analysis
        WHERE student_id = $1 AND session_id = $2
        ORDER BY created_at DESC
      `, [studentId, sessionId]);
    } 
    // Otherwise get the most recent analysis
    else {
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
      // If no analysis found but concept provided, return fallback resources
      if (conceptParam) {
        const fallbackResources = getFallbackResourcesForConcept(conceptParam);
        return NextResponse.json({
          recommendations: fallbackResources,
          concept: conceptParam,
          total: fallbackResources.length,
          source: 'fallback',
          message: 'Complete a quiz to get personalized AI recommendations'
        });
      }
      
      return NextResponse.json({ 
        recommendations: [],
        message: "Complete a quiz and click 'Save & Analyze' to get personalized recommendations",
        has_data: false
      });
    }

    const latestAnalysis = analysisResult.rows[0];
    const analysis = latestAnalysis.analysis_data;
    const concept = latestAnalysis.concept || targetConcept;
    
    console.log(`Analysis for session: ${latestAnalysis.session_id}, concept: ${concept}`);

    // Get the student's specific gaps for this concept
    const gapsResult = await query(`
      SELECT concept, mastery_score, specific_errors, total_questions, correct_answers
      FROM concept_mastery
      WHERE student_id = $1 AND concept = $2
    `, [studentId, concept]);

    const gapData = gapsResult.rows[0] || null;
    const specificErrors = gapData?.specific_errors || analysis.weaknesses || [];

    // Generate high-quality resource recommendations based on the concept and gaps
    const resources = generateResourcesForConcept(concept, specificErrors, analysis);
    
    // Generate exercise recommendations based on the gaps
    const exercises = generateExercisesForConcept(concept, specificErrors, gapData);

    // Combine: 4 resources + 2 exercises = 6 total
    const recommendations = [...resources.slice(0, 4), ...exercises.slice(0, 2)];

    console.log(`Returning ${recommendations.length} recommendations (${resources.length} resources, ${exercises.length} exercises)`);

    return NextResponse.json({
      recommendations: recommendations,
      session_id: latestAnalysis.session_id,
      concept: concept,
      mastery_level: analysis.mastery_level || (gapData?.mastery_score ? 
        (gapData.mastery_score >= 80 ? 'advanced' : gapData.mastery_score >= 60 ? 'intermediate' : 'beginner') : 'beginner'),
      accuracy: analysis.accuracy_percentage || (gapData ? 
        Math.round((gapData.correct_answers / gapData.total_questions) * 100) : 0),
      strengths: analysis.strengths || [],
      weaknesses: specificErrors,
      total: recommendations.length,
      source: 'ai-generated',
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

// Generate high-quality resources for a specific concept
function generateResourcesForConcept(concept, specificErrors, analysis) {
  const formattedConcept = concept.replace(/_/g, ' ');
  const searchQuery = encodeURIComponent(`${formattedConcept} programming tutorial`);
  
  const resources = [];
  
  // Resource 1: Video tutorial (YouTube)
  resources.push({
    id: `${concept}_video_1`,
    title: `${formattedConcept} - Complete Tutorial for Beginners`,
    type: 'youtube',
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(formattedConcept + ' programming tutorial')}`,
    description: `Watch this comprehensive video tutorial to understand the fundamentals of ${formattedConcept}. Perfect for visual learners.`,
    duration_minutes: 15,
    difficulty: 'beginner',
    priority: 'high'
  });

  // Resource 2: Interactive documentation/tutorial
  resources.push({
    id: `${concept}_doc_1`,
    title: `${formattedConcept} - Interactive Documentation & Examples`,
    type: 'documentation',
    url: `https://www.w3schools.com/python/python_${concept.toLowerCase()}.asp`,
    description: `Step-by-step guide with interactive examples and code snippets for ${formattedConcept}. Practice as you learn.`,
    duration_minutes: 25,
    difficulty: 'beginner',
    priority: 'high'
  });

  // Resource 3: Article / In-depth guide based on specific errors
  let articleTopic = formattedConcept;
  if (specificErrors && specificErrors.length > 0) {
    const errorTopic = specificErrors[0].toLowerCase();
    if (errorTopic.includes('syntax')) articleTopic = `${formattedConcept} syntax guide`;
    else if (errorTopic.includes('function')) articleTopic = `${formattedConcept} functions explained`;
    else if (errorTopic.includes('loop')) articleTopic = `${formattedConcept} loops tutorial`;
  }
  
  resources.push({
    id: `${concept}_article_1`,
    title: `Understanding ${articleTopic}: A Practical Guide`,
    type: 'article',
    url: `https://www.geeksforgeeks.org/${concept.toLowerCase()}-programming/`,
    description: `Deep dive into ${articleTopic} with real-world examples and common pitfalls to avoid.`,
    duration_minutes: 20,
    difficulty: 'intermediate',
    priority: 'medium'
  });

  // Resource 4: Interactive coding platform
  resources.push({
    id: `${concept}_interactive_1`,
    title: `Practice ${formattedConcept} with Interactive Coding Challenges`,
    type: 'interactive',
    url: `https://www.codecademy.com/search?query=${encodeURIComponent(formattedConcept)}`,
    description: `Hands-on coding exercises to reinforce your understanding of ${formattedConcept}. Learn by doing!`,
    duration_minutes: 30,
    difficulty: 'intermediate',
    priority: 'medium'
  });

  return resources;
}

// Generate exercise recommendations based on specific gaps
function generateExercisesForConcept(concept, specificErrors, gapData) {
  const formattedConcept = concept.replace(/_/g, ' ');
  const exercises = [];

  // Exercise 1: Based on the primary gap/error
  let primaryFocus = formattedConcept;
  let exerciseDescription = `Practice ${formattedConcept} fundamentals`;
  
  if (specificErrors && specificErrors.length > 0) {
    const error = specificErrors[0].toLowerCase();
    if (error.includes('syntax')) {
      primaryFocus = `${formattedConcept} syntax`;
      exerciseDescription = `Master the correct syntax for ${formattedConcept} with these targeted exercises.`;
    } else if (error.includes('function') || error.includes('method')) {
      primaryFocus = `${formattedConcept} functions`;
      exerciseDescription = `Practice writing and calling ${formattedConcept} functions to improve your understanding.`;
    } else if (error.includes('loop')) {
      primaryFocus = `${formattedConcept} loops`;
      exerciseDescription = `Strengthen your loop logic skills with these ${formattedConcept} challenges.`;
    } else if (error.includes('variable')) {
      primaryFocus = `${formattedConcept} variables`;
      exerciseDescription = `Practice variable declaration, assignment, and manipulation in ${formattedConcept}.`;
    } else if (error.includes('condition') || error.includes('if')) {
      primaryFocus = `${formattedConcept} conditionals`;
      exerciseDescription = `Improve your conditional logic with these ${formattedConcept} exercises.`;
    }
  }

  exercises.push({
    id: `${concept}_exercise_1`,
    title: `Practice: ${primaryFocus}`,
    type: 'exercise',
    url: `/student/quizzes?concept=${concept}&focus=${encodeURIComponent(primaryFocus)}`,
    description: exerciseDescription,
    duration_minutes: 20,
    difficulty: 'medium',
    priority: 'high'
  });

  // Exercise 2: Comprehensive practice based on mastery level
  let masteryLevel = gapData?.mastery_score || 50;
  let secondFocus = `${formattedConcept} applications`;
  let secondDescription = `Apply your ${formattedConcept} knowledge to solve real problems`;
  
  if (masteryLevel < 50) {
    secondFocus = `${formattedConcept} basics`;
    secondDescription = `Build a strong foundation with these ${formattedConcept} basic exercises.`;
  } else if (masteryLevel < 75) {
    secondFocus = `${formattedConcept} intermediate concepts`;
    secondDescription = `Take your ${formattedConcept} skills to the next level with these challenges.`;
  } else {
    secondFocus = `Advanced ${formattedConcept} challenges`;
    secondDescription = `Push your limits with these advanced ${formattedConcept} problems.`;
  }

  exercises.push({
    id: `${concept}_exercise_2`,
    title: `Challenge: ${secondFocus}`,
    type: 'exercise',
    url: `/student/quizzes?concept=${concept}&difficulty=${masteryLevel < 50 ? 'beginner' : masteryLevel < 75 ? 'intermediate' : 'advanced'}`,
    description: secondDescription,
    duration_minutes: 25,
    difficulty: masteryLevel < 50 ? 'beginner' : masteryLevel < 75 ? 'intermediate' : 'advanced',
    priority: 'high'
  });

  return exercises;
}

// Fallback resources when no analysis is available
function getFallbackResourcesForConcept(concept) {
  const formattedConcept = concept.replace(/_/g, ' ');
  
  return [
    {
      id: `${concept}_fallback_1`,
      title: `${formattedConcept} - Complete Tutorial`,
      type: 'youtube',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(formattedConcept + ' programming tutorial')}`,
      description: `Learn ${formattedConcept} from scratch with this comprehensive video tutorial.`,
      duration_minutes: 15,
      difficulty: 'beginner',
      priority: 'high'
    },
    {
      id: `${concept}_fallback_2`,
      title: `${formattedConcept} Documentation & Examples`,
      type: 'documentation',
      url: `https://www.w3schools.com/python/python_${concept.toLowerCase()}.asp`,
      description: `Reference guide with examples and practice exercises for ${formattedConcept}.`,
      duration_minutes: 20,
      difficulty: 'beginner',
      priority: 'high'
    },
    {
      id: `${concept}_fallback_3`,
      title: `Practice ${formattedConcept} Basics`,
      type: 'exercise',
      url: `/student/quizzes?concept=${concept}`,
      description: `Test your knowledge of ${formattedConcept} with interactive quizzes.`,
      duration_minutes: 15,
      difficulty: 'beginner',
      priority: 'high'
    },
    {
      id: `${concept}_fallback_4`,
      title: `${formattedConcept} - Deep Dive Article`,
      type: 'article',
      url: `https://www.geeksforgeeks.org/${concept.toLowerCase()}-programming/`,
      description: `In-depth article covering all aspects of ${formattedConcept} programming.`,
      duration_minutes: 25,
      difficulty: 'intermediate',
      priority: 'medium'
    },
    {
      id: `${concept}_fallback_5`,
      title: `Interactive ${formattedConcept} Practice`,
      type: 'interactive',
      url: `https://www.codecademy.com/search?query=${encodeURIComponent(formattedConcept)}`,
      description: `Hands-on coding environment to practice ${formattedConcept} concepts.`,
      duration_minutes: 30,
      difficulty: 'intermediate',
      priority: 'medium'
    },
    {
      id: `${concept}_fallback_6`,
      title: `Advanced ${formattedConcept} Challenges`,
      type: 'exercise',
      url: `/student/quizzes?concept=${concept}&difficulty=advanced`,
      description: `Challenge yourself with advanced ${formattedConcept} problems.`,
      duration_minutes: 25,
      difficulty: 'advanced',
      priority: 'low'
    }
  ];
}