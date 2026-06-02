'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Users, TrendingUp, AlertTriangle, BookOpen, 
  BarChart3, ChevronRight, Star, Award,
  Calendar, MessageSquare, Download, Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Link from 'next/link';

export default function InstructorDashboard() {
  const { data: session } = useSession();

  const classData = {
    totalStudents: 48,
    activeStudents: 42,
    averageMastery: 72,
    pendingAssignments: 8,
    classProgress: [
      { concept: 'Variables', mastery: 85 },
      { concept: 'Loops', mastery: 62 },
      { concept: 'Functions', mastery: 58 },
      { concept: 'Arrays', mastery: 70 },
      { concept: 'OOP', mastery: 45 },
    ],
    performanceTrend: [
      { week: 'Week 1', avg: 65 },
      { week: 'Week 2', avg: 68 },
      { week: 'Week 3', avg: 71 },
      { week: 'Week 4', avg: 74 },
      { week: 'Week 5', avg: 76 },
    ],
    atRiskStudents: [
      { id: 1, name: 'John Doe', mastery: 34, lastActive: '2 days ago' },
      { id: 2, name: 'Jane Smith', mastery: 28, lastActive: '5 days ago' },
      { id: 3, name: 'Mike Johnson', mastery: 41, lastActive: '1 day ago' },
    ]
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor class progress and student performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{classData.totalStudents}</p>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-full bg-green-500/10">
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{classData.averageMastery}%</p>
            <p className="text-sm text-muted-foreground">Avg Mastery</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-full bg-red-500/10">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{classData.atRiskStudents.length}</p>
            <p className="text-sm text-muted-foreground">At-Risk Students</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-full bg-orange-500/10">
            <BookOpen className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{classData.pendingAssignments}</p>
            <p className="text-sm text-muted-foreground">Pending Reviews</p>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="font-semibold mb-4">Class Performance by Concept</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData.classProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="concept" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="mastery" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-4">Average Performance Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={classData.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[50, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* At-Risk Students */}
      <Card className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-red-500 flex items-center gap-2">
            <AlertTriangle size={18} />
            Students Needing Attention
          </h2>
          <Button variant="outline" size="sm">
            <Download size={14} className="mr-1" />
            Export Report
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium">Student Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium">Current Mastery</th>
                <th className="text-left py-3 px-4 text-sm font-medium">Last Active</th>
                <th className="text-left py-3 px-4 text-sm font-medium">Recommended Action</th>
                <th className="text-left py-3 px-4 text-sm font-medium"></th>
               </tr>
            </thead>
            <tbody>
              {classData.atRiskStudents.map((student) => (
                <tr key={student.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{student.name}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${student.mastery}%` }} />
                      </div>
                      <span className="text-sm">{student.mastery}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{student.lastActive}</td>
                  <td className="py-3 px-4 text-sm">Schedule 1-on-1 session</td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="sm">Reach Out</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between hover:shadow-md transition cursor-pointer">
          <div>
            <h3 className="font-semibold">Create Assessment</h3>
            <p className="text-sm text-muted-foreground">Design new quizzes and tests</p>
          </div>
          <Button>Create</Button>
        </Card>
        <Card className="p-4 flex items-center justify-between hover:shadow-md transition cursor-pointer">
          <div>
            <h3 className="font-semibold">Review Submissions</h3>
            <p className="text-sm text-muted-foreground">{classData.pendingAssignments} pending reviews</p>
          </div>
          <Button variant="outline">Review</Button>
        </Card>
        <Card className="p-4 flex items-center justify-between hover:shadow-md transition cursor-pointer">
          <div>
            <h3 className="font-semibold">Generate Report</h3>
            <p className="text-sm text-muted-foreground">Export class performance data</p>
          </div>
          <Button variant="outline">Generate</Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}