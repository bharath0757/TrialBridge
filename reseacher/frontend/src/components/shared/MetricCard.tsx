import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  iconBg?: string;
  iconColor?: string;
  subtitle?: string;
  delay?: number;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  changeType = 'positive',
  iconBg = 'bg-blue-50',
  iconColor = 'text-blue-600',
  subtitle = 'vs. last month',
  delay = 0,
}: MetricCardProps) {
  return (
    <div
      className="card-hover rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        {change && (
          <span
            className={cn(
              'text-xs font-semibold',
              changeType === 'positive' && 'text-green-600',
              changeType === 'negative' && 'text-red-500',
              changeType === 'neutral' && 'text-slate-500'
            )}
          >
            {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : '→'} {change}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
        {change && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}
