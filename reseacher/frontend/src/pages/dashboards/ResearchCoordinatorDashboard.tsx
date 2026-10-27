import { useTrialBridge } from '@/store/TrialBridgeContext';
import { MetricCard } from '@/components/shared/MetricCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  UserCheck,
  FileSignature,
  CalendarClock,
  Phone,
  Clock,
  ArrowRight,
  TestTube2,
  Atom,
  ShieldCheck,
  HeartPulse,
  Droplets,
  AlertTriangle,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  computeClinicalEfficacyMetrics,
  computePharmacokineticsMetrics,
  computeSafetyMetrics,
} from '@/lib/analytics';
import type { NavKey } from '@/components/layout/Sidebar';

interface ResearchCoordinatorDashboardProps {
  onNavigate?: (page: NavKey) => void;
}

export function ResearchCoordinatorDashboard({ onNavigate }: ResearchCoordinatorDashboardProps) {
  const { participants, tasks, visits } = useTrialBridge();

  const toReview = participants.filter((p) => p.screeningStatus === 'potentially_eligible' || p.screeningStatus === 'human_review').length;
  const consentPending = participants.filter((p) => p.consentStatus === 'pending' || p.consentStatus === 'viewed' || p.consentStatus === 'sent').length;
  const todayVisits = visits.filter((v) => v.status === 'scheduled').length;
  const followupsDue = tasks.filter((t) => t.type === 'participant_followup' && t.status !== 'completed').length;

  const clinicalEfficacy = computeClinicalEfficacyMetrics(participants);
  const pkMetrics = computePharmacokineticsMetrics(participants);
  const safetyMetrics = computeSafetyMetrics(participants);

  const todayTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'overdue' || t.status === 'in_progress').slice(0, 5);

  const pipelineStages = [
    { label: 'Candidate', count: participants.filter(p => p.screeningStatus === 'candidate').length, color: 'bg-slate-100 text-slate-600' },
    { label: 'Screening', count: participants.filter(p => p.screeningStatus === 'screening').length, color: 'bg-blue-50 text-blue-700' },
    { label: 'Eligible', count: participants.filter(p => p.screeningStatus === 'potentially_eligible' || p.screeningStatus === 'approved').length, color: 'bg-purple-50 text-purple-700' },
    { label: 'Consent', count: participants.filter(p => p.consentStatus === 'consented' || p.consentStatus === 'pending' || p.consentStatus === 'viewed').length, color: 'bg-amber-50 text-amber-700' },
    { label: 'Enrolled', count: participants.filter(p => p.enrollmentStatus === 'enrolled').length, color: 'bg-green-50 text-green-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Good Morning, Maya</h1>
        <p className="mt-1 text-sm text-slate-500">Research Coordinator workspace — monitor participants, tasks, and renal trial protocols.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={UserCheck} label="Participants to Review" value={toReview} change="Live state" changeType="neutral" iconBg="bg-amber-50" iconColor="text-amber-600" delay={0} />
        <MetricCard icon={HeartPulse} label="Dose Cohorts Monitored" value="3 Cohorts" change="50mg · 100mg · 150mg" changeType="neutral" iconBg="bg-purple-50" iconColor="text-purple-600" delay={60} />
        <MetricCard icon={AlertTriangle} label="Safety Events Monitored" value={`${safetyMetrics.aeCount} AEs`} change={`${safetyMetrics.hypoglycemiaCount} Hypoglycemia`} changeType={safetyMetrics.aeCount > 0 ? "negative" : "positive"} iconBg="bg-rose-50" iconColor="text-rose-600" delay={120} />
        <MetricCard icon={Phone} label="Follow-ups Due" value={followupsDue} change="Actionable" changeType="negative" iconBg="bg-green-50" iconColor="text-green-600" delay={180} />
      </div>

      {/* 3D Simulation Lab Quick Access for Researcher */}
      <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/60 via-white to-red-50/40 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <TestTube2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">3D Simulation Lab & Renal Workbench</h2>
              <span className="rounded-md bg-red-100 text-red-700 px-2 py-0.5 text-[11px] font-bold">
                Kidneys (Red Highlight)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Available to Researcher & PI · Explore Type 2 Diabetes active compound <strong>C₄H₁₁N₅ (Metformin)</strong> clearance kinetics.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-lg">
            Formula: C₄H₁₁N₅
          </span>
          {onNavigate && (
            <Button
              size="sm"
              onClick={() => onNavigate('simulation-lab')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1"
            >
              Open 3D Lab
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Cohort Monitoring & Trial Safety Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Type 2 Diabetes Cohort & Safety Monitoring ({participants.length} Participants)
              </h2>
              <p className="text-xs text-slate-500">
                Live trial coordination across 50mg, 100mg, and 150mg titration arms.
              </p>
            </div>
          </div>
          {onNavigate && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold gap-1.5 self-start sm:self-auto"
            >
              <FileText className="h-3.5 w-3.5" />
              Full Safety Reports
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {safetyMetrics.byDoseAe.map((ds) => (
            <div key={ds.dose} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{ds.dose} Cohort</span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  {ds.total} Patients
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Adverse Events:</span>
                  <span className={`font-semibold ${ds.aeCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {ds.aeCount} ({ds.aeRate}%)
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Hypoglycemia Events:</span>
                  <span className={`font-semibold ${ds.hypoCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {ds.hypoCount} events
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>AE-Free Patients:</span>
                  <span className="font-semibold text-emerald-700">
                    {ds.total - ds.aeCount} ({((ds.total - ds.aeCount) / ds.total * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/60 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-emerald-900">
              <strong>Trial Safety Status:</strong> Zero liver toxicity alerts (100% normal ALT/AST). All 8 hypoglycemia cases managed without hospitalizations.
            </span>
          </div>
          <span className="font-mono text-emerald-800 font-semibold shrink-0">
            Cohort Retention: 100%
          </span>
        </div>
      </div>

      {/* Participant Pipeline */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
        <h2 className="text-base font-semibold text-slate-900">Participant Pipeline</h2>
        <p className="text-xs text-slate-500">Live dynamic participants by stage</p>
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2">
          {pipelineStages.map((stage, i) => (
            <div key={stage.label} className="flex items-center gap-2 shrink-0">
              <div className={cn('flex min-w-[120px] flex-col items-center gap-2 rounded-xl px-4 py-3', stage.color)}>
                <span className="text-2xl font-bold">{stage.count}</span>
                <span className="text-xs font-medium">{stage.label}</span>
              </div>
              {i < pipelineStages.length - 1 && <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Upcoming Tasks */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
          <h2 className="text-base font-semibold text-slate-900">Upcoming Tasks</h2>
          <p className="text-xs text-slate-500">Tasks due today and this week</p>
          <div className="mt-4 space-y-2">
            {todayTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
              >
                <div className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  task.priority === 'high' ? 'bg-red-50' : task.priority === 'medium' ? 'bg-amber-50' : 'bg-slate-100'
                )}>
                  <Clock className={cn(
                    'h-4 w-4',
                    task.priority === 'high' ? 'text-red-600' : task.priority === 'medium' ? 'text-amber-600' : 'text-slate-500'
                  )} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{task.title}</p>
                  <p className="truncate text-xs text-slate-500">{task.participantName ? `${task.participantId} · ` : ''}{task.studyName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-slate-700">{task.dueTime}</p>
                  <p className="text-[10px] text-slate-400">{task.dueDate}</p>
                </div>
                <StatusBadge status={task.priority} className="shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Participants */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
          <h2 className="text-base font-semibold text-slate-900">Recent Participants</h2>
          <p className="text-xs text-slate-500">Latest participant activity</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 pr-3 text-left font-medium">ID</th>
                  <th className="pb-2 pr-3 text-left font-medium">Name</th>
                  <th className="pb-2 pr-3 text-left font-medium">Study</th>
                  <th className="pb-2 pr-3 text-left font-medium">Status</th>
                  <th className="pb-2 text-left font-medium">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {participants.slice(0, 6).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 pr-3 text-xs font-medium text-slate-700">{p.id}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                          {p.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-slate-500 max-w-[120px] truncate">{p.studyName}</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={p.screeningStatus} /></td>
                    <td className="py-2.5 text-xs text-slate-400">{p.lastActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
