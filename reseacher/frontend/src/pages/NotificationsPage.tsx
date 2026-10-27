import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  FlaskConical,
  Activity,
  Check,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    takeAction,
  } = useRealTimeNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'action'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread' && n.read) return false;
    if (activeTab === 'action' && !n.requires_action && n.type !== 'TRIAL_INVITATION' && n.type !== 'ADMET_REVIEW') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    }
    return true;
  });

  const actionRequiredCount = notifications.filter(
    (n) => (n.requires_action || n.type === 'TRIAL_INVITATION') && !n.action_taken
  ).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Bell className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications & Alerts Center</h1>
            {isConnected && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Real-Time Live
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time operational alerts, trial invitations, and clinical decision requests.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="gap-1.5 text-xs text-slate-600 border-slate-300 hover:bg-slate-100"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Control Bar: Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
              activeTab === 'unread'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab('action')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
              activeTab === 'action'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <span>Action Required</span>
            {actionRequiredCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-200/80 px-1 text-[10px] font-bold text-amber-900">
                {actionRequiredCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts..."
            className="h-8 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No notifications found</p>
            <p className="text-xs text-slate-400 mt-1">
              There are no notifications matching your selected filter.
            </p>
          </div>
        ) : (
          filtered.map((notif) => {
            const isTrialInvitation =
              notif.type === 'TRIAL_INVITATION' ||
              notif.requires_action ||
              notif.title.toLowerCase().includes('trial eligibility') ||
              notif.title.toLowerCase().includes('eligibility confirmed');

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className={cn(
                  'rounded-2xl border p-4.5 transition-all shadow-sm',
                  !notif.read
                    ? 'border-blue-200 bg-blue-50/20 hover:border-blue-300'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        isTrialInvitation
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : notif.type === 'ADMET_REVIEW'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      )}
                    >
                      {isTrialInvitation ? (
                        <FlaskConical className="h-5 w-5" />
                      ) : notif.type === 'ADMET_REVIEW' ? (
                        <Activity className="h-5 w-5" />
                      ) : (
                        <Bell className="h-5 w-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{notif.title}</h3>
                        {!notif.read && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {notif.created_at
                            ? new Date(notif.created_at).toLocaleString()
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  {isTrialInvitation && (
                    <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                      {notif.action_taken === 'ACCEPT' ? (
                        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Accepted for Trial</span>
                        </div>
                      ) : notif.action_taken === 'REJECT' ? (
                        <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">
                          <XCircle className="h-4 w-4 text-rose-600" />
                          <span>Declined</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              takeAction(notif.id, 'ACCEPT', notif.metadata);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold px-4 shadow-sm"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Accept for Trial
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              takeAction(notif.id, 'REJECT', notif.metadata);
                            }}
                            className="text-slate-600 border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 gap-1.5 text-xs"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
