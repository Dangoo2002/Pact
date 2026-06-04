import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

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

    // Call KGI API (Role 2) to get real gap profile
    const kgiUrl = `${process.env.NEXT_PUBLIC_KGI_API_URL}/api/v1/kgi/gap-profile/${studentId}`;
    const response = await fetch(kgiUrl);

    if (!response.ok) {
      // Return empty gaps if API fails
      return NextResponse.json({ primary_gaps: [], secondary_gaps: [] });
    }

    const profile = await response.json();
    
    const primaryGaps = (profile.primary_gaps || []).map(gap => ({
      concept: gap.concept,
      language: gap.language || 'python',
      mastery: Math.round((gap.mastery_score || 0) * 100),
      severity: gap.severity,
      gap_type: gap.gap_type
    }));

    const secondaryGaps = (profile.secondary_gaps || []).map(gap => ({
      concept: gap.concept,
      language: gap.language || 'python',
      mastery: Math.round((gap.mastery_score || 0.6) * 100),
      severity: gap.severity
    }));

    return NextResponse.json({ 
      primary_gaps: primaryGaps, 
      secondary_gaps: secondaryGaps,
      overall_mastery: profile.overall_mastery || 0
    });
  } catch (error) {
    console.error('Gaps API error:', error);
    return NextResponse.json({ primary_gaps: [], secondary_gaps: [] });
  }
}