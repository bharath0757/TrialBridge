import { useTrialBridge } from '@/store/TrialBridgeContext';
import { MetricCard } from '@/components/shared/MetricCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ProgressRing } from '@/components/shared/StatusBadge';
import {
  Building2,
  Users,
  FlaskConical,
  UserCheck,
  TrendingUp,
  Activity as ActivityIcon,
  Shield,
  FileText,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { organizations, recentActivity, auditLogs } from '@/data/mockData';
import { computeUserGrowthData } from '@/lib/analytics';

export function AdminDashboard() {
  const { studies, participants } = useTrialBridge();
  const totalUsers = organizations.reduce((sum, o) => sum + o.users, 0);
  const totalParticipants = participants.length > 0 ? participants.length : organizations.reduce((sum, o) => sum + o.participants, 0);
  const activeStudies = studies.filter((s) => s.status === 'active' || s.status === 'recruiting' || s.status === 'screening').length;
  const userGrowthData = computeUserGrowthData(participants, totalUsers);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Good Morning, Sarah</h1>
        <p className="mt-1 text-sm text-slate-500">Here's what's happening across your TrialBridge organization today.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Building2} label="Organizations" value={organizations.length} change="12%" iconBg="bg-blue-50" iconColor="text-blue-600" delay={0} />
        <MetricCard icon={Users} label="Total Users" value={totalUsers} change="8.2%" iconBg="bg-purple-50" iconColor="text-purple-600" delay={60} />
        <MetricCard icon={FlaskConical} label="Active Studies" value={activeStudies} change="15%" iconBg="bg-green-50" iconColor="text-green-600" delay={120} />
        <MetricCard icon={UserCheck} label="Total Participants" value={totalParticipants} change="11%" iconBg="bg-amber-50" iconColor="text-amber-600" delay={180} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* User Growth Chart */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 lg:col-span-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">User Growth</h2>
              <p className="text-xs text-slate-500">Platform users and participants over time</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Users</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-purple-500" />Participants</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260} className="mt-4">
            <AreaChart data={userGrowthData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Area type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} fill="url(#colorUsers)" />
              <Area type="monotone" dataKey="participants" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorParticipants)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Active Studies Overview */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
          <h2 className="text-base font-semibold text-slate-900">Active Studies</h2>
          <p className="text-xs text-slate-500">Enrollment progress by study</p>
          <div className="mt-4 space-y-4">
            {studies.slice(0, 4).map((study) => {
              const pct = Math.round((study.enrolledParticipants / study.targetParticipants) * 100);
              return (
                <div key={study.id} className="flex items-center gap-3">
                  <ProgressRing value={pct} size={44} stroke={3} color={pct >= 75 ? '#22C55E' : pct >= 50 ? '#3B82F6' : '#F59E0B'} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{study.name}</p>
                    <p className="text-xs text-slate-500">{study.enrolledParticipants}/{study.targetParticipants} enrolled</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity + Org Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
          <div className="flex items-center gap-2">
            <ActivityIcon className="h-4 w-4 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">Recent Platform Activity</h2>
          </div>
          <div className="mt-4 space-y-3">
            {recentActivity.map((act) => (
              <div key={act.id} className="flex items-start gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  {act.type === 'study' && <FlaskConical className="h-4 w-4 text-blue-600" />}
                  {act.type === 'participant' && <UserCheck className="h-4 w-4 text-green-600" />}
                  {act.type === 'consent' && <FileText className="h-4 w-4 text-purple-600" />}
                  {act.type === 'screening' && <TrendingUp className="h-4 w-4 text-amber-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800">{act.action}</p>
                  <p className="text-xs text-slate-500">{act.target}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{act.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Organization Statistics */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">Organization Statistics</h2>
          </div>
          <ResponsiveContainer width="100%" height={180} className="mt-3">
            <BarChart data={organizations} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                cursor={{ fill: '#F8FAFC' }}
              />
              <Bar dataKey="participants" fill="#93C5FD" radius={[6, 6, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500">{organizations.length} organizations</span>
            <span className="font-medium text-slate-700">{totalParticipants} total participants</span>
          </div>
        </div>
      </div>

      {/* Recent Users + Audit Logs */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">Recent Users</h2>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { name: 'Dr. James Patel', role: 'Principal Investigator', org: 'City Hospital', time: '2h ago' },
              { name: 'Maya Rodriguez', role: 'Research Coordinator', org: 'TrialBridge', time: '5h ago' },
              { name: 'Dr. Anita Sharma', role: 'Principal Investigator', org: 'Sunshine Medical', time: '1d ago' },
              { name: 'Michael Torres', role: 'Sponsor', org: 'PharmaCo Research', time: '2d ago' },
            ].map((u, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-semibold text-white">
                  {((u.name || '').trim().split(/\s+/).map((n: string) => n[0] || '').join('').slice(0, 2) || 'U')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{u.name}</p>
                  <p className="truncate text-xs text-slate-500">{u.role} · {u.org}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{u.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">Audit Logs</h2>
          </div>
          <div className="mt-4 space-y-2">
            {auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800">{log.action}</p>
                  <p className="text-xs text-slate-500">{log.user} → {log.target}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{(log.timestamp || '').includes(' ') ? log.timestamp.split(' ')[1] : (log.timestamp || '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
