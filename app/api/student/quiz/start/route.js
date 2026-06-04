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

    // Generate questions using Mistral AI
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
            content: `You are an expert programming educator. Generate 10 multiple-choice questions about ${concept} in ${language}. 
            Each question must test different aspects of the concept. Include 4 options with one correct answer.
            Return ONLY valid JSON array with this structure:
            [{
              "question_text": "the question",
              "options": ["option1", "option2", "option3", "option4"],
              "correct_answer": "correct option text",
              "explanation": "why this is correct",
              "difficulty": 1-5
            }]`
          },
          { role: 'user', content: `Generate 10 questions about ${concept} in ${language}` }
        ],
        temperature: 0.4,
        max_tokens: 3000
      })
    });

    const aiData = await aiResponse.json();
    let questions = [];
    
    try {
      const content = aiData.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
    }

    // Fallback questions if AI fails
    if (questions.length === 0) {
      questions = [
        { question_text: `What is a variable in ${language}?`, options: ["Container for data", "A function", "A loop", "A class"], correct_answer: "Container for data", explanation: "Variables store data in memory.", difficulty: 1 },
        { question_text: `How do you declare a variable in ${language}?`, options: ["var x = 5", "let x = 5", "x = 5", "int x = 5"], correct_answer: language === 'python' ? "x = 5" : "var x = 5", explanation: "This is the correct syntax.", difficulty: 1 }
      ];
    }

    // Save questions to database with session
    const sessionId = `session_${Date.now()}_${studentId}`;
    const questionsWithIds = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const result = await query(`
        INSERT INTO questions (question_text, question_type, correct_answer, explanation, difficulty, concept, language, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING question_id
      `, [q.question_text, 'multiple_choice', q.correct_answer, q.explanation, q.difficulty || 3, concept, language, JSON.stringify({ options: q.options })]);
      
      questionsWithIds.push({
        id: result.rows[0].question_id,
        text: q.question_text,
        options: q.options,
        type: 'multiple_choice',
        concept: concept,
        language: language,
        difficulty: q.difficulty || 3
      });
    }

    // Create session record
    await query(`
      INSERT INTO quiz_sessions (session_id, student_id, concept, language, total_questions, started_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [sessionId, studentId, concept, language, questionsWithIds.length]);

    return NextResponse.json({
      session_id: sessionId,
      current_question: questionsWithIds[0],
      total_questions: questionsWithIds.length,
      questions: questionsWithIds,
      time_limit: 600
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    return NextResponse.json({ error: 'Failed to start quiz' }, { status: 500 });
  }
}