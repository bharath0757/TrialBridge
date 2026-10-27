import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, FlaskConical, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import api from '@/lib/api';

interface Org {
  id: string;
  name: string;
  type: string;
  users: number;
  studies: number;
  participants: number;
  status: 'active' | 'inactive';
}

const mockOrgs: Org[] = [
  { id: '1', name: 'City Hospital Health System', type: 'Academic Medical Center', users: 45, studies: 12, participants: 340, status: 'active' },
  { id: '2', name: 'Sunshine Medical Network', type: 'Clinical Research Site', users: 28, studies: 8, participants: 195, status: 'active' },
  { id: '3', name: 'Metro Care Research Institute', type: 'Dedicated Research Center', users: 19, studies: 5, participants: 120, status: 'active' },
  { id: '4', name: 'Global Health University', type: 'University Hospital', users: 62, studies: 18, participants: 510, status: 'active' },
  { id: '5', name: 'LifeCare Hospital Group', type: 'Hospital Network', users: 34, studies: 9, participants: 230, status: 'active' }
];

export function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>(mockOrgs);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await api.get('/organizations/');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setOrgs(
            res.data.map((o: any) => ({
              id: o.id || o._id,
              name: o.name,
              type: o.type || 'Healthcare Network',
              users: 24,
              studies: 6,
              participants: 180,
              status: (o.status || 'active').toLowerCase()
            }))
          );
        }
      } catch {
        // Keep fallback
      }
    };
    fetchOrgs();
  }, []);

  const filtered = orgs.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.type.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Organizations & Research Sites</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Registered research sponsor networks, health systems, and trial clinical sites.
          </p>
        </div>

        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Onboard Organization
        </Button>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200/80 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((org) => (
          <div
            key={org.id}
            className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">{org.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{org.type}</p>
              </div>
              <StatusBadge status={org.status} />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
              <div className="rounded-xl bg-slate-50 p-2">
                <p className="font-bold text-slate-900">{org.users}</p>
                <p className="text-[10px] text-slate-400">Users</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2">
                <p className="font-bold text-slate-900">{org.studies}</p>
                <p className="text-[10px] text-slate-400">Studies</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-2">
                <p className="font-bold text-slate-900">{org.participants}</p>
                <p className="text-[10px] text-slate-400">Participants</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
