import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, questionId, answer, codeSubmission } = await request.json();

    // Get question details
    const questionResult = await query(`
      SELECT q.*, c.concept_name as concept, c.category as language
      FROM questions q
      JOIN concepts c ON q.concept_id = c.concept_id
      WHERE q.question_id = $1
    `, [questionId]);
    
    const question = questionResult.rows[0];

    // Use AI to evaluate the answer if it's a code submission
    let isCorrect = false;
    let explanation = '';
    let gapType = null;

    if (codeSubmission) {
      // Evaluate code using Mistral AI
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
              content: `You are a code evaluator. Check if the student's code correctly solves the problem. Return JSON: {"is_correct": true/false, "explanation": "feedback"}`
            },
            {
              role: 'user',
              content: `Problem: ${question.question_text}\nStudent code:\n${codeSubmission}\nCorrect approach: ${question.correct_answer}`
            }
          ],
          temperature: 0.2,
          max_tokens: 300
        })
      });
      
      const aiData = await aiResponse.json();
      try {
        const evalResult = JSON.parse(aiData.choices[0].message.content);
        isCorrect = evalResult.is_correct;
        explanation = evalResult.explanation;
      } catch (e) {
        isCorrect = (answer === question.correct_answer);
        explanation = isCorrect ? 'Correct answer!' : 'Incorrect. Review the concept.';
      }
    } else {
      // Multiple choice - compare directly
      isCorrect = (answer === question.correct_answer);
      explanation = question.explanation || (isCorrect ? 'Correct!' : 'Incorrect. Review the material.');
    }

    // Save response
    await query(`
      INSERT INTO responses (student_id, question_id, is_correct, response_time_ms, code_submission, selected_answer, error_message, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [session.user.id, questionId, isCorrect, 0, codeSubmission, answer, gapType]);

    // Get session info
    const sessionResult = await query(`
      SELECT total_questions, current_question_index, score
      FROM quiz_sessions
      WHERE session_id = $1
    `, [sessionId]);
    
    let currentIndex = (sessionResult.rows[0]?.current_question_index || 0) + 1;
    let newScore = (sessionResult.rows[0]?.score || 0) + (isCorrect ? 1 : 0);
    
    // Update session progress
    await query(`
      UPDATE quiz_sessions 
      SET current_question_index = $1, score = $2
      WHERE session_id = $3
    `, [currentIndex, newScore, sessionId]);

    const totalQuestions = parseInt(sessionResult.rows[0]?.total_questions || 10);
    const quizCompleted = currentIndex >= totalQuestions;

    // Send performance data to KGI API for gap analysis
    if (codeSubmission) {
      await fetch(`${process.env.NEXT_PUBLIC_KGI_API_URL}/api/v1/kgi/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: session.user.id,
          question_id: questionId,
          language: question.language,
          concept: question.concept,
          question_type: 'code_writing',
          is_correct: isCorrect,
          response_time_ms: 0,
          attempts: 1,
          code_submission: codeSubmission,
          error_message: gapType,
          timestamp: new Date().toISOString()
        })
      });
    }

    if (quizCompleted) {
      await query(`
        UPDATE quiz_sessions 
        SET status = 'completed', completed_at = NOW()
        WHERE session_id = $1
      `, [sessionId]);
      
      return NextResponse.json({
        is_correct: isCorrect,
        explanation: explanation,
        quiz_completed: true,
        final_score: newScore,
        total_score: totalQuestions
      });
    }

    // Get next question
    const nextQuestionResult = await query(`
      SELECT q.*, c.concept_name as concept, c.category as language
      FROM questions q
      JOIN concepts c ON q.concept_id = c.concept_id
      WHERE q.question_id > $1
      ORDER BY q.question_id
      LIMIT 1
    `, [questionId]);

    let nextQuestion = null;
    if (nextQuestionResult.rows.length > 0) {
      const q = nextQuestionResult.rows[0];
      nextQuestion = {
        id: q.question_id,
        text: q.question_text,
        options: q.metadata?.options || [],
        type: 'multiple_choice',
        concept: q.concept,
        language: q.language,
        difficulty: q.difficulty
      };
    }

    return NextResponse.json({
      is_correct: isCorrect,
      explanation: explanation,
      next_question: nextQuestion,
      quiz_completed: false,
      current_score: newScore,
      questions_answered: currentIndex
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
  }
}