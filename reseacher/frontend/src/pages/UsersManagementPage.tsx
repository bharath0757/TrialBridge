import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Search, Mail, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import api from '@/lib/api';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  status: 'active' | 'inactive';
}

const mockUsers: UserItem[] = [
  { id: 'u-1', name: 'Sarah Chen', email: 'sarah.chen@trialbridge.io', role: 'PLATFORM_ADMIN', organization: 'TrialBridge Global', status: 'active' },
  { id: 'u-2', name: 'Dr. J Patel', email: 'j.patel@cityhospital.org', role: 'PRINCIPAL_INVESTIGATOR', organization: 'City Hospital', status: 'active' },
  { id: 'u-3', name: 'Dr. A Sharma', email: 'a.sharma@sunshine.org', role: 'PRINCIPAL_INVESTIGATOR', organization: 'Sunshine Medical Center', status: 'active' },
  { id: 'u-4', name: 'Maya R', email: 'maya.r@trialbridge.io', role: 'RESEARCH_COORDINATOR', organization: 'City Hospital', status: 'active' },
  { id: 'u-5', name: 'Maria Torres', email: 'm.torres@pharmaco.com', role: 'ORGANIZATION', organization: 'PharmaCo Therapeutics', status: 'active' },
  { id: 'u-6', name: 'Rahul Mehta', email: 'rahul.mehta@email.com', role: 'PARTICIPANT', organization: 'City Hospital Site', status: 'active' },
  { id: 'u-7', name: 'Deepa Raj', email: 'deepa.raj@email.com', role: 'PARTICIPANT', organization: 'Sunshine Site', status: 'active' }
];

export function UsersManagementPage() {
  const [users, setUsers] = useState<UserItem[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users/');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setUsers(
            res.data.map((u: any) => ({
              id: u.id || u._id,
              name: u.name,
              email: u.email,
              role: u.role,
              organization: u.organization || 'TrialBridge Network',
              status: u.is_active !== false ? 'active' : 'inactive'
            }))
          );
        }
      } catch {
        // Fallback to initial users
      }
    };
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">User Access & Role-Based Permissions</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage investigators, research coordinators, sponsors, and participant access credentials.
          </p>
        </div>

        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Platform User
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-slate-400 font-medium">Role:</span>
          {(['ALL', 'PLATFORM_ADMIN', 'PRINCIPAL_INVESTIGATOR', 'RESEARCH_COORDINATOR', 'ORGANIZATION', 'PARTICIPANT'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                roleFilter === r
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {r === 'ALL' ? 'All' : r.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role Assigned</th>
                <th className="py-3 px-4">Affiliated Organization</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    {user.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                    {user.email}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="rounded-md bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {user.organization}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <StatusBadge status={user.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
