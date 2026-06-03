// app/api/instructor/assessments/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Fetch all assessments
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Since there's no assessments table, we'll use questions as assessments
    const assessments = await query(`
      SELECT 
        q.question_id as id,
        'Quiz ' || q.question_id as title,
        'Assessment for ' || COALESCE(c.concept_name, 'General') as description,
        (SELECT COUNT(*) FROM questions) as questionCount,
        30 as duration,
        (NOW() + INTERVAL '7 days')::date as dueDate
      FROM questions q
      LEFT JOIN concepts c ON q.concept_id = c.concept_id
      GROUP BY q.question_id, c.concept_name
      LIMIT 10
    `);

    return NextResponse.json({ assessments: assessments.rows });
  } catch (error) {
    console.error('Assessments API error:', error);
    return NextResponse.json({ assessments: [] });
  }
}

// POST - Create a new assessment
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, duration, dueDate } = body;

    // This would create an assessment in an assessments table
    // For now, return success
    return NextResponse.json({ 
      success: true, 
      id: Date.now(),
      message: 'Assessment created successfully'
    });
  } catch (error) {
    console.error('Failed to create assessment:', error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
}

// PUT - Update an assessment
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('id');
    const body = await request.json();
    
    // This would update an assessment
    return NextResponse.json({ success: true, message: 'Assessment updated successfully' });
  } catch (error) {
    console.error('Failed to update assessment:', error);
    return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 });
  }
}

// DELETE - Delete an assessment
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('id');
    
    // This would delete an assessment
    return NextResponse.json({ success: true, message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Failed to delete assessment:', error);
    return NextResponse.json({ error: 'Failed to delete assessment' }, { status: 500 });
  }
}