// app/api/admin/resources/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// GET - Fetch all resources
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(`
      SELECT 
        resource_id,
        title,
        resource_type,
        url,
        difficulty_level,
        quality_score,
        created_at,
        updated_at
      FROM resources 
      ORDER BY created_at DESC
    `);
    
    return NextResponse.json({ resources: result.rows });
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return NextResponse.json({ resources: [] });
  }
}

// POST - Create a new resource
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, resource_type, url, difficulty_level, quality_score } = body;

    if (!title || !resource_type) {
      return NextResponse.json({ error: 'Title and resource type are required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO resources (title, resource_type, url, difficulty_level, quality_score, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING resource_id`,
      [title, resource_type, url || null, difficulty_level || 3, quality_score || 0.7]
    );
    
    return NextResponse.json({ 
      success: true, 
      resource_id: result.rows[0].resource_id,
      message: 'Resource created successfully'
    });
  } catch (error) {
    console.error('Failed to create resource:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}

// PUT - Update a resource
export async function PUT(request) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('id');
    
    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, resource_type, url, difficulty_level, quality_score } = body;

    const result = await query(
      `UPDATE resources 
       SET title = $1, 
           resource_type = $2, 
           url = $3, 
           difficulty_level = $4, 
           quality_score = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE resource_id = $6
       RETURNING resource_id`,
      [title, resource_type, url || null, difficulty_level || 3, quality_score || 0.7, resourceId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Resource updated successfully' });
  } catch (error) {
    console.error('Failed to update resource:', error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

// DELETE - Delete a resource
export async function DELETE(request) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('id');
    
    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    // Delete related records first
    await query('DELETE FROM resource_engagement WHERE resource_id = $1', [resourceId]);
    
    // Delete the resource
    const result = await query('DELETE FROM resources WHERE resource_id = $1 RETURNING resource_id', [resourceId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Failed to delete resource:', error);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}