import { useTrialBridge } from '@/store/TrialBridgeContext';
import { MetricCard } from '@/components/shared/MetricCard';
import { ProgressRing } from '@/components/shared/StatusBadge';
import {
  FlaskConical,
  Building2,
  Users,
  TrendingUp,
  Trophy,
  MapPin,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from 'recharts';
import {
  computeEnrollmentTrend,
  computeSitePerformance,
  computeTrialPerformance,
} from '@/lib/analytics';
import { cn } from '@/lib/utils';

export function SponsorDashboard() {
  const { studies, participants } = useTrialBridge();
  const activeTrials = studies.length;
  const totalParticipants = participants.length;
  const enrolledCount = participants.filter((p) => p.enrollmentStatus === 'enrolled').length;
  const enrollmentRate = totalParticipants > 0 ? Math.round((enrolledCount / totalParticipants) * 100) : 0;

  const enrollmentTrendData = computeEnrollmentTrend(participants, studies);
  const sitePerformanceData = computeSitePerformance(studies, participants);
  const trialPerformanceData = computeTrialPerformance(studies);
  const researchSites = sitePerformanceData.length;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Portfolio Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor recruitment and performance across clinical trials.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FlaskConical} label="Active Trials" value={activeTrials} change="2 new" iconBg="bg-blue-50" iconColor="text-blue-600" delay={0} />
        <MetricCard icon={Building2} label="Research Sites" value={researchSites} change="1 new" changeType="neutral" iconBg="bg-purple-50" iconColor="text-purple-600" delay={60} />
        <MetricCard icon={Users} label="Participants" value={totalParticipants} change="18%" iconBg="bg-green-50" iconColor="text-green-600" delay={120} />
        <MetricCard icon={TrendingUp} label="Enrollment Rate" value={`${enrollmentRate}%`} change="6%" iconBg="bg-amber-50" iconColor="text-amber-600" delay={180} />
      </div>

      {/* Trial Performance */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
        <h2 className="text-base font-semibold text-slate-900">Trial Performance</h2>
        <p className="text-xs text-slate-500">Enrollment vs. target by trial</p>
        <ResponsiveContainer width="100%" height={280} className="mt-4">
          <BarChart data={trialPerformanceData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="trial" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} cursor={{ fill: '#F8FAFC' }} />
            <Bar dataKey="enrolled" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={32} name="Enrolled" />
            <Bar dataKey="target" fill="#DBEAFE" radius={[6, 6, 0, 0]} barSize={32} name="Target" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Site Performance Ranking */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-semibold text-slate-900">Site Performance</h2>
          </div>
          <p className="text-xs text-slate-500">Ranked by recruitment performance</p>
          <div className="mt-4 space-y-3">
            {sitePerformanceData.map((site, i) => (
              <div key={site.site} className="flex items-center gap-3">
                <span className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                  i === 0 ? 'bg-amber-50 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'
                )}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="truncate text-sm font-medium text-slate-800">{site.site}</span>
                    <span className="text-sm font-semibold text-slate-900">{site.rate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${site.rate}%`, background: site.rate >= 75 ? '#22C55E' : site.rate >= 60 ? '#3B82F6' : '#F59E0B' }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{site.participants} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Enrollment Trend */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
          <h2 className="text-base font-semibold text-slate-900">Enrollment Trend</h2>
          <p className="text-xs text-slate-500">Monthly enrollment across all trials</p>
          <ResponsiveContainer width="100%" height={240} className="mt-4">
            <LineChart data={enrollmentTrendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
              <Line type="monotone" dataKey="enrolled" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4, fill: '#8B5CF6' }} />
              <Line type="monotone" dataKey="target" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trial Completion Progress */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
        <h2 className="text-base font-semibold text-slate-900">Trial Completion Progress</h2>
        <p className="text-xs text-slate-500">Overall progress toward study completion</p>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {studies.map((study) => {
            const pct = Math.round((study.enrolledParticipants / study.targetParticipants) * 100);
            return (
              <div key={study.id} className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-4 text-center">
                <ProgressRing value={pct} size={56} stroke={4} color={pct >= 75 ? '#22C55E' : pct >= 50 ? '#3B82F6' : '#F59E0B'} />
                <div>
                  <p className="text-xs font-medium text-slate-700 leading-tight">{study.name}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <MapPin className="h-2.5 w-2.5" /> {study.researchSite.split(',')[0]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
