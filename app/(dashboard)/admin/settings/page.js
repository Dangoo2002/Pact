'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Shield, Bell, Database, Globe, Save } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'PACT - Personalized Adaptive Coding Tutor',
    adminEmail: 'admin@pact.com',
    enableRegistration: true,
    requireEmailVerification: false,
    maintenanceMode: false,
    defaultLanguage: 'python',
    apiRateLimit: 100,
    sessionTimeout: 60,
  });

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <Globe size={18} className="text-primary" />
              <h2 className="font-semibold">General Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Site Name</label>
                <Input 
                  value={settings.siteName} 
                  onChange={(e) => handleChange('siteName', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Admin Email</label>
                <Input 
                  type="email" 
                  value={settings.adminEmail} 
                  onChange={(e) => handleChange('adminEmail', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Default Language</label>
                <select 
                  value={settings.defaultLanguage}
                  onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background"
                >
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                  <option value="csharp">C#</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <Shield size={18} className="text-primary" />
              <h2 className="font-semibold">Security Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Enable Public Registration</span>
                <button 
                  onClick={() => handleChange('enableRegistration', !settings.enableRegistration)}
                  className={`w-10 h-5 rounded-full transition ${settings.enableRegistration ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.enableRegistration ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Require Email Verification</span>
                <button 
                  onClick={() => handleChange('requireEmailVerification', !settings.requireEmailVerification)}
                  className={`w-10 h-5 rounded-full transition ${settings.requireEmailVerification ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.requireEmailVerification ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">API Rate Limit (req/min)</label>
                <Input 
                  type="number" 
                  value={settings.apiRateLimit} 
                  onChange={(e) => handleChange('apiRateLimit', parseInt(e.target.value))}
                />
              </div>
            </div>
          </Card>

          {/* System Settings */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <Database size={18} className="text-primary" />
              <h2 className="font-semibold">System Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Maintenance Mode</span>
                <button 
                  onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
                  className={`w-10 h-5 rounded-full transition ${settings.maintenanceMode ? 'bg-destructive' : 'bg-muted'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Session Timeout (minutes)</label>
                <Input 
                  type="number" 
                  value={settings.sessionTimeout} 
                  onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                />
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <Bell size={18} className="text-primary" />
              <h2 className="font-semibold">Notification Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Email Notifications</span>
                <button className="w-10 h-5 rounded-full bg-primary">
                  <div className="w-4 h-4 rounded-full bg-white translate-x-5" />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">System Alerts</span>
                <button className="w-10 h-5 rounded-full bg-primary">
                  <div className="w-4 h-4 rounded-full bg-white translate-x-5" />
                </button>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button>
            <Save size={16} className="mr-2" />
            Save All Settings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}