// app/api/admin/system-stats/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      systemStats: {
        cpuUsage: 23,
        memoryUsage: 45,
        diskUsage: 38,
        activeConnections: 156,
        apiCallsToday: 1234,
        errorRate: 0.3,
        uptime: '99.98%'
      },
      recentActivities: [
        { action: 'System backup completed', details: 'Database backup size: 2.4GB', time: '2 hours ago', icon: 'database', color: 'blue' },
        { action: 'New admin logged in', details: 'Admin user authenticated from 192.168.1.1', time: '5 hours ago', icon: 'shield', color: 'purple' },
        { action: 'Configuration updated', details: 'API rate limits adjusted to 100 req/min', time: '1 day ago', icon: 'settings', color: 'green' }
      ],
      securityEvents: [
        { event: 'Failed login attempt', details: '5 failed attempts from IP 203.0.113.45', time: '3 hours ago' },
        { event: 'API key rotated', details: 'System API key was regenerated', time: '2 days ago' }
      ]
    });
  } catch (error) {
    console.error('System stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}