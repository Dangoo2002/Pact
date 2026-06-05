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

    // Get stored gap analysis
    const storedAnalysis = await query(`
      SELECT concept, analysis_data, created_at
      FROM gap_analysis
      WHERE student_id = $1
      ORDER BY created_at DESC
    `, [studentId]);

    // Get recent responses for real-time analysis
    const responses = await query(`
      SELECT r.*, qs.concept, qs.language
      FROM responses r
      JOIN quiz_sessions qs ON r.session_id = qs.session_id
      WHERE r.student_id = $1
      ORDER BY r.timestamp DESC
    `, [studentId]);

    if (responses.rows.length === 0) {
      return NextResponse.json({ 
        primary_gaps: [], 
        secondary_gaps: [],
        overall_mastery: 0,
        message: "Complete quizzes to get AI-powered gap analysis"
      });
    }

    // Calculate concept mastery from responses
    const conceptStats = {};
    for (const resp of responses.rows) {
      const concept = resp.concept || 'general';
      if (!conceptStats[concept]) {
        conceptStats[concept] = { total: 0, correct: 0, language: resp.language, errors: [] };
      }
      conceptStats[concept].total++;
      if (resp.is_correct) conceptStats[concept].correct++;
      else if (resp.selected_answer) conceptStats[concept].errors.push(resp.selected_answer);
    }

    const conceptMastery = Object.entries(conceptStats).map(([concept, stats]) => ({
      concept,
      language: stats.language,
      mastery: (stats.correct / stats.total) * 100,
      total_attempts: stats.total,
      correct_count: stats.correct,
      sample_errors: stats.errors.slice(0, 3)
    }));

    // Generate AI gap analysis
    const gapAnalysis = await generateAIGapAnalysis(studentId, conceptMastery, responses.rows, storedAnalysis.rows);

    return NextResponse.json(gapAnalysis);
  } catch (error) {
    console.error('Gaps API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateAIGapAnalysis(studentId, conceptMastery, responses, storedAnalysis) {
  const lowMastery = conceptMastery.filter(c => c.mastery < 60);
  const mediumMastery = conceptMastery.filter(c => c.mastery >= 60 && c.mastery < 80);
  const overallMastery = conceptMastery.length > 0 
    ? Math.round(conceptMastery.reduce((sum, c) => sum + c.mastery, 0) / conceptMastery.length)
    : 0;

  const prompt = `Analyze this student's programming knowledge gaps and provide detailed insights.

CONCEPT MASTERY:
${JSON.stringify(conceptMastery, null, 2)}

OVERALL MASTERY: ${overallMastery}%

RECENT INCORRECT RESPONSES:
${JSON.stringify(responses.filter(r => !r.is_correct).slice(0, 10), null, 2)}

Return ONLY valid JSON with this structure:
{
  "primary_gaps": [
    {
      "concept": "concept name",
      "language": "python",
      "mastery": 45,
      "severity": "high",
      "gap_type": "misconception|prerequisite|procedural|factual",
      "specific_errors": ["error description"],
      "detailed_analysis": "explanation of why they're struggling"
    }
  ],
  "secondary_gaps": [
    {
      "concept": "concept name",
      "language": "python",
      "mastery": 70,
      "severity": "medium",
      "improvement_strategy": "what to focus on"
    }
  ],
  "overall_mastery": ${overallMastery},
  "learning_insights": {
    "strengths": ["what they understand well"],
    "weaknesses": ["what needs work"],
    "recommended_focus": ["priority areas"],
    "estimated_improvement_time": "hours"
  }
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
            content: 'You are an expert educational analyst. Return ONLY valid JSON with detailed gap analysis.'
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

  // Fallback based on actual data
  return {
    primary_gaps: lowMastery.map(c => ({
      concept: c.concept,
      language: c.language,
      mastery: Math.round(c.mastery),
      severity: "high",
      gap_type: "needs_review",
      specific_errors: c.sample_errors,
      detailed_analysis: `Mastery is only ${Math.round(c.mastery)}%. Focus on ${c.concept} fundamentals.`
    })),
    secondary_gaps: mediumMastery.map(c => ({
      concept: c.concept,
      language: c.language,
      mastery: Math.round(c.mastery),
      severity: "medium",
      improvement_strategy: `Practice more ${c.concept} exercises`
    })),
    overall_mastery: overallMastery,
    learning_insights: {
      strengths: conceptMastery.filter(c => c.mastery >= 80).map(c => c.concept),
      weaknesses: lowMastery.map(c => c.concept),
      recommended_focus: lowMastery.slice(0, 3).map(c => c.concept),
      estimated_improvement_time: `${lowMastery.length * 2} hours`
    }
  };
}