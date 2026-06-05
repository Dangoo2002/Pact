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

    // Get the most recent gap analysis for this student from local database
    const analysisResult = await query(`
      SELECT id, student_id, concept, session_id, analysis_data, created_at
      FROM gap_analysis
      WHERE student_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [studentId]);

    console.log('Found gap analysis records:', analysisResult.rows.length);

    if (analysisResult.rows.length === 0) {
      return NextResponse.json({ 
        primary_gaps: [], 
        secondary_gaps: [],
        overall_mastery: 0,
        message: "Complete a quiz and click 'Save & Analyze' to see your knowledge gaps"
      });
    }

    // Process each analysis record to extract gaps
    const allPrimaryGaps = [];
    const allSecondaryGaps = [];
    let totalMastery = 0;
    let masteredConcepts = 0;

    for (const row of analysisResult.rows) {
      const analysis = row.analysis_data;
      const concept = row.concept;
      
      if (analysis) {
        // Calculate mastery from accuracy
        const accuracy = analysis.accuracy_percentage || 
                        (analysis.mastery_level === 'advanced' ? 85 : 
                         analysis.mastery_level === 'intermediate' ? 65 : 45);
        
        totalMastery += accuracy;
        masteredConcepts++;
        
        // Create gap entries based on weaknesses
        if (analysis.weaknesses && analysis.weaknesses.length > 0) {
          for (const weakness of analysis.weaknesses) {
            const gap = {
              concept: concept,
              language: 'python',
              mastery: accuracy,
              severity: accuracy < 60 ? 'high' : 'medium',
              gap_type: 'knowledge_gap',
              specific_errors: [weakness],
              detailed_analysis: weakness,
              session_id: row.session_id,
              analyzed_at: row.created_at
            };
            
            if (accuracy < 60) {
              allPrimaryGaps.push(gap);
            } else {
              allSecondaryGaps.push(gap);
            }
          }
        }
        
        // Also add a general gap if no specific weaknesses
        if ((!analysis.weaknesses || analysis.weaknesses.length === 0) && accuracy < 80) {
          const gap = {
            concept: concept,
            language: 'python',
            mastery: accuracy,
            severity: accuracy < 60 ? 'high' : 'medium',
            gap_type: 'needs_practice',
            specific_errors: ['General concept understanding needs improvement'],
            session_id: row.session_id,
            analyzed_at: row.created_at
          };
          
          if (accuracy < 60) {
            allPrimaryGaps.push(gap);
          } else {
            allSecondaryGaps.push(gap);
          }
        }
      }
    }

    // Remove duplicates by concept
    const uniquePrimaryGaps = [];
    const seenPrimaryConcepts = new Set();
    for (const gap of allPrimaryGaps) {
      if (!seenPrimaryConcepts.has(gap.concept)) {
        seenPrimaryConcepts.add(gap.concept);
        uniquePrimaryGaps.push(gap);
      }
    }

    const uniqueSecondaryGaps = [];
    const seenSecondaryConcepts = new Set();
    for (const gap of allSecondaryGaps) {
      if (!seenSecondaryConcepts.has(gap.concept)) {
        seenSecondaryConcepts.add(gap.concept);
        uniqueSecondaryGaps.push(gap);
      }
    }

    const overallMastery = masteredConcepts > 0 ? Math.round(totalMastery / masteredConcepts) : 0;

    return NextResponse.json({
      primary_gaps: uniquePrimaryGaps,
      secondary_gaps: uniqueSecondaryGaps,
      overall_mastery: overallMastery,
      total_quizzes_analyzed: analysisResult.rows.length,
      source: 'local_database'
    });
  } catch (error) {
    console.error('Gaps API error:', error);
    return NextResponse.json({ 
      error: error.message,
      primary_gaps: [], 
      secondary_gaps: []
    }, { status: 500 });
  }
}