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

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Get student's performance data
    const responses = await query(`
      SELECT r.*, qs.concept, qs.language
      FROM responses r
      JOIN quiz_sessions qs ON r.session_id = qs.session_id
      WHERE r.student_id = $1 AND r.is_correct = false
      ORDER BY r.timestamp DESC
      LIMIT 30
    `, [studentId]);

    if (responses.rows.length === 0) {
      return NextResponse.json({ 
        recommendations: [],
        message: "Complete quizzes to get AI-powered recommendations"
      });
    }

    // Get stored gap analysis
    const storedAnalysis = await query(`
      SELECT analysis_data
      FROM gap_analysis
      WHERE student_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [studentId]);

    // Generate AI recommendations
    const recommendations = await generateAIRecommendations(studentId, responses.rows, storedAnalysis.rows[0]?.analysis_data);

    return NextResponse.json({
      recommendations: recommendations,
      source: 'mistral-ai',
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateAIRecommendations(studentId, incorrectResponses, storedAnalysis) {
  const conceptsNeedingHelp = [...new Set(incorrectResponses.map(r => r.concept))];
  
  const prompt = `Generate personalized learning recommendations for this student.

STUDENT: ${studentId}
CONCEPTS STRUGGLING WITH: ${conceptsNeedingHelp.join(', ')}
INCORRECT RESPONSES:
${JSON.stringify(incorrectResponses.slice(0, 10).map(r => ({
  concept: r.concept,
  question: r.question_text,
  their_answer: r.selected_answer
})), null, 2)}

${storedAnalysis ? `PREVIOUS ANALYSIS: ${JSON.stringify(storedAnalysis)}` : ''}

Return ONLY valid JSON array. Each recommendation must have:
- title: specific, actionable title
- type: "video", "article", "exercise", "interactive", "course"
- url: REAL working URL (YouTube, freeCodeCamp, MDN, W3Schools, Coursera, edX, Khan Academy)
- description: why this specific resource helps their specific struggle
- concept: which concept it addresses
- priority: "high", "medium", "low"
- estimated_duration_minutes: number

Generate 5-8 personalized recommendations.`;

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
            content: 'You are a learning resource curator. Return ONLY valid JSON array. Use real, working educational URLs. No markdown.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 3000
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

  throw new Error('AI recommendation generation failed');
}