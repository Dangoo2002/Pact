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

    // Get all quiz responses for this student
    const responses = await query(`
      SELECT r.*, qs.concept, qs.language, qs.completed_at
      FROM responses r
      JOIN quiz_sessions qs ON r.session_id = qs.session_id
      WHERE r.student_id = $1 AND qs.status = 'completed'
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

    // Group responses by concept
    const conceptStats = {};
    for (const resp of responses.rows) {
      const concept = resp.concept || 'general';
      if (!conceptStats[concept]) {
        conceptStats[concept] = { total: 0, correct: 0, language: resp.language };
      }
      conceptStats[concept].total++;
      if (resp.is_correct) conceptStats[concept].correct++;
    }

    // Calculate mastery per concept
    const conceptMastery = Object.entries(conceptStats).map(([concept, stats]) => ({
      concept,
      language: stats.language,
      mastery: (stats.correct / stats.total) * 100,
      total_attempts: stats.total,
      correct_count: stats.correct
    }));

    // Use AI to analyze gaps
    const gaps = await analyzeGapsWithAI(studentId, conceptMastery, responses.rows);

    return NextResponse.json(gaps);
  } catch (error) {
    console.error('Gaps API error:', error);
    return NextResponse.json({ 
      primary_gaps: [], 
      secondary_gaps: [],
      error: error.message 
    }, { status: 500 });
  }
}

async function analyzeGapsWithAI(studentId, conceptMastery, responses) {
  try {
    const lowMasteryConcepts = conceptMastery.filter(c => c.mastery < 70);
    const mediumMasteryConcepts = conceptMastery.filter(c => c.mastery >= 70 && c.mastery < 85);
    
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
            content: `You are an expert educational analyst. Analyze the student's performance data and identify knowledge gaps.
            Return ONLY valid JSON with NO markdown, NO explanations outside JSON.
            Format:
            {
              "primary_gaps": [{"concept": "concept_name", "language": "python", "mastery": 45, "severity": "high", "gap_type": "misconception", "specific_errors": ["error1"]}],
              "secondary_gaps": [{"concept": "concept_name", "language": "python", "mastery": 75, "severity": "medium"}],
              "overall_mastery": 65,
              "detailed_analysis": "summary text"
            }`
          },
          {
            role: 'user',
            content: `Student ID: ${studentId}
            
Concept Mastery Data:
${JSON.stringify(conceptMastery, null, 2)}

Recent Responses:
${JSON.stringify(responses.slice(0, 20), null, 2)}

Identify:
1. PRIMARY GAPS: Concepts with mastery < 60% - these need immediate attention
2. SECONDARY GAPS: Concepts with mastery 60-75% - improvement areas
3. Specific error patterns the student shows
4. Detailed analysis of what they're struggling with`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });
    
    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return {
        primary_gaps: analysis.primary_gaps || [],
        secondary_gaps: analysis.secondary_gaps || [],
        overall_mastery: analysis.overall_mastery || 0,
        detailed_analysis: analysis.detailed_analysis || "Analysis complete."
      };
    }
  } catch (error) {
    console.error('AI gap analysis failed:', error);
  }
  
  // Fallback based on actual data (not hardcoded)
  const primaryGaps = conceptMastery.filter(c => c.mastery < 60).map(c => ({
    concept: c.concept,
    language: c.language,
    mastery: Math.round(c.mastery),
    severity: "high",
    gap_type: "needs_review",
    specific_errors: ["Multiple incorrect answers"]
  }));
  
  const secondaryGaps = conceptMastery.filter(c => c.mastery >= 60 && c.mastery < 80).map(c => ({
    concept: c.concept,
    language: c.language,
    mastery: Math.round(c.mastery),
    severity: "medium"
  }));
  
  return {
    primary_gaps: primaryGaps,
    secondary_gaps: secondaryGaps,
    overall_mastery: conceptMastery.length > 0 
      ? Math.round(conceptMastery.reduce((sum, c) => sum + c.mastery, 0) / conceptMastery.length)
      : 0
  };
}