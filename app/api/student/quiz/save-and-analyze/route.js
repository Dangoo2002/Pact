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

    // Store analysis in database with session_id link
    await query(`
      INSERT INTO gap_analysis (student_id, concept, session_id, analysis_data, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (student_id, concept, session_id) 
      DO UPDATE SET analysis_data = EXCLUDED.analysis_data, created_at = NOW()
    `, [studentId, concept, sessionId, JSON.stringify(analysis)]);

    // Also update the session to mark that analysis is complete
    await query(`
      UPDATE quiz_sessions 
      SET analysis_complete = true, analysis_data = $1
      WHERE session_id = $2
    `, [JSON.stringify(analysis), sessionId]);

    // *** CALL THE PERFORMANCE UPDATE ENDPOINT ***
    const performanceResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/student/update-performance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: studentId,
        sessionId: sessionId
      })
    });

    if (!performanceResponse.ok) {
      console.error('Failed to update performance:', await performanceResponse.text());
    }

    return NextResponse.json({
      success: true,
      analysis: analysis,
      session_id: sessionId,
      message: "Quiz analysis complete and performance updated"
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

Return ONLY valid JSON with this exact structure:
{
  "mastery_level": "beginner/intermediate/advanced",
  "accuracy_percentage": ${accuracy},
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": [
    {
      "title": "specific resource title",
      "type": "video/article/exercise",
      "url": "working educational URL",
      "description": "why this helps"
    }
  ],
  "next_steps": ["step 1", "step 2", "step 3"]
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
        { role: 'system', content: 'Return ONLY valid JSON. No other text. Use real educational URLs.' },
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
    accuracy_percentage: accuracy,
    strengths: [],
    weaknesses: [`Need more practice with ${concept}`],
    recommendations: [
      {
        title: `${concept} Tutorial`,
        type: "tutorial",
        url: `https://www.w3schools.com/python/python_${concept.toLowerCase()}.asp`,
        description: `Learn ${concept} fundamentals`
      }
    ],
    next_steps: [`Review ${concept} basics`, `Take another quiz on ${concept}`]
  };
}