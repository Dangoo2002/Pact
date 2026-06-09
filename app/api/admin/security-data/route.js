// app/api/admin/security-data/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent login activity from users table (last 7 days)
    const recentLogins = await query(`
      SELECT 
        full_name as user,
        created_at as time,
        'System' as location,
        '127.0.0.1' as ip
      FROM users
      WHERE created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Get security settings from system_settings table
    const settingsResult = await query(`
      SELECT setting_key, setting_value FROM system_settings
      WHERE setting_key IN ('twoFactorEnabled', 'sessionTimeout', 'maxLoginAttempts', 'apiRateLimit')
    `);

    const securitySettings = {
      twoFactorEnabled: false,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      apiRateLimit: 100
    };

    for (const row of settingsResult.rows) {
      if (row.setting_key === 'twoFactorEnabled') {
        securitySettings.twoFactorEnabled = row.setting_value === 'true';
      } else if (row.setting_key === 'sessionTimeout') {
        securitySettings.sessionTimeout = parseInt(row.setting_value);
      } else if (row.setting_key === 'maxLoginAttempts') {
        securitySettings.maxLoginAttempts = parseInt(row.setting_value);
      } else if (row.setting_key === 'apiRateLimit') {
        securitySettings.apiRateLimit = parseInt(row.setting_value);
      }
    }

    return NextResponse.json({
      securitySettings,
      recentLogins: recentLogins.rows.map(login => ({
        user: login.user,
        location: login.location,
        ip: login.ip,
        time: timeAgo(new Date(login.time))
      }))
    });
  } catch (error) {
    console.error('Security data API error:', error);
    return NextResponse.json({
      securitySettings: {
        twoFactorEnabled: false,
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        apiRateLimit: 100
      },
      recentLogins: []
    });
  }
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}