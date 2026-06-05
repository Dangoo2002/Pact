import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Get all student responses
    const responses = await query(`
      SELECT r.*, qs.concept, qs.language, qs.completed_at
      FROM responses r
      JOIN quiz_sessions qs ON r.session_id = qs.session_id
      WHERE r.student_id = $1
      ORDER BY r.timestamp DESC
    `, [studentId]);

    if (responses.rows.length === 0) {
      return NextResponse.json({ 
        gaps: [],
        message: "Complete quizzes to get AI-powered gap analysis"
      });
    }

    // Group by concept
    const conceptMap = new Map();
    for (const resp of responses.rows) {
      const concept = resp.concept || 'general';
      if (!conceptMap.has(concept)) {
        conceptMap.set(concept, { correct: 0, total: 0, responses: [] });
      }
      const stats = conceptMap.get(concept);
      stats.total++;
      if (resp.is_correct) stats.correct++;
      stats.responses.push({
        question: resp.question_text,
        was_correct: resp.is_correct,
        answer: resp.selected_answer
      });
    }

    const conceptData = Array.from(conceptMap.entries()).map(([concept, stats]) => ({
      concept,
      accuracy: (stats.correct / stats.total) * 100,
      totalAttempts: stats.total,
      responses: stats.responses.slice(0, 10)
    }));

    // Generate AI gap analysis
    const gapAnalysis = await generateAIGapAnalysis(studentId, conceptData);

    return NextResponse.json(gapAnalysis);
  } catch (error) {
    console.error('Gaps API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateAIGapAnalysis(studentId, conceptData) {
  const prompt = `Analyze this student's programming knowledge gaps based on their quiz performance.

STUDENT: ${studentId}
CONCEPT PERFORMANCE DATA:
${JSON.stringify(conceptData, null, 2)}

Return ONLY valid JSON with this structure:
{
  "primary_gaps": [
    {
      "concept": "concept name",
      "accuracy": 45,
      "severity": "high",
      "specific_issues": ["issue 1", "issue 2"],
      "root_cause_analysis": "detailed analysis of why they struggle"
    }
  ],
  "secondary_gaps": [
    {
      "concept": "concept name", 
      "accuracy": 70,
      "improvement_potential": "high/medium/low"
    }
  ],
  "learning_patterns": {
    "common_errors": ["error pattern 1", "error pattern 2"],
    "concept_dependencies": ["prerequisite 1", "prerequisite 2"],
    "recommended_learning_path": ["step 1", "step 2", "step 3"]
  },
  "overall_assessment": "paragraph summarizing their current standing"
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
            content: 'You are an expert educational analyst. Return ONLY valid JSON. No markdown, no extra text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('AI gap analysis failed:', error);
  }

  throw new Error('AI gap analysis generation failed');
}