'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Users, Server, Activity, Shield, Database, 
  Cpu, Zap, RefreshCw, Settings, BarChart3,
  TrendingUp, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session } = useSession();

  const systemStats = {
    totalUsers: 1256,
    activeUsers: 892,
    totalQuizzes: 45,
    totalResources: 328,
    apiCallsToday: 2847,
    avgResponseTime: 124
  };

  const systemHealth = [
    { service: 'KGI API (Role 2)', status: 'operational', uptime: '99.9%' },
    { service: 'Recommendation API (Role 3)', status: 'operational', uptime: '99.8%' },
    { service: 'Assessment API (Role 1)', status: 'degraded', uptime: '98.5%' },
    { service: 'PostgreSQL Database', status: 'operational', uptime: '99.95%' },
    { service: 'Redis Cache', status: 'operational', uptime: '99.9%' },
    { service: 'DeepSeek-V3 API', status: 'operational', uptime: '99.7%' },
  ];

  const apiUsageData = [
    { hour: '00:00', requests: 120 },
    { hour: '04:00', requests: 45 },
    { hour: '08:00', requests: 320 },
    { hour: '12:00', requests: 580 },
    { hour: '16:00', requests: 450 },
    { hour: '20:00', requests: 290 },
  ];

  const userGrowth = [
    { month: 'Jan', users: 450 },
    { month: 'Feb', users: 580 },
    { month: 'Mar', users: 720 },
    { month: 'Apr', users: 890 },
    { month: 'May', users: 1050 },
    { month: 'Jun', users: 1256 },
  ];

  const getStatusIcon = (status) => {
    if (status === 'operational') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'degraded') return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">System overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{systemStats.totalUsers}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-xs text-green-600">{systemStats.activeUsers} active today</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-full bg-blue-500/10">
            <Database className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{systemStats.totalQuizzes}</p>
            <p className="text-sm text-muted-foreground">Total Quizzes</p>
            <p className="text-xs text-muted-foreground">{systemStats.totalResources} resources</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-full bg-purple-500/10">
            <Activity className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{systemStats.apiCallsToday.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">API Calls (24h)</p>
            <p className="text-xs text-muted-foreground">Avg {systemStats.avgResponseTime}ms</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-full bg-green-500/10">
            <Cpu className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">99.8%</p>
            <p className="text-sm text-muted-foreground">System Uptime</p>
            <p className="text-xs text-green-600">30 day rolling</p>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="font-semibold mb-4">User Growth</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-4">API Usage (Last 24 Hours)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={apiUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* System Health */}
      <Card className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">System Health</h2>
          <Button variant="ghost" size="sm">
            <RefreshCw size={14} className="mr-1" />
            Refresh
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium">Service</th>
                <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium">Uptime</th>
                <th className="text-left py-3 px-4 text-sm font-medium">Last Check</th>
               </tr>
            </thead>
            <tbody>
              {systemHealth.map((service, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{service.service}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <span className="capitalize text-sm">{service.status}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">{service.uptime}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">Just now</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/users">
          <Card className="p-4 text-center hover:shadow-md transition cursor-pointer">
            <Users className="h-6 w-6 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm">User Management</h3>
            <p className="text-xs text-muted-foreground">Manage accounts</p>
          </Card>
        </Link>
        <Link href="/admin/resources">
          <Card className="p-4 text-center hover:shadow-md transition cursor-pointer">
            <Database className="h-6 w-6 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Resource Library</h3>
            <p className="text-xs text-muted-foreground">Manage content</p>
          </Card>
        </Link>
        <Link href="/admin/settings">
          <Card className="p-4 text-center hover:shadow-md transition cursor-pointer">
            <Settings className="h-6 w-6 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm">System Settings</h3>
            <p className="text-xs text-muted-foreground">Configure platform</p>
          </Card>
        </Link>
        <Link href="/admin/analytics">
          <Card className="p-4 text-center hover:shadow-md transition cursor-pointer">
            <BarChart3 className="h-6 w-6 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Analytics</h3>
            <p className="text-xs text-muted-foreground">View reports</p>
          </Card>
        </Link>
      </div>
    </DashboardLayout>
  );
}