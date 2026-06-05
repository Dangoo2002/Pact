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

    // Get student's performance data
    const responses = await query(`
      SELECT r.*, qs.concept, qs.language
      FROM responses r
      JOIN quiz_sessions qs ON r.session_id = qs.session_id
      WHERE r.student_id = $1
      ORDER BY r.timestamp DESC
    `, [studentId]);

    if (responses.rows.length === 0) {
      return NextResponse.json({ 
        recommendations: [],
        message: "Complete quizzes to get AI-powered recommendations"
      });
    }

    // Get concepts they struggled with
    const failedConcepts = {};
    for (const resp of responses.rows) {
      if (!resp.is_correct) {
        const concept = resp.concept || 'general';
        if (!failedConcepts[concept]) {
          failedConcepts[concept] = { count: 0, language: resp.language };
        }
        failedConcepts[concept].count++;
      }
    }

    const strugglingConcepts = Object.entries(failedConcepts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([concept, data]) => ({ concept, language: data.language, failCount: data.count }));

    // Generate AI-powered recommendations
    const recommendations = await generateAIRecommendations(studentId, strugglingConcepts, responses.rows);

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

async function generateAIRecommendations(studentId, strugglingConcepts, responses) {
  if (strugglingConcepts.length === 0) {
    return [];
  }

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
            content: `You are an AI learning assistant. Generate personalized learning resource recommendations based on student's knowledge gaps.
            Return ONLY valid JSON array. NO markdown, NO extra text.
            Each recommendation must have:
            - title: descriptive title
            - type: "video", "article", "exercise", "interactive"
            - url: relevant URL (use real resource URLs like YouTube, MDN, W3Schools, freeCodeCamp)
            - reason: why this helps their specific gap
            - concept: the concept it addresses
            - priority: "high", "medium", "low"
            - estimated_duration_minutes: number
            - difficulty: "beginner", "intermediate", "advanced"`
          },
          {
            role: 'user',
            content: `Student struggled with these concepts:
${JSON.stringify(strugglingConcepts, null, 2)}

Recent incorrect answers:
${JSON.stringify(responses.filter(r => !r.is_correct).slice(0, 10), null, 2)}

Generate 5-10 specific learning resources that will help this student improve. 
Use REAL educational URLs (YouTube tutorials, freeCodeCamp, MDN, W3Schools, Coursera free courses, etc.).
Make recommendations specific to their struggles.`
          }
        ],
        temperature: 0.4,
        max_tokens: 3000
      })
    });
    
    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const recommendations = JSON.parse(jsonMatch[0]);
      
      // Save recommendations to database for tracking
      for (const rec of recommendations) {
        await saveRecommendation(studentId, rec);
      }
      
      return recommendations;
    }
  } catch (error) {
    console.error('AI recommendation generation failed:', error);
  }
  
  // Generate recommendations based on actual struggling concepts (not hardcoded)
  const recommendations = [];
  for (const concept of strugglingConcepts) {
    recommendations.push({
      title: `Master ${concept.concept} in ${concept.language}`,
      type: "interactive",
      url: `/student/quizzes?concept=${concept.concept}`,
      reason: `You've struggled with ${concept.concept} ${concept.failCount} times. Practice more to improve.`,
      concept: concept.concept,
      priority: "high",
      estimated_duration_minutes: 30,
      difficulty: "beginner"
    });
  }
  
  return recommendations;
}

async function saveRecommendation(studentId, recommendation) {
  try {
    const { query } = await import('@/lib/db');
    await query(`
      INSERT INTO recommendations (student_id, concept, title, type, url, reason, priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (student_id, concept) 
      DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url, reason = EXCLUDED.reason, generated_at = NOW()
    `, [studentId, recommendation.concept, recommendation.title, recommendation.type, recommendation.url, recommendation.reason, recommendation.priority]);
  } catch (error) {
    console.error('Failed to save recommendation:', error);
  }
}