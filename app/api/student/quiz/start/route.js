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

    // Get student's previous performance
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
    let adaptiveDifficulty = 2;
    if (accuracy >= 80) adaptiveDifficulty = 3;
    else if (accuracy >= 60) adaptiveDifficulty = 2;
    else adaptiveDifficulty = 1;

    const weakTopics = previousResponses.rows
      .filter(r => !r.is_correct)
      .map(r => r.question_text?.substring(0, 50) || concept)
      .slice(0, 5);

    // Generate 5 questions with mixed difficulties (1 beginner, 2 intermediate, 2 advanced for average)
    const questions = await generateAIQuestions(concept, language, adaptiveDifficulty, weakTopics);

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
      time_limit: 300,
      adaptive_level: adaptiveDifficulty,
      message: `Quiz generated for ${language}`
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    return NextResponse.json({ error: 'Failed to start quiz: ' + error.message }, { status: 500 });
  }
}

async function generateAIQuestions(concept, language, difficultyLevel, weakTopics) {
  const languageDisplay = language === 'cpp' ? 'C++' : language === 'js' ? 'JavaScript' : language.charAt(0).toUpperCase() + language.slice(1);
  
  // Create questions with mixed difficulty levels
  const difficultyDistribution = [
    { level: 1, count: 2 }, // beginner
    { level: 2, count: 2 }, // intermediate
    { level: 3, count: 1 }  // advanced
  ];
  
  if (difficultyLevel === 1) {
    difficultyDistribution[0].count = 3;
    difficultyDistribution[1].count = 2;
    difficultyDistribution[2].count = 0;
  } else if (difficultyLevel === 3) {
    difficultyDistribution[0].count = 1;
    difficultyDistribution[1].count = 2;
    difficultyDistribution[2].count = 2;
  }
  
  const prompt = `Generate 5 unique multiple-choice questions about "${concept}" in ${languageDisplay} programming.

REQUIREMENTS:
- Total: 5 questions
- Question difficulty distribution: ${difficultyDistribution[0].count} beginner, ${difficultyDistribution[1].count} intermediate, ${difficultyDistribution[2].count} advanced
- All questions must be DIFFERENT and test distinct aspects of ${concept}
${weakTopics.length > 0 ? `- Focus on these weak areas: ${weakTopics.join(', ')}` : ''}
- Each question must be creative and language-specific to ${languageDisplay}
- No duplicate questions

Return ONLY valid JSON array.

Each question object must have:
{
  "question_text": "clear, specific question for ${languageDisplay}",
  "options": ["option A", "option B", "option C", "option D"],
  "correct_answer": "exact text of the correct option",
  "explanation": "detailed explanation specific to ${languageDisplay}",
  "difficulty": 1, 2, or 3,
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
            content: 'You are an expert programming educator. Create high-quality, original multiple-choice questions for the specified programming language. Return ONLY valid JSON array. No other text ever.'
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
    // Return fallback questions for the specific language
    return generateFallbackQuestions(concept, languageDisplay, difficultyLevel);
  }
}

function generateFallbackQuestions(concept, language, difficultyLevel) {
  const questions = [];
  const topics = [`${concept} basics`, `${concept} syntax`, `${concept} usage`, `${concept} best practices`, `Advanced ${concept}`];
  
  for (let i = 0; i < 5; i++) {
    const difficulty = i < 2 ? 1 : i < 4 ? 2 : 3;
    questions.push({
      question_text: `What is the correct way to work with ${concept} in ${language}? (Question ${i + 1})`,
      options: [`Option A for ${concept}`, `Option B for ${concept}`, `Option C for ${concept}`, `Option D for ${concept}`],
      correct_answer: `Option A for ${concept}`,
      explanation: `This is the correct approach for ${concept} in ${language}.`,
      difficulty: difficulty,
      topic: topics[i]
    });
  }
  
  return questions;
}