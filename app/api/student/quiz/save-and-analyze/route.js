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

    // Save all answers if not already saved
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (question) {
        await query(`
          INSERT INTO responses (student_id, session_id, question_text, is_correct, selected_answer, concept, language, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT DO NOTHING
        `, [studentId, sessionId, question.text, answer.isCorrect, answer.answer, concept, language]);
      }
    }

    // Generate AI analysis of all responses
    const analysis = await generateComprehensiveAnalysis(studentId, concept, answers, score, totalQuestions);

    // Store analysis
    await query(`
      INSERT INTO gap_analysis (student_id, concept, analysis_data, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (student_id, concept) 
      DO UPDATE SET analysis_data = EXCLUDED.analysis_data, created_at = NOW()
    `, [studentId, concept, JSON.stringify(analysis)]);

    return NextResponse.json({
      success: true,
      analysis: analysis,
      message: "AI analysis complete"
    });
  } catch (error) {
    console.error('Save and analyze error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateComprehensiveAnalysis(studentId, concept, answers, score, totalQuestions) {
  const accuracy = (score / totalQuestions) * 100;
  
  const prompt = `Perform a comprehensive educational analysis of this student's performance.

STUDENT: ${studentId}
CONCEPT: ${concept}
ACCURACY: ${accuracy}%
SCORE: ${score}/${totalQuestions}

STUDENT'S ANSWERS:
${JSON.stringify(answers.map(a => ({
  question: a.question,
  their_answer: a.answer,
  was_correct: a.isCorrect,
  correct_answer: a.correct_answer
})), null, 2)}

Return ONLY valid JSON with this exact structure (NO other text):
{
  "overall_assessment": {
    "mastery_level": "beginner/intermediate/advanced",
    "strengths": ["detailed strength 1", "detailed strength 2"],
    "weaknesses": ["detailed weakness 1", "detailed weakness 2"],
    "accuracy_percentage": ${accuracy},
    "recommended_difficulty": "easy/medium/hard"
  },
  "knowledge_gaps": [
    {
      "concept": "specific sub-concept",
      "description": "detailed description of the gap",
      "severity": "high/medium/low",
      "evidence": ["specific error pattern from answers"]
    }
  ],
  "personalized_recommendations": [
    {
      "title": "specific resource title",
      "type": "video/article/exercise/course",
      "url": "real working URL from YouTube, freeCodeCamp, MDN, Coursera, or similar",
      "description": "why this helps their specific gap",
      "priority": "high/medium/low"
    }
  ],
  "next_steps": ["actionable step 1", "actionable step 2", "actionable step 3"],
  "study_plan": "detailed 1-2 sentence personalized study plan"
}`;

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
            content: 'You are an expert educational analyst. Return ONLY valid JSON. Use real, working educational URLs. No markdown, no extra text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('AI analysis failed:', error);
  }

  throw new Error('AI analysis generation failed');
}