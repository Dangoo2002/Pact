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

    // Get student's previous performance with caching
    const previousResponses = await query(`
      SELECT r.is_correct, r.question_text, qs.concept
      FROM responses r
      JOIN quiz_sessions qs ON r.session_id = qs.session_id
      WHERE r.student_id = $1 AND qs.concept = $2
      ORDER BY r.timestamp DESC
      LIMIT 20
    `, [studentId, concept]);

    const totalPrevious = previousResponses.rows.length;
    const correctPrevious = previousResponses.rows.filter(r => r.is_correct).length;
    const accuracy = totalPrevious > 0 ? (correctPrevious / totalPrevious) * 100 : 50;
    
    // Determine adaptive difficulty (1-3)
    let adaptiveDifficulty = 2;
    if (accuracy >= 80) adaptiveDifficulty = 3;
    else if (accuracy >= 60) adaptiveDifficulty = 2;
    else adaptiveDifficulty = 1;

    const weakTopics = previousResponses.rows
      .filter(r => !r.is_correct)
      .map(r => r.question_text?.substring(0, 50) || concept)
      .slice(0, 5);

    // Generate questions quickly with parallel requests
    const questions = await generateAIQuestionsFast(concept, language, adaptiveDifficulty, weakTopics);

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
      type: q.type || 'multiple_choice',
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

async function generateAIQuestionsFast(concept, language, difficultyLevel, weakTopics) {
  const languageDisplay = language === 'cpp' ? 'C++' : language === 'js' ? 'JavaScript' : language.charAt(0).toUpperCase() + language.slice(1);
  
  // Simplified prompt for faster response
  const prompt = `Generate 5 multiple-choice questions about "${concept}" in ${languageDisplay}.

Difficulty distribution: ${difficultyLevel === 1 ? '3 easy, 2 medium' : difficultyLevel === 2 ? '2 easy, 2 medium, 1 hard' : '1 easy, 2 medium, 2 hard'}
${weakTopics.length > 0 ? `Focus on: ${weakTopics.slice(0, 3).join(', ')}` : ''}

Return ONLY JSON array. Each question: {"question_text": "text", "options": ["A","B","C","D"], "correct_answer": "A", "explanation": "why", "difficulty": 1|2|3, "type": "multiple_choice"}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
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
            content: 'You are an expert programmer. Create concise, clear multiple-choice questions. Return ONLY valid JSON array. No extra text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    clearTimeout(timeoutId);

    if (!aiResponse.ok) throw new Error(`AI API error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      if (questions.length === 5) return questions;
    }
    
    throw new Error('Invalid AI response');
  } catch (error) {
    console.error('AI generation timeout, using fallback:', error);
    return generateFallbackQuestionsFast(concept, languageDisplay, difficultyLevel);
  }
}

function generateFallbackQuestionsFast(concept, language, difficultyLevel) {
  const questions = [];
  const topics = [`${concept} basics`, `${concept} syntax`, `${concept} usage`, `${concept} best practices`, `Advanced ${concept}`];
  
  for (let i = 0; i < 5; i++) {
    const difficulty = i < 2 ? 1 : i < 4 ? 2 : 3;
    questions.push({
      question_text: `What is the correct way to work with ${concept} in ${language}?`,
      options: [`Use ${concept} correctly`, `Avoid ${concept}`, `Define ${concept} first`, `Import ${concept} module`],
      correct_answer: `Use ${concept} correctly`,
      explanation: `Understanding ${concept} is fundamental to programming in ${language}.`,
      difficulty: difficulty,
      topic: topics[i],
      type: 'multiple_choice'
    });
  }
  
  return questions;
}