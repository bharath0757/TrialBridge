import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Clock, XCircle, Circle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type StatusType = 'match' | 'review' | 'mismatch' | 'approved' | 'rejected' | 'pending' | 'screening' | 'potentially_eligible' | 'human_review' | 'candidate' | 'consented' | 'not_started' | 'sent' | 'viewed' | 'withdrawn' | 'enrolled' | 'not_enrolled' | 'completed' | 'active' | 'recruiting' | 'paused' | 'scheduled' | 'missed' | 'cancelled' | 'in_progress' | 'overdue' | 'high' | 'medium' | 'low';

const statusConfig: Record<string, { label: string; bg: string; text: string; icon?: LucideIcon }> = {
  match: { label: 'Match', bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2 },
  review: { label: 'Requires Review', bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertCircle },
  mismatch: { label: 'Mismatch', bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
  approved: { label: 'Approved', bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  screening: { label: 'Screening', bg: 'bg-blue-50', text: 'text-blue-700', icon: Circle },
  potentially_eligible: { label: 'Potentially Eligible', bg: 'bg-purple-50', text: 'text-purple-700', icon: AlertCircle },
  human_review: { label: 'Human Review', bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertCircle },
  candidate: { label: 'Candidate', bg: 'bg-slate-100', text: 'text-slate-600', icon: Circle },
  consented: { label: 'Consented', bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2 },
  not_started: { label: 'Not Started', bg: 'bg-slate-100', text: 'text-slate-500', icon: Circle },
  sent: { label: 'Sent', bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
  viewed: { label: 'Viewed', bg: 'bg-purple-50', text: 'text-purple-700', icon: Clock },
  withdrawn: { label: 'Withdrawn', bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
  enrolled: { label: 'Enrolled', bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2 },
  not_enrolled: { label: 'Not Enrolled', bg: 'bg-slate-100', text: 'text-slate-500', icon: Circle },
  completed: { label: 'Completed', bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2 },
  active: { label: 'Active', bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2 },
  recruiting: { label: 'Recruiting', bg: 'bg-blue-50', text: 'text-blue-700', icon: Circle },
  paused: { label: 'Paused', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  scheduled: { label: 'Scheduled', bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
  missed: { label: 'Missed', bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
  cancelled: { label: 'Cancelled', bg: 'bg-slate-100', text: 'text-slate-500', icon: XCircle },
  in_progress: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
  overdue: { label: 'Overdue', bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle },
  high: { label: 'HIGH', bg: 'bg-red-50', text: 'text-red-700' },
  medium: { label: 'MEDIUM', bg: 'bg-amber-50', text: 'text-amber-700' },
  low: { label: 'LOW', bg: 'bg-slate-100', text: 'text-slate-600' },
};

export function StatusBadge({ status, className }: { status: StatusType | string; className?: string }) {
  const config = statusConfig[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-600' };
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        config.bg,
        config.text,
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  );
}

export function ProgressRing({ value, size = 48, stroke = 4, color = '#3B82F6' }: { value: number; size?: number; stroke?: number; color?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-slate-700">{value}%</span>
    </div>
  );
}
