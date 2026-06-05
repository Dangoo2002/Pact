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
    const concept = searchParams.get('concept');
    const studentId = searchParams.get('studentId');

    if (!concept) {
      return NextResponse.json({ error: 'Concept required' }, { status: 400 });
    }

    // Get student's specific errors for this concept
    const errors = await query(`
      SELECT question_text, selected_answer, code_submission
      FROM responses r
      JOIN quiz_sessions qs ON r.session_id = qs.session_id
      WHERE r.student_id = $1 AND qs.concept = $2 AND r.is_correct = false
      ORDER BY r.timestamp DESC
      LIMIT 10
    `, [studentId, concept]);

    // Generate AI-powered resources
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
            content: `You are a learning resource curator. Generate specific learning resources for the student's knowledge gaps.
            Return JSON: {
              "summary": "brief analysis of student's struggle",
              "resources": [{"title": "", "type": "", "url": "", "description": "", "duration_minutes": 0}]
            }`
          },
          {
            role: 'user',
            content: `Student struggling with: ${concept}
            
Their specific errors:
${JSON.stringify(errors.rows, null, 2)}

Generate 5 specific learning resources (videos, tutorials, interactive exercises) that directly address their mistakes.`
          }
        ],
        temperature: 0.4,
        max_tokens: 2000
      })
    });

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }
    
    return NextResponse.json({
      summary: `Resources to help you master ${concept}`,
      resources: []
    });
  } catch (error) {
    console.error('AI resources error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}