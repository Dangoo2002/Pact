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

    console.log('Starting quiz for:', { studentId, concept, language });

    // Generate questions based on concept
    const questions = getQuestionsForConcept(concept, language);

    // Create session
    const sessionId = `session_${Date.now()}_${studentId}`;
    const studentIdStr = String(studentId);
    
    await query(`
      INSERT INTO quiz_sessions (session_id, student_id, concept, language, total_questions, started_at, status, current_question_index, score)
      VALUES ($1, $2, $3, $4, $5, NOW(), 'active', $6, $7)
    `, [sessionId, studentIdStr, concept, language, questions.length, 0, 0]);

    // Format questions for frontend
    const formattedQuestions = questions.map((q, idx) => ({
      id: idx,
      text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      type: 'multiple_choice',
      concept: concept,
      language: language,
      difficulty: q.difficulty
    }));

    return NextResponse.json({
      session_id: sessionId,
      current_question: formattedQuestions[0],
      total_questions: formattedQuestions.length,
      all_questions: formattedQuestions,
      time_limit: 600
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    return NextResponse.json({ 
      error: 'Failed to start quiz: ' + error.message 
    }, { status: 500 });
  }
}

function getQuestionsForConcept(concept, language) {
  // Common questions for all concepts
  const questionBank = {
    variables: [
      {
        question_text: `What is a variable in ${language} programming?`,
        options: ["A container for storing data", "A type of function", "A loop structure", "An error handler"],
        correct_answer: "A container for storing data",
        explanation: "Variables store data in memory that can be referenced and manipulated.",
        difficulty: 1
      },
      {
        question_text: `Which of these is a valid variable name in ${language}?`,
        options: ["2var", "_myVar", "my-var", "my var"],
        correct_answer: "_myVar",
        explanation: "Variable names can start with underscore or letter, not numbers, and cannot contain spaces or hyphens.",
        difficulty: 1
      },
      {
        question_text: `What does the = operator do in ${language}?`,
        options: ["Comparison", "Assignment", "Equality check", "Declaration"],
        correct_answer: "Assignment",
        explanation: "= assigns the value on the right to the variable on the left.",
        difficulty: 1
      },
      {
        question_text: `How do you declare a variable in ${language}?`,
        options: ["var x = 5", "x = 5", "int x = 5", "let x = 5"],
        correct_answer: "x = 5",
        explanation: "In Python, you simply assign a value to create a variable.",
        difficulty: 1
      },
      {
        question_text: `What is variable scope?`,
        options: ["Where a variable can be accessed", "The value of a variable", "The type of a variable", "The name of a variable"],
        correct_answer: "Where a variable can be accessed",
        explanation: "Scope determines the visibility and lifetime of a variable.",
        difficulty: 2
      }
    ],
    data_types: [
      {
        question_text: `Which of these is a primitive data type in ${language}?`,
        options: ["Integer", "Array", "Object", "List"],
        correct_answer: "Integer",
        explanation: "Integer is a primitive data type that stores whole numbers.",
        difficulty: 1
      },
      {
        question_text: `What data type would you use for whole numbers?`,
        options: ["float", "string", "int", "boolean"],
        correct_answer: "int",
        explanation: "int stores integer values without decimal points.",
        difficulty: 1
      },
      {
        question_text: `What data type would you use for decimal numbers?`,
        options: ["int", "float", "string", "char"],
        correct_answer: "float",
        explanation: "float stores numbers with decimal points.",
        difficulty: 1
      },
      {
        question_text: `What data type stores true/false values?`,
        options: ["int", "float", "string", "boolean"],
        correct_answer: "boolean",
        explanation: "boolean stores True or False values.",
        difficulty: 1
      },
      {
        question_text: `What function do you use to check a variable's type in ${language}?`,
        options: ["checkType()", "typeof()", "type()", "getType()"],
        correct_answer: "type()",
        explanation: "type() returns the data type of a variable.",
        difficulty: 2
      }
    ],
    loops: [
      {
        question_text: `How many times does 'for i in range(5):' run?`,
        options: ["4", "5", "6", "Infinite"],
        correct_answer: "5",
        explanation: "range(5) generates 0,1,2,3,4 - 5 iterations.",
        difficulty: 1
      },
      {
        question_text: `What is the purpose of a loop?`,
        options: ["To execute code repeatedly", "To define functions", "To store data", "To handle errors"],
        correct_answer: "To execute code repeatedly",
        explanation: "Loops allow you to run the same code multiple times.",
        difficulty: 1
      },
      {
        question_text: `Which loop is guaranteed to run at least once?`,
        options: ["for loop", "while loop", "do-while loop", "foreach loop"],
        correct_answer: "do-while loop",
        explanation: "do-while checks condition after executing the code block.",
        difficulty: 2
      },
      {
        question_text: `What is an infinite loop?`,
        options: ["A loop that never ends", "A loop with no code", "A very fast loop", "A loop with 1 iteration"],
        correct_answer: "A loop that never ends",
        explanation: "Infinite loops occur when the termination condition is never met.",
        difficulty: 2
      },
      {
        question_text: `What keyword is used to exit a loop early?`,
        options: ["exit", "stop", "break", "return"],
        correct_answer: "break",
        explanation: "break immediately terminates the loop.",
        difficulty: 2
      }
    ],
    conditionals: [
      {
        question_text: `What does an if statement do?`,
        options: ["Executes code conditionally", "Creates a loop", "Declares a variable", "Imports a module"],
        correct_answer: "Executes code conditionally",
        explanation: "if statements run code only when a condition is true.",
        difficulty: 1
      },
      {
        question_text: `What does 'elif' stand for?`,
        options: ["Else if", "Else in if", "Element if", "Escape if"],
        correct_answer: "Else if",
        explanation: "elif is short for 'else if' in Python.",
        difficulty: 1
      },
      {
        question_text: `What is the correct syntax for an if statement in ${language}?`,
        options: ["if x == 5: then", "if x == 5 {", "if x == 5:", "if (x == 5) then"],
        correct_answer: "if x == 5:",
        explanation: "Python uses colon and indentation for if statements.",
        difficulty: 1
      },
      {
        question_text: `What does 'else' do?`,
        options: ["Runs when if is false", "Runs when if is true", "Always runs", "Creates a loop"],
        correct_answer: "Runs when if is false",
        explanation: "else executes when the if condition is false.",
        difficulty: 1
      }
    ],
    functions: [
      {
        question_text: `What keyword defines a function in ${language}?`,
        options: ["function", "def", "func", "define"],
        correct_answer: "def",
        explanation: "Python uses 'def' to define functions.",
        difficulty: 1
      },
      {
        question_text: `What returns a value from a function?`,
        options: ["break", "continue", "return", "exit"],
        correct_answer: "return",
        explanation: "return sends a value back to the caller.",
        difficulty: 1
      },
      {
        question_text: `What is a parameter?`,
        options: ["Input to a function", "Output of a function", "Return value", "Function name"],
        correct_answer: "Input to a function",
        explanation: "Parameters are variables passed into a function.",
        difficulty: 1
      },
      {
        question_text: `What is function overloading?`,
        options: ["Multiple functions with same name", "One function with many parameters", "A recursive function", "An anonymous function"],
        correct_answer: "Multiple functions with same name",
        explanation: "Overloading allows multiple functions with the same name but different parameters.",
        difficulty: 3
      }
    ],
    arrays: [
      {
        question_text: `What index does an array start at?`,
        options: ["-1", "0", "1", "Any"],
        correct_answer: "0",
        explanation: "Arrays are 0-indexed in most programming languages.",
        difficulty: 1
      },
      {
        question_text: `How do you access the first element of an array 'arr'?`,
        options: ["arr[0]", "arr[1]", "arr.first()", "arr[begin]"],
        correct_answer: "arr[0]",
        explanation: "Index 0 accesses the first element.",
        difficulty: 1
      }
    ]
  };

  // Return questions for the concept, or default questions if concept not found
  if (questionBank[concept]) {
    return questionBank[concept];
  }
  
  // Default questions for any concept
  return [
    {
      question_text: `What is ${concept} in ${language} programming?`,
      options: [`Definition of ${concept}`, `How to use ${concept}`, `${concept} examples`, `All of the above`],
      correct_answer: `All of the above`,
      explanation: `${concept} is an important programming concept.`,
      difficulty: 1
    },
    {
      question_text: `Why is ${concept} important?`,
      options: ["It helps organize code", "It improves performance", "It enables reusability", "All of the above"],
      correct_answer: "All of the above",
      explanation: `${concept} provides multiple benefits in programming.`,
      difficulty: 2
    },
    {
      question_text: `When should you use ${concept}?`,
      options: ["Always", "Never", "When appropriate", "Only for beginners"],
      correct_answer: "When appropriate",
      explanation: `Use ${concept} when the situation calls for it.`,
      difficulty: 2
    },
    {
      question_text: `What is a common mistake with ${concept}?`,
      options: ["Wrong syntax", "Wrong usage", "Overuse", "All of the above"],
      correct_answer: "All of the above",
      explanation: `There are several common pitfalls with ${concept}.`,
      difficulty: 2
    },
    {
      question_text: `Which best describes ${concept}?`,
      options: [`Core ${language} feature`, `Advanced technique`, `Basic concept`, `Design pattern`],
      correct_answer: `Core ${language} feature`,
      explanation: `${concept} is fundamental to ${language} programming.`,
      difficulty: 1
    }
  ];
}