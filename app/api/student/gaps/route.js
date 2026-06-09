// app/api/student/gaps/route.js - Updated to aggregate and show highest mastery per concept
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

    // Get all gap analysis records for this student
    const analysisResult = await query(`
      SELECT id, student_id, concept, session_id, analysis_data, created_at
      FROM gap_analysis
      WHERE student_id = $1
      ORDER BY created_at DESC
    `, [studentId]);

    console.log('Found gap analysis records:', analysisResult.rows.length);

    if (analysisResult.rows.length === 0) {
      return NextResponse.json({ 
        primary_gaps: [], 
        secondary_gaps: [],
        understood_concepts: [],
        overall_mastery: 0,
        message: "Complete a quiz and click 'Save & Analyze' to see your knowledge gaps"
      });
    }

    // Track best mastery per concept
    const conceptBestMastery = new Map();
    
    for (const row of analysisResult.rows) {
      const analysis = row.analysis_data;
      const concept = row.concept;
      
      if (analysis && concept) {
        // Calculate mastery from accuracy or overall_mastery
        let mastery = analysis.accuracy_percentage || 
                      analysis.overall_mastery ||
                      (analysis.mastery_level === 'advanced' ? 85 : 
                       analysis.mastery_level === 'intermediate' ? 65 : 45);
        
        // Keep the highest mastery for each concept
        if (!conceptBestMastery.has(concept) || mastery > conceptBestMastery.get(concept).mastery) {
          conceptBestMastery.set(concept, {
            concept: concept,
            language: analysis.language || 'python',
            mastery: mastery,
            severity: mastery < 60 ? 'high' : mastery < 80 ? 'medium' : 'low',
            gap_type: mastery >= 80 ? 'mastered' : mastery >= 60 ? 'developing' : 'knowledge_gap',
            specific_errors: analysis.weaknesses || [],
            detailed_analysis: analysis.weaknesses?.[0] || '',
            session_id: row.session_id,
            analyzed_at: row.created_at
          });
        }
      }
    }

    // Separate concepts by mastery level
    const primaryGaps = [];      // < 60% - needs improvement
    const secondaryGaps = [];    // 60-79% - developing
    const understoodConcepts = []; // >= 80% - mastered

    for (const [concept, gap] of conceptBestMastery.entries()) {
      if (gap.mastery >= 80) {
        understoodConcepts.push(gap);
      } else if (gap.mastery >= 60) {
        secondaryGaps.push(gap);
      } else {
        primaryGaps.push(gap);
      }
    }

    // Sort by mastery (highest first for understood, lowest first for gaps)
    understoodConcepts.sort((a, b) => b.mastery - a.mastery);
    primaryGaps.sort((a, b) => a.mastery - b.mastery);
    secondaryGaps.sort((a, b) => a.mastery - b.mastery);

    // Calculate overall mastery (average of highest mastery per concept)
    let totalMastery = 0;
    for (const gap of conceptBestMastery.values()) {
      totalMastery += gap.mastery;
    }
    const overallMastery = conceptBestMastery.size > 0 ? Math.round(totalMastery / conceptBestMastery.size) : 0;

    return NextResponse.json({
      primary_gaps: primaryGaps,
      secondary_gaps: secondaryGaps,
      understood_concepts: understoodConcepts,
      overall_mastery: overallMastery,
      total_concepts: conceptBestMastery.size,
      source: 'local_database'
    });
  } catch (error) {
    console.error('Gaps API error:', error);
    return NextResponse.json({ 
      error: error.message,
      primary_gaps: [], 
      secondary_gaps: [],
      understood_concepts: []
    }, { status: 500 });
  }
}