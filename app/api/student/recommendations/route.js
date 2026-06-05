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

    // Get the most recent gap analysis for this student
    const analysisResult = await query(`
      SELECT concept, analysis_data, created_at
      FROM gap_analysis
      WHERE student_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [studentId]);

    // Get recent incorrect responses
    const incorrectResponses = await query(`
      SELECT r.*, qs.concept, qs.language
      FROM responses r
      JOIN quiz_sessions qs ON r.session_id = qs.session_id
      WHERE r.student_id = $1 AND r.is_correct = false
      ORDER BY r.timestamp DESC
      LIMIT 20
    `, [studentId]);

    // If no analysis exists, return message
    if (analysisResult.rows.length === 0 && incorrectResponses.rows.length === 0) {
      return NextResponse.json({ 
        recommendations: [],
        message: "Complete a quiz and click 'Save & Analyze' to get personalized recommendations"
      });
    }

    let recommendations = [];

    // Extract recommendations from stored analysis
    for (const row of analysisResult.rows) {
      const analysis = row.analysis_data;
      if (analysis && analysis.recommendations && analysis.recommendations.length > 0) {
        recommendations.push(...analysis.recommendations.map(rec => ({
          ...rec,
          concept: row.concept,
          generated_at: row.created_at
        })));
      }
    }

    // If no recommendations in stored analysis, generate new ones
    if (recommendations.length === 0 && incorrectResponses.rows.length > 0) {
      recommendations = await generateAIRecommendations(studentId, incorrectResponses.rows);
    }

    // Remove duplicates by title
    const uniqueRecs = [];
    const seenTitles = new Set();
    for (const rec of recommendations) {
      if (!seenTitles.has(rec.title)) {
        seenTitles.add(rec.title);
        uniqueRecs.push(rec);
      }
    }

    return NextResponse.json({
      recommendations: uniqueRecs.slice(0, limit),
      total: uniqueRecs.length,
      source: 'ai-analysis',
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateAIRecommendations(studentId, incorrectResponses) {
  const conceptsNeedingHelp = [...new Set(incorrectResponses.map(r => r.concept))];
  
  const prompt = `Generate personalized learning recommendations for a student.

CONCEPTS STRUGGLING WITH: ${conceptsNeedingHelp.join(', ')}
INCORRECT RESPONSES:
${JSON.stringify(incorrectResponses.slice(0, 5).map(r => ({
  concept: r.concept,
  question: r.question_text,
  their_answer: r.selected_answer
})), null, 2)}

Return ONLY valid JSON array. Each recommendation must have:
- title: specific, actionable title
- type: "video", "article", "exercise"
- url: working educational URL (YouTube, freeCodeCamp, W3Schools, MDN)
- description: why this helps their specific struggle
- concept: which concept it addresses
- priority: "high", "medium", "low"

Example:
[{"title": "Python Variables Explained", "type": "video", "url": "https://www.youtube.com/results?search_query=python+variables", "description": "Learn variable basics", "concept": "variables", "priority": "high"}]`;

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
            content: 'You are a learning resource curator. Return ONLY valid JSON array. Use real, working educational URLs.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 2000
      })
    });

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content || '[]';
    const match = content.match(/\[[\s\S]*\]/);
    
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (error) {
    console.error('AI recommendation generation failed:', error);
  }

  // Fallback recommendations based on concepts
  return conceptsNeedingHelp.map(concept => ({
    title: `Master ${concept} - Complete Tutorial`,
    type: "tutorial",
    url: `https://www.w3schools.com/python/python_${concept.toLowerCase()}.asp`,
    description: `You struggled with ${concept}. This tutorial covers the fundamentals.`,
    concept: concept,
    priority: "high"
  }));
}