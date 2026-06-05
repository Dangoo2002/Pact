import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, concept, language } = await request.json();

    // Get student's previous performance for personalization
    const previousResponses = await query(`
      SELECT r.is_correct, r.question_text, qs.concept
      FROM responses r
      JOIN quiz_sessions qs ON r.session_id = qs.session_id
      WHERE r.student_id = $1 AND qs.concept = $2
      ORDER BY r.timestamp DESC
      LIMIT 15
    `, [studentId, concept]);

    const totalPrevious = previousResponses.rows.length;
    const correctPrevious = previousResponses.rows.filter(r => r.is_correct).length;
    const accuracy = totalPrevious > 0 ? (correctPrevious / totalPrevious) * 100 : 50;
    
    // Determine adaptive difficulty
    let adaptiveDifficulty = 2; // medium default
    if (accuracy >= 80) adaptiveDifficulty = 3; // hard
    else if (accuracy >= 60) adaptiveDifficulty = 2; // medium
    else if (accuracy >= 40) adaptiveDifficulty = 1; // easy
    else adaptiveDifficulty = 1; // very easy

    // Identify weak topics from previous responses
    const weakTopics = previousResponses.rows
      .filter(r => !r.is_correct)
      .map(r => r.question_text?.substring(0, 50) || concept)
      .slice(0, 5);

    // Generate 5 unique adaptive questions using AI only
    const questions = await generateAIQuestions(concept, language, adaptiveDifficulty, weakTopics, studentId);

    // Create session
    const sessionId = `session_${Date.now()}_${studentId}`;
    const studentIdStr = String(studentId);
    
    await query(`
      INSERT INTO quiz_sessions (session_id, student_id, concept, language, total_questions, started_at, status, current_question_index, score, difficulty_level, weak_focus)
      VALUES ($1, $2, $3, $4, $5, NOW(), 'active', $6, $7, $8, $9)
    `, [sessionId, studentIdStr, concept, language, questions.length, 0, 0, adaptiveDifficulty, JSON.stringify(weakTopics)]);

    const formattedQuestions = questions.map((q, idx) => ({
      id: idx,
      text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      type: 'multiple_choice',
      concept: concept,
      language: language,
      difficulty: q.difficulty,
      topic: q.topic
    }));

    return NextResponse.json({
      session_id: sessionId,
      current_question: formattedQuestions[0],
      total_questions: formattedQuestions.length,
      all_questions: formattedQuestions,
      time_limit: 600,
      adaptive_level: adaptiveDifficulty,
      message: `Quiz generated at ${adaptiveDifficulty === 3 ? 'advanced' : adaptiveDifficulty === 2 ? 'intermediate' : 'beginner'} level`
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    return NextResponse.json({ error: 'Failed to start quiz: ' + error.message }, { status: 500 });
  }
}

async function generateAIQuestions(concept, language, difficultyLevel, weakTopics, studentId) {
  const difficultyText = difficultyLevel === 1 ? 'easy/beginner' : difficultyLevel === 2 ? 'intermediate' : 'advanced/challenging';
  
  const prompt = `Generate 5 unique, original multiple-choice questions about "${concept}" in ${language} programming.

REQUIREMENTS:
- Difficulty level: ${difficultyText}
- All questions must be DIFFERENT and test distinct aspects of ${concept}
${weakTopics.length > 0 ? `- Focus on these weak areas: ${weakTopics.join(', ')}` : '- Cover the most important fundamentals'}
- Each question must be creative and not obvious
- No duplicate questions
- Questions should progressively get harder if difficulty is advanced

Return ONLY valid JSON array. NO markdown, NO explanations outside JSON.

Each question object must have:
{
  "question_text": "clear, specific question",
  "options": ["option A", "option B", "option C", "option D"],
  "correct_answer": "exact text of the correct option",
  "explanation": "detailed explanation of why this is correct and common misconceptions",
  "difficulty": ${difficultyLevel},
  "topic": "specific sub-topic within ${concept}"
}

Generate 5 questions now.`;

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
            content: 'You are an expert programming educator and question designer. Create high-quality, original multiple-choice questions. Return ONLY valid JSON array. No other text ever.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 4000
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      if (questions.length === 5) {
        return questions;
      }
    }
    
    throw new Error('Invalid AI response format');
  } catch (error) {
    console.error('AI generation failed:', error);
    return { error: true, message: error.message };
  }
}