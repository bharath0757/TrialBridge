import { useState } from 'react';
import { useTrialBridge } from '@/store/TrialBridgeContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Circle,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast as sonnerToast } from 'sonner';
import type { Task, TaskStatus } from '@/types';

const taskTypeLabels: Record<string, string> = {
  eligibility_review: 'Eligibility Review',
  consent_review: 'Consent Review',
  participant_followup: 'Participant Follow-up',
  visit_preparation: 'Visit Preparation',
  document_review: 'Document Review',
  data_verification: 'Data Verification',
};

export function TasksPage() {
  const { tasks, updateTaskStatus } = useTrialBridge();
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');

  const filtered = tasks.filter((t) => filter === 'all' || t.status === filter);

  const stats = {
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    overdue: tasks.filter((t) => t.status === 'overdue').length,
  };

  const handleStatusChange = (taskId: string, status: TaskStatus, taskTitle: string) => {
    updateTaskStatus(taskId, status);
    if (status === 'completed') {
      sonnerToast.success('Task completed', { description: taskTitle });
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">Manage study-related tasks and follow-ups</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Pending', value: stats.pending, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600', filter: 'pending' as const },
          { label: 'In Progress', value: stats.inProgress, icon: PlayCircle, bg: 'bg-blue-50', color: 'text-blue-600', filter: 'in_progress' as const },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, bg: 'bg-green-50', color: 'text-green-600', filter: 'completed' as const },
          { label: 'Overdue', value: stats.overdue, icon: AlertCircle, bg: 'bg-red-50', color: 'text-red-600', filter: 'overdue' as const },
        ].map((s, i) => (
          <button
            key={s.label}
            onClick={() => setFilter(s.filter)}
            className={cn(
              'rounded-2xl border bg-white p-5 text-left transition-all animate-fade-in',
              filter === s.filter ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200/60 hover:border-slate-300'
            )}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', s.bg)}>
              <s.icon className={cn('h-5 w-5', s.color)} />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', filter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}
        >
          All Tasks
        </button>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'rounded-2xl border bg-white p-4 transition-all',
                task.status === 'overdue' ? 'border-red-200' : 'border-slate-200/60'
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed', task.title)}
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    task.status === 'completed' ? 'border-green-500 bg-green-500' : 'border-slate-300 hover:border-blue-400'
                  )}
                >
                  {task.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm font-medium', task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800')}>
                      {task.title}
                    </p>
                    <StatusBadge status={task.priority} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{taskTypeLabels[task.type]}</span>
                    {task.participantName && <span>{task.participantId} · {task.participantName}</span>}
                    <span>{task.studyName}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {task.dueDate} {task.dueTime}</span>
                    <span>· {task.assignee}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={task.status} />
                  {task.status === 'pending' && (
                    <Button size="sm" variant="ghost" onClick={() => handleStatusChange(task.id, 'in_progress', task.title)} className="h-7 px-2 text-xs">
                      <PlayCircle className="h-3.5 w-3.5 mr-1" /> Start
                    </Button>
                  )}
                  {task.status === 'in_progress' && (
                    <Button size="sm" variant="ghost" onClick={() => handleStatusChange(task.id, 'completed', task.title)} className="h-7 px-2 text-xs text-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
