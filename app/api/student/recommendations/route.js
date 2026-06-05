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
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Get saved gap analysis
    const gapAnalysis = await query(`
      SELECT concept, analysis_data, created_at
      FROM gap_analysis
      WHERE student_id = $1
      ORDER BY created_at DESC
    `, [studentId]);

    // Get recent responses
    const responses = await query(`
      SELECT r.*, qs.concept, qs.language
      FROM responses r
      JOIN quiz_sessions qs ON r.session_id = qs.session_id
      WHERE r.student_id = $1
      ORDER BY r.timestamp DESC
      LIMIT 50
    `, [studentId]);

    if (responses.rows.length === 0 && gapAnalysis.rows.length === 0) {
      return NextResponse.json({ 
        recommendations: [],
        message: "Complete a quiz to get personalized AI recommendations"
      });
    }

    // Generate AI recommendations based on stored analysis and recent performance
    const recommendations = await generateAIRecommendationsFromData(studentId, responses.rows, gapAnalysis.rows);

    return NextResponse.json({
      recommendations: recommendations.slice(0, limit),
      total: recommendations.length,
      source: 'mistral-ai',
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateAIRecommendationsFromData(studentId, responses, gapAnalysis) {
  const incorrectResponses = responses.filter(r => !r.is_correct);
  const conceptsWithIssues = {};
  
  for (const resp of incorrectResponses) {
    const concept = resp.concept || 'general';
    if (!conceptsWithIssues[concept]) {
      conceptsWithIssues[concept] = { count: 0, errors: [] };
    }
    conceptsWithIssues[concept].count++;
    if (resp.selected_answer) {
      conceptsWithIssues[concept].errors.push(resp.selected_answer);
    }
  }

  const strugglingConcepts = Object.entries(conceptsWithIssues)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([concept, data]) => ({ concept, errorCount: data.count, sampleErrors: data.errors.slice(0, 3) }));

  const prompt = `Generate personalized learning recommendations for a programming student.

STRUGGLING CONCEPTS:
${JSON.stringify(strugglingConcepts, null, 2)}

RECENT INCORRECT ANSWERS:
${JSON.stringify(incorrectResponses.slice(0, 10), null, 2)}

Return ONLY a JSON array of recommendations. Each recommendation must have:
- title: specific, descriptive title
- type: "video", "article", "exercise", "interactive", "course"
- url: REAL working URL (YouTube, freeCodeCamp, MDN, W3Schools, Coursera, Udemy free, etc.)
- description: why this helps their specific struggle
- concept: which concept this addresses
- priority: "high", "medium", "low"
- estimated_duration_minutes: number

Example:
[{"title": "Python Variables Explained", "type": "video", "url": "https://www.youtube.com/watch?v=example", "description": "Clear explanation of variable assignment", "concept": "variables", "priority": "high", "estimated_duration_minutes": 15}]`;

  try {
    const aiResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'system',
            content: 'You are a learning resource curator. Return ONLY valid JSON array with real, working educational URLs.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 2500
      })
    });

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('AI recommendation generation failed:', error);
  }

  // Generate recommendations based on actual struggling concepts
  const recommendations = [];
  for (const item of strugglingConcepts) {
    recommendations.push({
      title: `Master ${item.concept} - Complete Tutorial`,
      type: "tutorial",
      url: `https://www.w3schools.com/python/python_${item.concept.toLowerCase()}.asp`,
      description: `You struggled with ${item.concept} ${item.errorCount} times. This tutorial covers the fundamentals.`,
      concept: item.concept,
      priority: "high",
      estimated_duration_minutes: 30
    });
    recommendations.push({
      title: `${item.concept} Practice Exercises`,
      type: "exercise",
      url: `/student/quizzes?concept=${item.concept}`,
      description: `Practice more ${item.concept} questions to improve.`,
      concept: item.concept,
      priority: "high",
      estimated_duration_minutes: 45
    });
  }
  
  return recommendations;
}