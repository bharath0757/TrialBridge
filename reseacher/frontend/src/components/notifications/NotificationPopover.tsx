import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  FlaskConical,
  Activity,
  Check,
  Calendar,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

interface NotificationPopoverProps {
  onNavigateToNotifications?: () => void;
}

export function NotificationPopover({ onNavigateToNotifications }: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'action'>('all');
  const popoverRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    takeAction,
  } = useRealTimeNotifications();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'action') return n.requires_action || n.type === 'TRIAL_INVITATION' || n.type === 'ADMET_REVIEW';
    return true;
  });

  const actionRequiredCount = notifications.filter(
    (n) => (n.requires_action || n.type === 'TRIAL_INVITATION') && !n.action_taken
  ).length;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'relative rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100',
          isOpen && 'bg-slate-100 text-slate-900'
        )}
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {/* Live WS Pulse Dot */}
        {isConnected && (
          <span
            className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-white"
            title="Real-time WebSocket active"
          />
        )}
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/10 backdrop-blur-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-slate-100 px-2 pt-1">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  'relative px-3 py-1.5 text-xs font-medium transition-colors',
                  activeTab === 'all' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                All
                {activeTab === 'all' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={cn(
                  'relative px-3 py-1.5 text-xs font-medium transition-colors',
                  activeTab === 'unread' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                Unread ({unreadCount})
                {activeTab === 'unread' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('action')}
                className={cn(
                  'relative flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors',
                  activeTab === 'action' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                Action Required
                {actionRequiredCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">
                    {actionRequiredCount}
                  </span>
                )}
                {activeTab === 'action' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />
                )}
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100/80">
              {filteredNotifications.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                    <Bell className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">No notifications in this view</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">You are all caught up!</p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const isTrialInvitation =
                    notif.type === 'TRIAL_INVITATION' ||
                    notif.requires_action ||
                    notif.title.toLowerCase().includes('trial eligibility') ||
                    notif.title.toLowerCase().includes('eligibility confirmed');

                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.read && markAsRead(notif.id)}
                      className={cn(
                        'p-3.5 transition-colors',
                        !notif.read ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-slate-50/80'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs',
                            isTrialInvitation
                              ? 'bg-emerald-100 text-emerald-700'
                              : notif.type === 'ADMET_REVIEW'
                              ? 'bg-purple-100 text-purple-700'
                              : notif.type === 'TASK'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          )}
                        >
                          {isTrialInvitation ? (
                            <FlaskConical className="h-4 w-4" />
                          ) : notif.type === 'ADMET_REVIEW' ? (
                            <Activity className="h-4 w-4" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-semibold text-slate-900 leading-tight truncate">
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                            {notif.message}
                          </p>

                          {/* Actionable Trial Decision Block */}
                          {isTrialInvitation && (
                            <div className="mt-2.5 rounded-xl border border-slate-200/80 bg-slate-50/90 p-2.5">
                              {notif.action_taken === 'ACCEPT' ? (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  <span>Accepted for Trial · Baseline Visit Scheduled</span>
                                </div>
                              ) : notif.action_taken === 'REJECT' ? (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                                  <XCircle className="h-4 w-4 text-rose-600" />
                                  <span>Participation Declined</span>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-[11px] font-medium text-slate-700 mb-2">
                                    Confirm clinical trial participation:
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        takeAction(notif.id, 'ACCEPT', notif.metadata);
                                      }}
                                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Accept for Trial
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        takeAction(notif.id, 'REJECT', notif.metadata);
                                      }}
                                      className="flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span>
                              {notif.created_at
                                ? new Date(notif.created_at).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Just now'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50/50 p-2.5 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigateToNotifications) onNavigateToNotifications();
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span>View all notifications</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
