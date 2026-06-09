// app/api/student/quiz/start/route.js
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

    if (!studentId || !concept || !language) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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

    // Extract weak topics
    const weakTopics = previousResponses.rows
      .filter(r => !r.is_correct)
      .map(r => r.question_text?.substring(0, 60) || concept)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 5);

    // Generate questions - 4 multiple choice + 1 coding
    const questions = await generateQuizQuestions(concept, language, adaptiveDifficulty, weakTopics);

    const sessionId = `session_${Date.now()}_${studentId}`;
    const studentIdStr = String(studentId);
    
    // REMOVED 'adaptive_level' column since it doesn't exist
    await query(`
      INSERT INTO quiz_sessions (
        session_id, student_id, concept, language, total_questions, 
        started_at, status, current_question_index, score, 
        difficulty_level, weak_focus
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), 'active', $6, $7, $8, $9)
    `, [sessionId, studentIdStr, concept, language, questions.length, 0, 0, adaptiveDifficulty, JSON.stringify(weakTopics)]);

    const formattedQuestions = questions.map((q, idx) => ({
      id: idx,
      text: q.question_text,
      options: q.options || null,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      type: q.type,
      concept: concept,
      language: language,
      difficulty: q.difficulty,
      topic: q.topic,
      starter_code: q.starter_code || null,
      test_cases: q.test_cases || null,
      hints: q.hints || []
    }));

    return NextResponse.json({
      session_id: sessionId,
      current_question: formattedQuestions[0],
      total_questions: formattedQuestions.length,
      all_questions: formattedQuestions,
      time_limit: 90,
      adaptive_level: adaptiveDifficulty,
      weak_focus: weakTopics,
      accuracy: Math.round(accuracy),
      message: `Quiz generated for ${language}`
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    return NextResponse.json({ error: 'Failed to start quiz: ' + error.message }, { status: 500 });
  }
}

async function generateQuizQuestions(concept, language, difficultyLevel, weakTopics) {
  const languageDisplay = language === 'cpp' ? 'C++' : language === 'js' ? 'JavaScript' : language.charAt(0).toUpperCase() + language.slice(1);
  
  const prompt = `Generate a quiz about "${concept}" in ${languageDisplay} programming.

Generate exactly 5 questions:
- Questions 1-4: Multiple choice questions
- Question 5: Coding question

For multiple choice questions, provide:
- question_text: The question
- options: Array of 4 strings
- correct_answer: Exact string matching one option
- explanation: Brief explanation
- difficulty: 1 (easy), 2 (medium), or 3 (hard)

For the coding question, provide:
- question_text: Problem description
- starter_code: Template code
- correct_answer: Expected solution
- explanation: Solution approach
- test_cases: Array of {input, expected}
- hints: Array of hint strings
- difficulty: 2 (medium) or 3 (hard)

Difficulty distribution: ${difficultyLevel === 1 ? '3 easy, 1 medium for multiple choice, 1 easy coding' : difficultyLevel === 2 ? '2 easy, 2 medium for multiple choice, 1 medium coding' : '1 easy, 2 medium, 1 hard for multiple choice, 1 hard coding'}

Focus areas: ${weakTopics.length > 0 ? weakTopics.slice(0, 3).join(', ') : 'core ' + concept + ' concepts'}

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question_text": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Why this is correct",
      "difficulty": 1,
      "topic": "topic name"
    },
    {
      "type": "coding",
      "question_text": "Problem description",
      "starter_code": "def solution():\n    pass",
      "correct_answer": "def solution():\n    return result",
      "explanation": "Solution approach",
      "test_cases": [{"input": "test", "expected": "expected"}],
      "hints": ["Hint 1", "Hint 2"],
      "difficulty": 2,
      "topic": "topic name"
    }
  ]
}`;

  try {
    console.log(`Generating quiz for ${concept} (difficulty: ${difficultyLevel})`);
    
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
            content: 'You are an expert quiz generator. Generate exactly 5 questions: 4 multiple choice + 1 coding. Each multiple choice question must have exactly 4 options with one correct answer. Return ONLY valid JSON. No extra text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 4000
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content;
    
    if (!content) throw new Error('Empty AI response');
    
    // Extract JSON
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    
    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      const cleaned = jsonMatch[0].replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }
    
    let questions = parsed.questions || [];
    
    if (!Array.isArray(questions) || questions.length !== 5) {
      console.log(`Expected 5 questions, got ${questions.length}. Using fallback.`);
      return getFallbackQuestions(concept, languageDisplay, difficultyLevel);
    }
    
    // Validate and fix each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (i < 4) {
        // Multiple choice questions
        q.type = 'multiple_choice';
        if (!q.options || q.options.length !== 4) {
          q.options = [`Option A`, `Option B`, `Option C`, `Option D`];
        }
        if (!q.correct_answer || !q.options.includes(q.correct_answer)) {
          q.correct_answer = q.options[0];
        }
        if (!q.explanation) q.explanation = `The correct answer is ${q.correct_answer}.`;
        if (!q.difficulty) q.difficulty = i < 2 ? 1 : i < 3 ? 2 : 3;
      } else {
        // Coding question
        q.type = 'coding';
        if (!q.starter_code) {
          q.starter_code = language === 'python' 
            ? `def solution():\n    # Write your code here\n    pass`
            : `function solution() {\n    // Write your code here\n}`;
        }
        if (!q.test_cases) q.test_cases = [{ input: "sample", expected: "expected output" }];
        if (!q.hints) q.hints = ["Think step by step", "Test your solution"];
        if (!q.difficulty) q.difficulty = 2;
      }
      
      q.topic = q.topic || concept;
    }
    
    console.log(`Successfully generated ${questions.length} questions`);
    return questions;
    
  } catch (error) {
    console.error('AI generation failed:', error);
    return getFallbackQuestions(concept, languageDisplay, difficultyLevel);
  }
}

function getFallbackQuestions(concept, language, difficultyLevel) {
  const conceptLower = concept.toLowerCase();
  
  return [
    {
      type: "multiple_choice",
      question_text: `What is the correct way to declare a variable in ${language}?`,
      options: [`let x = 5;`, `var x = 5;`, `const x = 5;`, `x = 5;`],
      correct_answer: `let x = 5;`,
      explanation: `In ${language}, 'let' is the preferred way to declare variables with block scope.`,
      difficulty: 1,
      topic: `${conceptLower} variables`
    },
    {
      type: "multiple_choice",
      question_text: `Which operator is used for strict equality in ${language}?`,
      options: [`==`, `=`, `===`, `!=`],
      correct_answer: `===`,
      explanation: `The === operator checks both value and type for equality.`,
      difficulty: 1,
      topic: `${conceptLower} operators`
    },
    {
      type: "multiple_choice",
      question_text: `What is the output of: console.log(typeof []) in JavaScript?`,
      options: [`"array"`, `"object"`, `"Array"`, `"undefined"`],
      correct_answer: `"object"`,
      explanation: `In JavaScript, arrays are a type of object.`,
      difficulty: 2,
      topic: `${conceptLower} data types`
    },
    {
      type: "multiple_choice",
      question_text: `Which loop executes at least once in ${language}?`,
      options: [`for`, `while`, `do-while`, `forEach`],
      correct_answer: `do-while`,
      explanation: `A do-while loop executes the code block once before checking the condition.`,
      difficulty: 2,
      topic: `${conceptLower} loops`
    },
    {
      type: "coding",
      question_text: `Write a function that takes an array of numbers and returns the sum of all even numbers.`,
      starter_code: language === 'python' 
        ? `def sum_even_numbers(numbers):\n    # Your code here\n    pass`
        : `function sumEvenNumbers(numbers) {\n    // Your code here\n}`,
      correct_answer: `function sumEvenNumbers(numbers) {\n    return numbers.filter(n => n % 2 === 0).reduce((a, b) => a + b, 0);\n}`,
      explanation: `Filter the array to keep even numbers, then sum them using reduce.`,
      test_cases: [
        { input: "[1, 2, 3, 4]", expected: "6" },
        { input: "[2, 4, 6, 8]", expected: "20" }
      ],
      hints: ["Use the modulo operator % to check if a number is even", "Filter the array first, then sum"],
      difficulty: 2,
      topic: `${conceptLower} arrays`
    }
  ];
}