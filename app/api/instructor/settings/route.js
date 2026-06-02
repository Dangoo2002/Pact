// app/api/instructor/settings/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';

export async function PUT(request) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, email, currentPassword, newPassword, notificationsEnabled, emailNotifications } = await request.json();

    if (newPassword) {
      const user = await query('SELECT password_hash FROM users WHERE user_id = $1', [session.user.id]);
      const isValid = await bcrypt.compare(currentPassword, user.rows[0]?.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [hashedPassword, session.user.id]);
    }

    await query('UPDATE users SET full_name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3', [fullName, email, session.user.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}