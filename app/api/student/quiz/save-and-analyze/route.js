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

    // Generate AI analysis
    const analysis = await generateAIAnalysis(studentId, concept, answers, score, totalQuestions);

    // Store analysis in database
    await query(`
      INSERT INTO gap_analysis (student_id, concept, analysis_data, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (student_id, concept) 
      DO UPDATE SET analysis_data = EXCLUDED.analysis_data, created_at = NOW()
    `, [studentId, concept, JSON.stringify(analysis)]);

    return NextResponse.json({
      success: true,
      analysis: analysis,
      message: "Quiz analysis complete"
    });
  } catch (error) {
    console.error('Save and analyze error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateAIAnalysis(studentId, concept, answers, score, totalQuestions) {
  const accuracy = (score / totalQuestions) * 100;
  
  const prompt = `Analyze this student's quiz performance.

CONCEPT: ${concept}
SCORE: ${score}/${totalQuestions} (${accuracy}%)
ANSWERS:
${JSON.stringify(answers.map(a => ({
  question: a.question,
  their_answer: a.answer,
  correct: a.isCorrect,
  correct_answer: a.correct_answer
})), null, 2)}

Return ONLY valid JSON:
{
  "mastery_level": "beginner/intermediate/advanced",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": [
    {
      "title": "resource title",
      "type": "video/article/exercise",
      "url": "working URL",
      "description": "why this helps"
    }
  ],
  "next_steps": ["step 1", "step 2"]
}`;

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: 'Return ONLY valid JSON. No other text.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  const match = content.match(/\{[\s\S]*\}/);
  
  return match ? JSON.parse(match[0]) : {
    mastery_level: accuracy >= 70 ? 'intermediate' : 'beginner',
    strengths: [],
    weaknesses: [`Need more practice with ${concept}`],
    recommendations: [],
    next_steps: [`Review ${concept} fundamentals`]
  };
}