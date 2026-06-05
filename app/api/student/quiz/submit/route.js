import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, questionIndex, answer, codeSubmission, allQuestions } = await request.json();

    // Get quiz session - don't filter by student_id
    const sessionResult = await query(`
      SELECT session_id, student_id, concept, language, total_questions, 
             current_question_index, score
      FROM quiz_sessions
      WHERE session_id = $1
    `, [sessionId]);
    
    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    const quizSession = sessionResult.rows[0];
    const currentQuestion = allQuestions[questionIndex];
    
    // Evaluate answer
    let isCorrect = false;
    let explanation = '';
    
    if (codeSubmission) {
      // Code evaluation with AI
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
                content: 'You are a code evaluator. Return ONLY valid JSON: {"is_correct": true/false, "explanation": "feedback"}'
              },
              {
                role: 'user',
                content: `Question: ${currentQuestion.question_text}\n\nStudent's code:\n${codeSubmission}\n\nExpected: ${currentQuestion.correct_answer}`
              }
            ],
            temperature: 0.2,
            max_tokens: 300
          })
        });
        
        const aiData = await aiResponse.json();
        const content = aiData.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const evalResult = JSON.parse(jsonMatch[0]);
          isCorrect = evalResult.is_correct;
          explanation = evalResult.explanation;
        }
      } catch (e) {
        isCorrect = false;
        explanation = "Code evaluation failed.";
      }
    } else {
      // Multiple choice comparison
      isCorrect = (answer === currentQuestion.correct_answer);
      explanation = currentQuestion.explanation || (isCorrect ? 'Correct!' : 'Incorrect.');
    }
    
    // Save response
    await query(`
      INSERT INTO responses (student_id, session_id, question_text, is_correct, selected_answer, code_submission, concept, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [quizSession.student_id, sessionId, currentQuestion.question_text, isCorrect, answer, codeSubmission, quizSession.concept]);
    
    // Update session progress
    const newIndex = (quizSession.current_question_index || 0) + 1;
    const newScore = (quizSession.score || 0) + (isCorrect ? 1 : 0);
    
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
      
      return NextResponse.json({
        is_correct: isCorrect,
        explanation: explanation,
        quiz_completed: true,
        final_score: newScore,
        total_score: totalQuestions
      });
    }
    
    // Return next question
    const nextQuestion = allQuestions[newIndex];
    return NextResponse.json({
      is_correct: isCorrect,
      explanation: explanation,
      next_question: {
        id: newIndex,
        text: nextQuestion.question_text,
        options: nextQuestion.options,
        correct_answer: nextQuestion.correct_answer,
        explanation: nextQuestion.explanation,
        type: 'multiple_choice',
        concept: quizSession.concept,
        language: quizSession.language,
        difficulty: nextQuestion.difficulty
      },
      quiz_completed: false,
      current_score: newScore,
      questions_answered: newIndex
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    return NextResponse.json({ error: 'Failed to submit answer: ' + error.message }, { status: 500 });
  }
}