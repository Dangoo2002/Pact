import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      sessionId, 
      questionIndex, 
      answer, 
      codeSubmission, 
      allQuestions, 
      isCorrect: finalIsCorrect,
      finalScore,
      totalQuestions,
      quizCompleted 
    } = await request.json();

    // Get or create quiz session
    let sessionResult = await query(`
      SELECT session_id, student_id, concept, language, total_questions, 
             current_question_index, score
      FROM quiz_sessions
      WHERE session_id = $1
    `, [sessionId]);

    let quizSession;
    if (sessionResult.rows.length === 0) {
      // Create new session if it doesn't exist
      const newSessionId = sessionId;
      await query(`
        INSERT INTO quiz_sessions (session_id, student_id, concept, language, total_questions, started_at, status)
        VALUES ($1, $2, $3, $4, $5, NOW(), 'active')
      `, [newSessionId, session.user.id, allQuestions[0]?.concept || 'unknown', allQuestions[0]?.language || 'python', allQuestions.length]);
      
      sessionResult = await query(`
        SELECT session_id, student_id, concept, language, total_questions, 
               current_question_index, score
        FROM quiz_sessions
        WHERE session_id = $1
      `, [newSessionId]);
    }
    
    quizSession = sessionResult.rows[0];
    const currentQuestion = allQuestions?.[questionIndex];

    let isCorrect = finalIsCorrect;
    let explanation = '';

    // Evaluate answer using AI if not provided
    if (currentQuestion && isCorrect === undefined) {
      if (codeSubmission) {
        // AI Code Evaluation
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
                  content: 'You are a code evaluator. Return ONLY valid JSON: {"is_correct": true/false, "explanation": "feedback", "suggestions": "improvement tips"}'
                },
                {
                  role: 'user',
                  content: `Question: ${currentQuestion.question_text}\n\nStudent's code:\n${codeSubmission}\n\nExpected correct answer: ${currentQuestion.correct_answer}`
                }
              ],
              temperature: 0.2,
              max_tokens: 500
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
      } else if (answer) {
        // Multiple choice comparison
        isCorrect = (answer === currentQuestion.correct_answer);
        explanation = isCorrect ? 'Correct!' : 'Incorrect. The correct answer is: ' + currentQuestion.correct_answer;
      }
    }

    // Save individual question response
    if (currentQuestion) {
      await query(`
        INSERT INTO responses (student_id, session_id, question_text, is_correct, selected_answer, code_submission, concept, language, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `, [session.user.id, sessionId, currentQuestion.question_text, isCorrect, answer, codeSubmission, currentQuestion.concept, currentQuestion.language]);
    }

    // Update session progress
    if (!quizCompleted && questionIndex !== undefined) {
      const newIndex = (quizSession.current_question_index || 0) + 1;
      const newScore = (quizSession.score || 0) + (isCorrect ? 1 : 0);
      
      await query(`
        UPDATE quiz_sessions 
        SET current_question_index = $1, score = $2
        WHERE session_id = $3
      `, [newIndex, newScore, sessionId]);
    }

    // Handle quiz completion
    if (quizCompleted || (finalScore !== undefined)) {
      const total = totalQuestions || quizSession.total_questions;
      const finalScoreValue = finalScore !== undefined ? finalScore : (quizSession.score || 0);
      
      await query(`
        UPDATE quiz_sessions 
        SET status = 'completed', completed_at = NOW(), score = $1
        WHERE session_id = $2
      `, [finalScoreValue, sessionId]);
      
      // Generate AI analysis of quiz results
      const analysis = await generateAIAnalysis(session.user.id, quizSession.concept, allQuestions);
      
      return NextResponse.json({
        is_correct: isCorrect,
        explanation: explanation,
        quiz_completed: true,
        final_score: finalScoreValue,
        total_score: total,
        analysis: analysis
      });
    }
    
    return NextResponse.json({
      is_correct: isCorrect,
      explanation: explanation,
      quiz_completed: false,
      current_score: quizSession.score || 0,
      questions_answered: (quizSession.current_question_index || 0) + 1
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    return NextResponse.json({ error: 'Failed to submit answer: ' + error.message }, { status: 500 });
  }
}

async function generateAIAnalysis(studentId, concept, questions) {
  try {
    // Get all responses for this student
    const responses = await query(`
      SELECT question_text, is_correct, selected_answer, concept, language, timestamp
      FROM responses 
      WHERE student_id = $1 AND concept = $2
      ORDER BY timestamp DESC
      LIMIT 10
    `, [studentId, concept]);
    
    const correctCount = responses.rows.filter(r => r.is_correct).length;
    const totalCount = responses.rows.length;
    const accuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
    
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
            content: 'You are an educational analyst. Analyze the student\'s quiz performance and provide insights. Return JSON only.'
          },
          {
            role: 'user',
            content: `Student scored ${correctCount}/${totalCount} (${accuracy}%) on ${concept}. 
            Questions and correctness: ${JSON.stringify(responses.rows)}
            
            Provide analysis with: 
            1. knowledge_gaps (array of concepts they struggled with)
            2. recommendations (array of specific resources to study)
            3. mastery_level (0-100)
            4. next_steps (what to focus on)`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
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
  
  return {
    knowledge_gaps: [],
    recommendations: [],
    mastery_level: 0,
    next_steps: "Complete more quizzes to get detailed analysis."
  };
}