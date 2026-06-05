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
    const { sessionId, questionId, answer, codeSubmission, allQuestions, questionIndex } = body;

    // Get quiz session
    let sessionResult = await query(`
      SELECT session_id, student_id, concept, language, total_questions, 
             current_question_index, score, difficulty_level, weak_focus
      FROM quiz_sessions
      WHERE session_id = $1
    `, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const quizSession = sessionResult.rows[0];
    const currentQuestion = allQuestions?.[questionIndex || quizSession.current_question_index];

    if (!currentQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // AI Evaluation of the answer
    const evaluation = await evaluateWithAI(currentQuestion, answer, codeSubmission);

    // Save response
    await query(`
      INSERT INTO responses (student_id, session_id, question_text, is_correct, selected_answer, code_submission, concept, language, ai_feedback, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `, [session.user.id, sessionId, currentQuestion.text, evaluation.isCorrect, answer, codeSubmission, quizSession.concept, quizSession.language, evaluation.explanation]);

    // Update session
    const newIndex = (quizSession.current_question_index || 0) + 1;
    const newScore = (quizSession.score || 0) + (evaluation.isCorrect ? 1 : 0);
    
    await query(`
      UPDATE quiz_sessions 
      SET current_question_index = $1, score = $2
      WHERE session_id = $3
    `, [newIndex, newScore, sessionId]);

    const totalQuestions = parseInt(quizSession.total_questions);
    const quizCompleted = newIndex >= totalQuestions;

    if (quizCompleted) {
      await query(`
        UPDATE quiz_sessions 
        SET status = 'completed', completed_at = NOW()
        WHERE session_id = $1
      `, [sessionId]);
      
      // Generate AI completion analysis
      const analysis = await generateCompletionAnalysis(session.user.id, quizSession.concept, newScore, totalQuestions);
      
      return NextResponse.json({
        is_correct: evaluation.isCorrect,
        explanation: evaluation.explanation,
        quiz_completed: true,
        final_score: newScore,
        total_score: totalQuestions,
        analysis: analysis
      });
    }

    // Get next question
    const nextQuestion = allQuestions?.[newIndex] || null;

    return NextResponse.json({
      is_correct: evaluation.isCorrect,
      explanation: evaluation.explanation,
      next_question: nextQuestion,
      quiz_completed: false,
      current_score: newScore,
      questions_answered: newIndex
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function evaluateWithAI(question, answer, codeSubmission) {
  const prompt = `Evaluate this student's answer.

QUESTION: ${question.text}
CORRECT ANSWER: ${question.correct_answer}
${answer ? `STUDENT'S ANSWER: ${answer}` : ''}
${codeSubmission ? `CODE SUBMISSION:\n${codeSubmission}` : ''}

Determine if the answer is correct. Return ONLY valid JSON:
{
  "isCorrect": true/false,
  "explanation": "detailed feedback explaining why it's correct/incorrect and what the student should learn"
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
            content: 'You are an evaluator. Return ONLY valid JSON. No other text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 500
      })
    });

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('AI evaluation failed:', error);
  }

  // Simple fallback evaluation (only if AI fails completely)
  const isCorrect = answer ? (answer === question.correct_answer) : false;
  return {
    isCorrect: isCorrect,
    explanation: isCorrect ? 'Correct answer.' : `Incorrect. The correct answer is: ${question.correct_answer}`
  };
}

async function generateCompletionAnalysis(studentId, concept, score, totalQuestions) {
  const accuracy = (score / totalQuestions) * 100;
  
  const prompt = `Analyze this quiz completion:

STUDENT: ${studentId}
CONCEPT: ${concept}
SCORE: ${score}/${totalQuestions} (${accuracy}%)

Generate a JSON analysis with:
- mastery_level (beginner/intermediate/advanced)
- strengths (what they understand)
- weaknesses (specific gaps)
- recommended_focus (what to study next)
- confidence_score (0-100)`;

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
            content: 'Return ONLY valid JSON. No other text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Analysis generation failed:', error);
  }

  return {
    mastery_level: accuracy >= 80 ? 'advanced' : accuracy >= 60 ? 'intermediate' : 'beginner',
    strengths: [],
    weaknesses: [`Need more practice with ${concept}`],
    recommended_focus: concept,
    confidence_score: accuracy
  };
}