// app/api/student/quiz/submit/route.js
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
              current_question_index, score, status
       FROM quiz_sessions
       WHERE session_id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const quizSession = sessionResult.rows[0];
    
    if (quizSession.status === 'completed') {
      return NextResponse.json({ 
        error: 'Quiz already completed',
        quiz_completed: true 
      }, { status: 400 });
    }

    const currentIdx = questionIndex !== undefined ? questionIndex : (quizSession.current_question_index || 0);
    const currentQ = allQuestions?.[currentIdx];

    if (!currentQ) {
      return NextResponse.json({ error: 'Question not found' }, { status: 400 });
    }

    // Determine if answer is correct with high accuracy
    let isCorrect = false;
    let explanation = '';
    let correctAnswerText = '';

    // FIRST: Try exact string matching for multiple choice
    if (answer && currentQ.correct_answer) {
      // Exact match (case-insensitive, trimmed)
      const normalizedAnswer = answer.trim().toLowerCase();
      const normalizedCorrect = currentQ.correct_answer.trim().toLowerCase();
      
      if (normalizedAnswer === normalizedCorrect) {
        isCorrect = true;
        explanation = 'Correct! Well done.';
        correctAnswerText = currentQ.correct_answer;
      }
      // Also check if answer matches any option letter (A, B, C, D)
      else if (answer.length === 1 && /^[A-D]$/i.test(answer)) {
        const optionIndex = answer.toUpperCase().charCodeAt(0) - 65;
        if (currentQ.options && currentQ.options[optionIndex]) {
          const selectedOptionText = currentQ.options[optionIndex];
          if (selectedOptionText === currentQ.correct_answer) {
            isCorrect = true;
            explanation = 'Correct! Well done.';
            correctAnswerText = currentQ.correct_answer;
          }
        }
      }
    }

    // SECOND: For code submissions, use AI evaluation with enhanced context
    if (!isCorrect && codeSubmission) {
      try {
        const evaluation = await evaluateCodeWithAI(currentQ, codeSubmission, quizSession.language);
        isCorrect = evaluation.isCorrect;
        explanation = evaluation.explanation;
        correctAnswerText = evaluation.correctAnswer || currentQ.correct_answer;
      } catch (aiError) {
        console.error('AI evaluation failed:', aiError);
        isCorrect = false;
        explanation = 'Unable to evaluate code. Please check your syntax and try again.';
        correctAnswerText = currentQ.correct_answer;
      }
    }
    // THIRD: For multiple choice that wasn't exact match, use AI for detailed feedback
    else if (!isCorrect && answer && currentQ.options) {
      try {
        const evaluation = await evaluateMultipleChoiceWithAI(currentQ, answer, quizSession.language);
        isCorrect = evaluation.isCorrect;
        explanation = evaluation.explanation;
        correctAnswerText = evaluation.correctAnswer || currentQ.correct_answer;
      } catch (aiError) {
        console.error('AI evaluation failed:', aiError);
        isCorrect = false;
        explanation = `Incorrect. The correct answer is: ${currentQ.correct_answer}`;
        correctAnswerText = currentQ.correct_answer;
      }
    }
    // FOURTH: Fallback for any unhandled cases
    else if (!isCorrect && !codeSubmission) {
      explanation = `Incorrect. The correct answer is: ${currentQ.correct_answer || 'Not available'}`;
      correctAnswerText = currentQ.correct_answer;
      isCorrect = false;
    }

    // Save response to database
    try {
      await query(
        `INSERT INTO responses 
          (student_id, session_id, question_text, is_correct, selected_answer, 
           code_submission, ai_feedback, concept, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          session.user.id,
          sessionId,
          currentQ.text,
          isCorrect,
          answer || null,
          codeSubmission || null,
          explanation,
          quizSession.concept || 'general'
        ]
      );
    } catch (dbError) {
      console.error('Database save error:', dbError);
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

      const percentageScore = Math.round((newScore / totalQuestions) * 100);
      
      await query(
        `UPDATE quiz_sessions
         SET percentage_score = $1
         WHERE session_id = $2`,
        [percentageScore, sessionId]
      );

      // Trigger performance update in background
      fetch(`${process.env.NEXTAUTH_URL}/api/student/update-performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: quizSession.student_id,
          sessionId: sessionId
        })
      }).catch(err => console.error('Background performance update failed:', err));
    }

    const nextQ = completed ? null : allQuestions?.[newIndex];

    return NextResponse.json({
      is_correct: isCorrect,
      explanation: explanation,
      correct_answer: correctAnswerText,
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

async function evaluateCodeWithAI(question, codeSubmission, language) {
  const prompt = `You are a strict but fair coding instructor. Evaluate the student's code against the expected solution.

QUESTION: ${question.text}
EXPECTED CORRECT ANSWER/CONCEPT: ${question.correct_answer || 'Based on the question context'}

STUDENT'S CODE:
\`\`\`${language || 'python'}
${codeSubmission}
\`\`\`

Evaluate based on:
1. Does the code correctly solve the problem?
2. Are there syntax errors? (missing colons, indentation, brackets, etc.)
3. Does the code produce the expected output?

Return ONLY valid JSON with this EXACT structure:
{
  "isCorrect": true or false,
  "explanation": "If correct: 'Correct! [brief positive feedback]'. If incorrect: 'Incorrect. [specific error found, e.g., Missing colon on line X, Indentation error, Variable name typo, etc.]. The correct approach would be: [brief explanation]'",
  "correctAnswer": "The expected correct code or answer"
}`;

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          { role: 'system', content: 'You are a coding instructor. Be accurate and specific. Return ONLY valid JSON. Never use markdown formatting.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 600
      })
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    const match = content.match(/\{[\s\S]*\}/);
    
    if (match) {
      const result = JSON.parse(match[0]);
      return {
        isCorrect: result.isCorrect === true,
        explanation: result.explanation || 'Evaluation completed.',
        correctAnswer: result.correctAnswer || question.correct_answer
      };
    }
    
    return { isCorrect: false, explanation: 'Unable to evaluate code. Please check syntax.', correctAnswer: question.correct_answer };
  } catch (error) {
    console.error('AI code evaluation error:', error);
    return { isCorrect: false, explanation: 'Evaluation service unavailable. Please try again.', correctAnswer: question.correct_answer };
  }
}

async function evaluateMultipleChoiceWithAI(question, studentAnswer, language) {
  const prompt = `Evaluate this multiple choice answer.

QUESTION: ${question.text}
OPTIONS:
A. ${question.options?.[0] || 'N/A'}
B. ${question.options?.[1] || 'N/A'}
C. ${question.options?.[2] || 'N/A'}
D. ${question.options?.[3] || 'N/A'}

CORRECT ANSWER: ${question.correct_answer}
STUDENT ANSWER: ${studentAnswer}

Determine if the student's answer matches the correct answer (considering letter selections like 'A' or full text).

Return ONLY valid JSON:
{
  "isCorrect": true or false,
  "explanation": "If correct: 'Correct! [brief explanation of why]'. If incorrect: 'Incorrect. [explanation of the correct concept]. The correct answer is: [correct answer]'",
  "correctAnswer": "The correct answer text"
}`;

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          { role: 'system', content: 'You are an exam grader. Be accurate. Return ONLY valid JSON. Never use markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 400
      })
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    const match = content.match(/\{[\s\S]*\}/);
    
    if (match) {
      const result = JSON.parse(match[0]);
      return {
        isCorrect: result.isCorrect === true,
        explanation: result.explanation || `The correct answer is: ${question.correct_answer}`,
        correctAnswer: result.correctAnswer || question.correct_answer
      };
    }
    
    const isExactMatch = studentAnswer === question.correct_answer;
    return { 
      isCorrect: isExactMatch, 
      explanation: isExactMatch ? 'Correct!' : `Incorrect. The correct answer is: ${question.correct_answer}`,
      correctAnswer: question.correct_answer
    };
  } catch (error) {
    console.error('AI multiple choice evaluation error:', error);
    const isExactMatch = studentAnswer === question.correct_answer;
    return { 
      isCorrect: isExactMatch, 
      explanation: isExactMatch ? 'Correct!' : `Incorrect. The correct answer is: ${question.correct_answer}`,
      correctAnswer: question.correct_answer
    };
  }
}