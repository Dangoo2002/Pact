// app/api/admin/resources/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query(`
      SELECT resource_id, title, resource_type, url, difficulty_level, quality_score, created_at 
      FROM resources 
      ORDER BY created_at DESC
    `);
    return NextResponse.json({ resources: result.rows });
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { title, resource_type, url, difficulty_level, quality_score, concept_ids, language_id } = await request.json();
    
    const result = await query(
      `INSERT INTO resources (title, resource_type, url, difficulty_level, quality_score, concept_ids, language_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING resource_id`,
      [title, resource_type, url, difficulty_level, quality_score, concept_ids || [], language_id || null]
    );
    
    return NextResponse.json({ success: true, resourceId: result.rows[0].resource_id });
  } catch (error) {
    console.error('Failed to create resource:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('id');
    const { title, resource_type, url, difficulty_level, quality_score, concept_ids, language_id } = await request.json();
    
    await query(
      `UPDATE resources 
       SET title = $1, resource_type = $2, url = $3, difficulty_level = $4, quality_score = $5, concept_ids = $6, language_id = $7 
       WHERE resource_id = $8`,
      [title, resource_type, url, difficulty_level, quality_score, concept_ids || [], language_id || null, resourceId]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update resource:', error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('id');
    
    await query('DELETE FROM resources WHERE resource_id = $1', [resourceId]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete resource:', error);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}