import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sessionId,
      questionId,
      answer,
      codeSubmission,
      allQuestions,
      questionIndex,
    } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get quiz session
    const sessionResult = await query(
      `SELECT session_id, student_id, concept, language, total_questions,
              current_question_index, score
       FROM quiz_sessions
       WHERE session_id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const quizSession = sessionResult.rows[0];
    const currentIdx = questionIndex !== undefined ? questionIndex : (quizSession.current_question_index || 0);
    const currentQ = allQuestions?.[currentIdx];

    if (!currentQ) {
      return NextResponse.json({ error: 'Question not found' }, { status: 400 });
    }

    // AI Evaluation
    let isCorrect = false;
    let explanation = '';

    try {
      const evaluation = await aiEvaluate(currentQ, answer, codeSubmission);
      isCorrect = evaluation.isCorrect;
      explanation = evaluation.explanation;
    } catch (aiError) {
      console.error('AI evaluation failed:', aiError);
      // Simple comparison fallback only if AI completely fails
      if (answer && currentQ.correct_answer) {
        isCorrect = (answer === currentQ.correct_answer);
        explanation = isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${currentQ.correct_answer}`;
      } else {
        isCorrect = false;
        explanation = 'Unable to evaluate answer. Please try again.';
      }
    }

    // Save response to database
    try {
      await query(
        `INSERT INTO responses 
          (student_id, session_id, question_text, is_correct, selected_answer, 
           code_submission, concept, language, ai_feedback, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          session.user.id,
          sessionId,
          currentQ.text,
          isCorrect,
          answer || null,
          codeSubmission || null,
          quizSession.concept || 'general',
          quizSession.language || 'python',
          explanation
        ]
      );
    } catch (dbError) {
      console.error('Database save error:', dbError);
      // Continue even if save fails - don't block the quiz
    }

    // Update session progress
    const newIndex = currentIdx + 1;
    const newScore = (quizSession.score || 0) + (isCorrect ? 1 : 0);
    
    await query(
      `UPDATE quiz_sessions
       SET current_question_index = $1, score = $2
       WHERE session_id = $3`,
      [newIndex, newScore, sessionId]
    );

    const totalQuestions = Number(quizSession.total_questions) || 5;
    const completed = newIndex >= totalQuestions;

    if (completed) {
      await query(
        `UPDATE quiz_sessions
         SET status = 'completed', completed_at = NOW()
         WHERE session_id = $1`,
        [sessionId]
      );
    }

    // Get next question
    const nextQ = completed ? null : allQuestions?.[newIndex];

    return NextResponse.json({
      is_correct: isCorrect,
      explanation: explanation,
      quiz_completed: completed,
      final_score: completed ? newScore : undefined,
      total_score: completed ? totalQuestions : undefined,
      current_score: newScore,
      questions_answered: newIndex,
      next_question: nextQ,
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ 
      error: 'Failed to submit answer',
      details: error.message 
    }, { status: 500 });
  }
}

async function aiEvaluate(question, answer, codeSubmission) {
  const prompt = `Evaluate this student's answer.

QUESTION: ${question.text}
CORRECT ANSWER: ${question.correct_answer}
STUDENT ANSWER: ${answer || 'N/A'}
${codeSubmission ? `CODE SUBMISSION:\n${codeSubmission}\n` : ''}

Return ONLY valid JSON:
{
  "isCorrect": true or false,
  "explanation": "detailed feedback"
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
        { role: 'system', content: 'You evaluate programming answers. Return ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 500
    })
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  const match = content.match(/\{[\s\S]*\}/);
  
  if (match) {
    return JSON.parse(match[0]);
  }
  
  return { isCorrect: false, explanation: 'Evaluation failed' };
}