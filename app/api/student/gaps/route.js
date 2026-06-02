// app/api/student/gaps/route.js
import { query } from '@/lib/db';
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

    const gapProfile = await query(`
      SELECT identified_gaps 
      FROM gap_profiles 
      WHERE student_id = $1 
      ORDER BY generated_at DESC 
      LIMIT 1
    `, [studentId]);

    let primaryGaps = [];
    let secondaryGaps = [];

    if (gapProfile.rows.length > 0) {
      const gaps = gapProfile.rows[0].identified_gaps || [];
      primaryGaps = gaps.filter(g => g.priority === 'high').map(g => ({ concept: g.concept, mastery: Math.round((g.mastery_score || 0) * 100) }));
      secondaryGaps = gaps.filter(g => g.priority === 'medium').map(g => ({ concept: g.concept, mastery: Math.round((g.mastery_score || 0) * 100) }));
    }

    return NextResponse.json({ primary_gaps: primaryGaps, secondary_gaps: secondaryGaps });
  } catch (error) {
    console.error('Gaps API error:', error);
    return NextResponse.json({ primary_gaps: [], secondary_gaps: [] });
  }
}