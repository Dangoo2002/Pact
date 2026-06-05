import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, studentId, concept, language, questions, answers, score, totalQuestions } = await request.json();

    // Save each answer to database
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const question = questions.find(q => q.id === answer.questionId);
      
      await query(`
        INSERT INTO responses (student_id, session_id, question_text, is_correct, selected_answer, concept, language, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [studentId, sessionId, answer.question, answer.isCorrect, answer.answer, concept, language]);
    }

    // Update quiz session
    await query(`
      UPDATE quiz_sessions 
      SET status = 'completed', completed_at = NOW(), score = $1
      WHERE session_id = $2
    `, [score, sessionId]);

    // Generate AI analysis and recommendations
    const analysis = await generateAIAnalysisAndRecommendations(studentId, concept, language, questions, answers, score, totalQuestions);

    // Store analysis results
    await query(`
      INSERT INTO gap_analysis (student_id, concept, analysis_data, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (student_id, concept) 
      DO UPDATE SET analysis_data = EXCLUDED.analysis_data, created_at = NOW()
    `, [studentId, concept, JSON.stringify(analysis)]);

    return NextResponse.json({
      success: true,
      analysis: analysis,
      message: "Quiz saved and analysis complete"
    });
  } catch (error) {
    console.error('Save and analyze error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateAIAnalysisAndRecommendations(studentId, concept, language, questions, answers, score, totalQuestions) {
  const accuracy = (score / totalQuestions) * 100;
  const incorrectAnswers = answers.filter(a => !a.isCorrect);
  
  const prompt = `You are an expert programming educator. Analyze this student's quiz performance and provide detailed insights.

CONCEPT: ${concept}
LANGUAGE: ${language}
SCORE: ${score}/${totalQuestions} (${accuracy}%)
QUESTIONS AND ANSWERS:
${JSON.stringify(answers.map(a => ({
  question: a.question,
  student_answer: a.answer,
  correct_answer: a.correct_answer,
  was_correct: a.isCorrect
})), null, 2)}

Based on the above, provide a comprehensive analysis in the following JSON format (ONLY JSON, no other text):

{
  "performance_summary": {
    "accuracy": ${accuracy},
    "strengths": ["list of what they did well"],
    "weaknesses": ["list of specific gaps"],
    "mastery_level": ${accuracy >= 80 ? "advanced" : accuracy >= 60 ? "intermediate" : "beginner"}
  },
  "knowledge_gaps": [
    {
      "concept": "specific sub-concept they struggled with",
      "severity": "high/medium/low",
      "description": "detailed explanation of the gap",
      "specific_errors": ["error pattern 1", "error pattern 2"]
    }
  ],
  "recommendations": [
    {
      "title": "resource title",
      "type": "video/article/exercise/course",
      "url": "real valid URL (YouTube, freeCodeCamp, MDN, W3Schools, Coursera, etc.)",
      "description": "why this resource helps",
      "priority": "high/medium/low",
      "estimated_duration_minutes": number
    }
  ],
  "next_steps": ["step 1", "step 2", "step 3"],
  "study_plan": "personalized study plan paragraph"
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
            content: 'You are an expert programming educator and learning analyst. Return ONLY valid JSON. Use real, working URLs from legitimate learning platforms.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      // Enhance recommendations with real URLs if missing
      for (const rec of analysis.recommendations || []) {
        if (!rec.url || rec.url === '#') {
          rec.url = getResourceUrl(concept, rec.title, rec.type);
        }
      }
      return analysis;
    }
  } catch (error) {
    console.error('AI analysis failed:', error);
  }

  // Fallback analysis based on actual data
  return generateFallbackAnalysis(concept, language, answers, score, totalQuestions);
}

function getResourceUrl(concept, title, type) {
  const encodedConcept = encodeURIComponent(concept.toLowerCase());
  if (type === 'video') {
    return `https://www.youtube.com/results?search_query=${encodedConcept}+programming+tutorial`;
  } else if (type === 'article') {
    return `https://developer.mozilla.org/en-US/search?q=${encodedConcept}`;
  } else if (type === 'exercise') {
    return `https://www.w3schools.com/python/python_${concept.toLowerCase()}.asp`;
  }
  return `https://www.google.com/search?q=learn+${encodedConcept}+programming`;
}

function generateFallbackAnalysis(concept, language, answers, score, totalQuestions) {
  const accuracy = (score / totalQuestions) * 100;
  const incorrectConcepts = answers.filter(a => !a.isCorrect).map(a => a.question?.split(' ').slice(0, 3).join(' ') || concept);
  
  return {
    performance_summary: {
      accuracy: accuracy,
      strengths: score >= 3 ? ["Showed good understanding of basic concepts"] : ["Attempted all questions"],
      weaknesses: [`Struggled with ${incorrectConcepts.slice(0, 3).join(', ')}`],
      mastery_level: accuracy >= 80 ? "advanced" : accuracy >= 60 ? "intermediate" : "beginner"
    },
    knowledge_gaps: [{
      concept: concept,
      severity: accuracy < 70 ? "high" : "medium",
      description: `Need to review ${concept} fundamentals. Accuracy was ${accuracy}%.`,
      specific_errors: answers.filter(a => !a.isCorrect).map(a => a.answer?.substring(0, 100) || "Incorrect answer")
    }],
    recommendations: [
      {
        title: `${concept} Tutorial for Beginners`,
        type: "tutorial",
        url: `https://www.w3schools.com/python/python_${concept.toLowerCase()}.asp`,
        description: `Learn the fundamentals of ${concept} with examples.`,
        priority: "high",
        estimated_duration_minutes: 30
      },
      {
        title: `${concept} Practice Problems`,
        type: "exercise",
        url: `/student/quizzes?concept=${concept}`,
        description: `Practice more ${concept} questions.`,
        priority: "high",
        estimated_duration_minutes: 45
      },
      {
        title: `Master ${concept} in ${language}`,
        type: "video",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(concept)}+${language}+tutorial`,
        description: `Watch video tutorials on ${concept}.`,
        priority: "medium",
        estimated_duration_minutes: 20
      }
    ],
    next_steps: [
      "Review the incorrect answers and understand the correct solutions",
      "Practice more questions on the same topic",
      "Watch recommended video tutorials"
    ],
    study_plan: `Focus on understanding ${concept} fundamentals. Start with the recommended tutorial, then practice with exercises.`
  };
}