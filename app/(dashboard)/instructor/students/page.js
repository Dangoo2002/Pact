'use client';

import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { Users, BookOpen, Server, Activity, Database, Shield } from 'lucide-react';

export default function AdminDashboard() {
  const { data: session } = useSession();

  const stats = [
    { title: 'Total Users', value: '156', icon: Users, change: '+12', color: 'bg-blue-500' },
    { title: 'Active Quizzes', value: '24', icon: BookOpen, change: '+3', color: 'bg-green-500' },
    { title: 'System Status', value: 'Operational', icon: Server, change: '99.9%', color: 'bg-green-500' },
    { title: 'API Calls (24h)', value: '2,847', icon: Activity, change: '+342', color: 'bg-purple-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}/10`}>
                    <Icon size={20} className={stat.color} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="font-semibold mb-4">System Health</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>KGI API (Role 2)</span>
                <span className="text-green-500">● Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Recommendation API (Role 3)</span>
                <span className="text-green-500">● Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Assessment API (Role 1)</span>
                <span className="text-yellow-500">● Degraded</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Database (Neon PostgreSQL)</span>
                <span className="text-green-500">● Operational</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                <div>New user registration: alice@example.com</div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                <div>New quiz created: "Advanced Python"</div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5"></div>
                <div>System backup completed successfully</div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5"></div>
                <div>DeepSeek API usage: 847 tokens today</div>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition">Manage Users</button>
            <button className="px-4 py-2 rounded-lg border hover:bg-accent transition">Manage Resources</button>
            <button className="px-4 py-2 rounded-lg border hover:bg-accent transition">View Logs</button>
            <button className="px-4 py-2 rounded-lg border hover:bg-accent transition">Run Backup</button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}