// app/api/instructor/settings/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, email, currentPassword, newPassword, notificationsEnabled, emailNotifications } = await request.json();

    // Update profile info
    if (fullName || email) {
      await query(
        `UPDATE users 
         SET full_name = COALESCE($1, full_name),
             email = COALESCE($2, email),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $3`,
        [fullName, email, session.user.id]
      );
    }

    // Update password if provided
    if (newPassword) {
      const userResult = await query('SELECT password_hash FROM users WHERE user_id = $1', [session.user.id]);
      const isValid = await bcrypt.compare(currentPassword, userResult.rows[0]?.password_hash);
      
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [hashedPassword, session.user.id]);
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}