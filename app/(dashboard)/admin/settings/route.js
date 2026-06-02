// app/api/admin/settings/route.js
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET: Fetch settings
export async function GET() {
  try {
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
      const settingValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
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
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}