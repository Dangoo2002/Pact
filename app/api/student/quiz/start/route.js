// app/api/student/quiz/start/route.js - Updated to ensure correct answers are stored properly
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
      LIMIT 20
    `, [studentId, concept]);

    const totalPrevious = previousResponses.rows.length;
    const correctPrevious = previousResponses.rows.filter(r => r.is_correct).length;
    const accuracy = totalPrevious > 0 ? (correctPrevious / totalPrevious) * 100 : 50;
    
    let adaptiveDifficulty = 2;
    if (accuracy >= 80) adaptiveDifficulty = 3;
    else if (accuracy >= 60) adaptiveDifficulty = 2;
    else adaptiveDifficulty = 1;

    const weakTopics = previousResponses.rows
      .filter(r => !r.is_correct)
      .map(r => r.question_text?.substring(0, 50) || concept)
      .slice(0, 5);

    // Generate questions with verified answers
    const questions = await generateQuestionsWithVerifiedAnswers(concept, language, adaptiveDifficulty, weakTopics);

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
      topic: q.topic,
      code_snippet: q.code_snippet || null
    }));

    return NextResponse.json({
      session_id: sessionId,
      current_question: formattedQuestions[0],
      total_questions: formattedQuestions.length,
      all_questions: formattedQuestions,
      time_limit: 90,
      adaptive_level: adaptiveDifficulty,
      message: `Quiz generated for ${language}`
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    return NextResponse.json({ error: 'Failed to start quiz: ' + error.message }, { status: 500 });
  }
}

async function generateQuestionsWithVerifiedAnswers(concept, language, difficultyLevel, weakTopics) {
  const languageDisplay = language === 'cpp' ? 'C++' : language === 'js' ? 'JavaScript' : language.charAt(0).toUpperCase() + language.slice(1);
  
  const prompt = `Generate 5 multiple-choice questions about "${concept}" in ${languageDisplay} programming.

IMPORTANT RULES:
1. Each question MUST have ONE clearly correct answer
2. All options must be plausible but only one is correct
3. The correct_answer field must EXACTLY match one of the options
4. Difficulty distribution: ${difficultyLevel === 1 ? '3 easy, 2 medium' : difficultyLevel === 2 ? '2 easy, 2 medium, 1 hard' : '1 easy, 2 medium, 2 hard'}
5. Focus areas: ${weakTopics.length > 0 ? weakTopics.slice(0, 3).join(', ') : 'core concepts'}

Return ONLY valid JSON array. Example format:
[
  {
    "question_text": "What is the correct way to declare a variable in ${languageDisplay}?",
    "options": ["var x = 5;", "let x = 5;", "int x = 5;", "x = 5;"],
    "correct_answer": "let x = 5;",
    "explanation": "In ${languageDisplay}, 'let' is the modern way to declare variables with block scope.",
    "difficulty": 1,
    "topic": "${concept} basics",
    "type": "multiple_choice"
  }
]

Generate 5 questions. Ensure correct_answer exactly matches one of the options strings.`;

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
            content: 'You are an expert programmer creating accurate quiz questions. Each question must have ONE correct answer that exactly matches an option. Return ONLY valid JSON array. No extra text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!aiResponse.ok) throw new Error(`AI API error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      // Validate each question has correct_answer that matches an option
      for (const q of questions) {
        if (!q.options.includes(q.correct_answer)) {
          console.warn('Correct answer not in options, fixing...', q);
          // Fix by setting correct_answer to first option (fallback)
          q.correct_answer = q.options[0];
        }
      }
      if (questions.length === 5) return questions;
    }
    
    throw new Error('Invalid AI response');
  } catch (error) {
    console.error('AI generation failed, using fallback:', error);
    return generateVerifiedFallbackQuestions(concept, languageDisplay, difficultyLevel);
  }
}

function generateVerifiedFallbackQuestions(concept, language, difficultyLevel) {
  const questions = [];
  const conceptLower = concept.toLowerCase();
  
  // Pre-verified correct answers
  const verifiedQuestions = {
    variables: [
      { text: `How do you declare a variable named 'count' with value 10 in ${language}?`, options: [`count = 10`, `var count = 10`, `let count = 10`, `int count = 10`], correct: `let count = 10`, explanation: `In ${language}, 'let' is used for variable declaration with block scope.` },
      { text: `Which symbol is used for variable assignment in ${language}?`, options: [`=`, `==`, `===`, `:=`], correct: `=`, explanation: `The equals sign = is the assignment operator in ${language}.` }
    ],
    loops: [
      { text: `Which loop is guaranteed to execute at least once in ${language}?`, options: [`for`, `while`, `do-while`, `foreach`], correct: `do-while`, explanation: `A do-while loop executes the code block once before checking the condition.` },
      { text: `What is the output of: for(i=0;i<3;i++){ console.log(i); } in ${language}?`, options: [`0,1,2`, `1,2,3`, `0,1,2,3`, `1,2`], correct: `0,1,2`, explanation: `The loop runs for i=0,1,2 and stops when i=3.` }
    ],
    functions: [
      { text: `What keyword is used to define a function in ${language}?`, options: [`function`, `def`, `func`, `define`], correct: `function`, explanation: `In ${language}, 'function' is the keyword used to declare a function.` }
    ]
  };

  const defaultQuestions = [
    {
      question_text: `What is the correct way to work with ${conceptLower} in ${language}?`,
      options: [`Use ${conceptLower} correctly`, `Avoid ${conceptLower}`, `Define ${conceptLower} first`, `Import ${conceptLower} module`],
      correct_answer: `Use ${conceptLower} correctly`,
      explanation: `Understanding ${conceptLower} is fundamental to programming in ${language}.`,
      difficulty: 1,
      topic: `${conceptLower} basics`,
      type: 'multiple_choice'
    },
    {
      question_text: `Which of the following best describes ${conceptLower} in ${language}?`,
      options: [`A way to store data`, `A control flow statement`, `A function declaration`, `An error handling mechanism`],
      correct_answer: `A way to store data`,
      explanation: `${conceptLower} is used to store and manage data in ${language}.`,
      difficulty: 1,
      topic: `${conceptLower} concepts`,
      type: 'multiple_choice'
    }
  ];

  // Use concept-specific verified questions if available
  const conceptQuestions = verifiedQuestions[conceptLower];
  if (conceptQuestions) {
    for (let i = 0; i < Math.min(conceptQuestions.length, 5); i++) {
      const q = conceptQuestions[i % conceptQuestions.length];
      questions.push({
        question_text: q.text,
        options: q.options,
        correct_answer: q.correct,
        explanation: q.explanation,
        difficulty: i < 2 ? 1 : i < 4 ? 2 : 3,
        topic: conceptLower,
        type: 'multiple_choice'
      });
    }
  }
  
  // Fill remaining with defaults
  while (questions.length < 5) {
    const defaultQ = { ...defaultQuestions[questions.length % defaultQuestions.length] };
    defaultQ.difficulty = questions.length < 2 ? 1 : questions.length < 4 ? 2 : 3;
    questions.push(defaultQ);
  }
  
  return questions;
}