'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Search, UserPlus, MoreVertical, Shield, User, GraduationCap } from 'lucide-react';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'student', status: 'active', joined: '2026-01-15' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'student', status: 'active', joined: '2026-01-20' },
    { id: 3, name: 'Carol Davis', email: 'carol@example.com', role: 'student', status: 'inactive', joined: '2026-02-01' },
    { id: 4, name: 'Dr. White', email: 'white@example.com', role: 'instructor', status: 'active', joined: '2025-12-10' },
    { id: 5, name: 'Admin User', email: 'admin@pact.com', role: 'admin', status: 'active', joined: '2025-11-01' },
  ]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <Shield size={16} className="text-purple-500" />;
      case 'instructor': return <GraduationCap size={16} className="text-blue-500" />;
      default: return <User size={16} className="text-green-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage system users and roles</p>
          </div>
          <Button>
            <UserPlus size={16} className="mr-2" />
            Add User
          </Button>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </Card>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-sm">User</th>
                <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
                <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                <th className="text-left py-3 px-4 font-medium text-sm">Joined</th>
                <th className="text-left py-3 px-4 font-medium text-sm"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <span className="text-sm capitalize">{user.role}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-500'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{user.joined}</td>
                  <td className="py-3 px-4">
                    <button className="p-1 hover:bg-muted rounded">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}