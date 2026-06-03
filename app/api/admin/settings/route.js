// app/api/admin/settings/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: Fetch settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if settings table exists, create if not
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Fetch all settings
    const result = await query('SELECT setting_key, setting_value FROM system_settings');
    
    const settings = {};
    result.rows.forEach(row => {
      try {
        // Try to parse as JSON
        settings[row.setting_key] = JSON.parse(row.setting_value);
      } catch {
        settings[row.setting_key] = row.setting_value;
      }
    });
    
    // Return default settings if no settings exist
    const defaultSettings = {
      siteName: 'PACT - Personalized Adaptive Coding Tutor',
      siteDescription: 'AI-powered personalized learning platform for programming education',
      adminEmail: 'admin@pact.com',
      defaultLanguage: 'python',
      enableRegistration: true,
      requireEmailVerification: false,
      maintenanceMode: false,
      apiRateLimit: 100,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      emailNotifications: true,
      systemAlerts: true,
      weeklyReports: true,
      theme: 'dark',
      animationsEnabled: true,
      deepseekApiKey: '',
      deepseekApiEndpoint: 'https://api.deepseek.com/v1',
    };
    
    return NextResponse.json({ settings: { ...defaultSettings, ...settings } });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST: Save settings
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();
    
    // Ensure settings table exists
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Save each setting
    for (const [key, value] of Object.entries(settings)) {
      let settingValue;
      if (typeof value === 'object') {
        settingValue = JSON.stringify(value);
      } else if (typeof value === 'boolean') {
        settingValue = value ? 'true' : 'false';
      } else {
        settingValue = String(value);
      }
      
      await query(`
        INSERT INTO system_settings (setting_key, setting_value, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (setting_key)
        DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP
      `, [key, settingValue]);
    }
    
    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: 'Failed to save settings: ' + error.message }, { status: 500 });
  }
}