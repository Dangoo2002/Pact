// app/api/admin/users/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const result = await query(`
      SELECT user_id, email, full_name, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { email, full_name, role, password } = await request.json();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING user_id',
      [email, hashedPassword, full_name, role]
    );
    
    return NextResponse.json({ success: true, userId: result.rows[0].user_id });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const { email, full_name, role } = await request.json();
    
    await query(
      'UPDATE users SET email = $1, full_name = $2, role = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4',
      [email, full_name, role, userId]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    await query('DELETE FROM users WHERE user_id = $1', [userId]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}