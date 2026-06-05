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
    const analysisResult = await query(`
      SELECT concept, analysis_data, created_at
      FROM gap_analysis
      WHERE student_id = $1
      ORDER BY created_at DESC
    `, [studentId]);

    // Get recent responses for real-time calculation
    const responses = await query(`
      SELECT r.*, qs.concept, qs.language
      FROM responses r
      JOIN quiz_sessions qs ON r.session_id = qs.session_id
      WHERE r.student_id = $1
      ORDER BY r.timestamp DESC
    `, [studentId]);

    if (responses.rows.length === 0 && analysisResult.rows.length === 0) {
      return NextResponse.json({ 
        primary_gaps: [], 
        secondary_gaps: [],
        message: "Complete a quiz and click 'Save & Analyze' to see your knowledge gaps"
      });
    }

    // Calculate mastery from responses
    const conceptStats = {};
    for (const resp of responses.rows) {
      const concept = resp.concept || 'general';
      if (!conceptStats[concept]) {
        conceptStats[concept] = { total: 0, correct: 0, errors: [] };
      }
      conceptStats[concept].total++;
      if (resp.is_correct) conceptStats[concept].correct++;
      else if (resp.selected_answer) {
        conceptStats[concept].errors.push(resp.selected_answer);
      }
    }

    const primaryGaps = [];
    const secondaryGaps = [];

    for (const [concept, stats] of Object.entries(conceptStats)) {
      const mastery = (stats.correct / stats.total) * 100;
      const gap = {
        concept: concept,
        mastery: Math.round(mastery),
        total_attempts: stats.total,
        correct_count: stats.correct
      };

      if (mastery < 60) {
        primaryGaps.push({ ...gap, severity: 'high', gap_type: 'needs_review' });
      } else if (mastery < 80) {
        secondaryGaps.push({ ...gap, severity: 'medium' });
      }
    }

    // Extract analysis from stored data
    let overallMastery = 0;
    if (analysisResult.rows.length > 0) {
      const latestAnalysis = analysisResult.rows[0].analysis_data;
      overallMastery = latestAnalysis.mastery_level === 'advanced' ? 85 : 
                       latestAnalysis.mastery_level === 'intermediate' ? 65 : 45;
    } else if (primaryGaps.length > 0 || secondaryGaps.length > 0) {
      const totalCorrect = Object.values(conceptStats).reduce((sum, s) => sum + s.correct, 0);
      const totalQuestions = Object.values(conceptStats).reduce((sum, s) => sum + s.total, 0);
      overallMastery = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    }

    return NextResponse.json({
      primary_gaps: primaryGaps,
      secondary_gaps: secondaryGaps,
      overall_mastery: overallMastery,
      source: 'quiz-data'
    });
  } catch (error) {
    console.error('Gaps API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}