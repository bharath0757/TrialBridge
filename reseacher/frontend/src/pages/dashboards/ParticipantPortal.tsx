import { useState } from 'react';
import { useTrialBridge } from '@/store/TrialBridgeContext';
import { useAuth } from '@/store/AuthContext';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { participants as mockParticipants, studies as mockStudies } from '@/data/mockData';
import type { Participant, Visit } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';
import {
  Calendar,
  MapPin,
  FileText,
  MessageSquare,
  FlaskConical,
  Clock,
  CheckCircle2,
  XCircle,
  Heart,
  Phone,
  Bell,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { NavKey } from '@/components/layout/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onNavigate: (key: NavKey) => void;
}

export function ParticipantPortal({ onNavigate }: Props) {
  const { participants, visits, documents, messages, studies } = useTrialBridge();
  const { user } = useAuth();
  const { notifications, takeAction } = useRealTimeNotifications();

  const [localDecision, setLocalDecision] = useState<'ACCEPT' | 'REJECT' | null>(null);
  const [localScheduledVisit, setLocalScheduledVisit] = useState<Visit | null>(null);

  const defaultParticipant: Participant = mockParticipants.find(p => p.id === 'P00124') || mockParticipants[0];
  const me = participants.find((p) => p.id === 'P00124' || (user?.email && p.email === user.email) || (user?.name && p.name === user.name)) || participants[0] || defaultParticipant;
  
  const myStudy = studies.find((s) => s.id === (me?.studyId || defaultParticipant.studyId)) || mockStudies.find((s) => s.id === (me?.studyId || defaultParticipant.studyId)) || studies[0] || mockStudies[0];
  
  // Combine server visits with any locally scheduled baseline visit
  const allMyVisits = [
    ...(localScheduledVisit ? [localScheduledVisit] : []),
    ...visits.filter((v) => v.participantId === (me?.id || defaultParticipant.id) || v.participantId === 'P00124'),
  ];
  const myVisits = Array.from(new Map(allMyVisits.map((v) => [v.id, v])).values());

  const upcomingVisit = myVisits.find((v) => (v.status === 'scheduled' || v.status === 'SCHEDULED') && v.date >= '2026-09-10') || myVisits[0];
  const myDocuments = documents.filter((d) => d.participantId === (me?.id || defaultParticipant.id));
  const myMessages = messages.filter((m) => m.to === (me?.name || defaultParticipant.name));
  const firstName = me?.name ? me.name.split(' ')[0] : (user?.name ? user.name.split(' ')[0] : 'Participant');

  // Find active or completed trial invitation
  const trialInvitation = notifications.find(
    (n) => n.type === 'TRIAL_INVITATION' || n.requires_action
  );

  const handleAcceptTrial = async () => {
    setLocalDecision('ACCEPT');
    const notifId = trialInvitation?.id || 'demo-notif';
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const newVisit: Visit = {
      id: `v-auto-${Date.now()}`,
      participantId: me?.id || 'P00124',
      participantName: me?.name || 'Rahul Mehta',
      studyId: myStudy?.id || 'DB-101',
      studyName: myStudy?.name || 'Type 2 Diabetes Study (C4H11N5 Renal Dynamics)',
      date: futureDate,
      time: '10:00 AM',
      type: 'Baseline Clinical Intake & Physical Exam',
      status: 'scheduled',
      location: 'Clinical Trial Unit - Suite 302',
      coordinator: 'Maya R',
    };
    setLocalScheduledVisit(newVisit);
    await takeAction(notifId, 'ACCEPT', { participant_id: me?.id || 'P00124', study_id: myStudy?.id || 'DB-101' });
  };

  const handleRejectTrial = async () => {
    setLocalDecision('REJECT');
    const notifId = trialInvitation?.id || 'demo-notif';
    await takeAction(notifId, 'REJECT', { participant_id: me?.id || 'P00124', study_id: myStudy?.id || 'DB-101' });
  };

  return (
    <div className="space-y-6">
      {/* Welcome header - friendlier */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Heart className="h-4 w-4" />
          <span className="font-medium">Welcome back</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Welcome, {firstName}</h1>
        <p className="mt-1 text-sm text-slate-500">Your participation makes a difference.</p>
      </div>

      {/* Actionable Trial Decision Invitation Banner */}
      <AnimatePresence>
        {(trialInvitation || localDecision) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              'overflow-hidden rounded-2xl border p-5 shadow-sm transition-all',
              (localDecision === 'ACCEPT' || trialInvitation?.action_taken === 'ACCEPT')
                ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white'
                : (localDecision === 'REJECT' || trialInvitation?.action_taken === 'REJECT')
                ? 'border-slate-200 bg-slate-50'
                : 'border-amber-200 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-white'
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                    (localDecision === 'ACCEPT' || trialInvitation?.action_taken === 'ACCEPT')
                      ? 'bg-emerald-100 text-emerald-700'
                      : (localDecision === 'REJECT' || trialInvitation?.action_taken === 'REJECT')
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {(localDecision === 'ACCEPT' || trialInvitation?.action_taken === 'ACCEPT') ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (localDecision === 'REJECT' || trialInvitation?.action_taken === 'REJECT') ? (
                    <XCircle className="h-6 w-6" />
                  ) : (
                    <Sparkles className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {(localDecision === 'ACCEPT' || trialInvitation?.action_taken === 'ACCEPT')
                        ? 'Enrolled in Clinical Trial'
                        : (localDecision === 'REJECT' || trialInvitation?.action_taken === 'REJECT')
                        ? 'Trial Invitation Declined'
                        : 'Trial Eligibility Confirmed · Action Required'}
                    </span>
                    {!(localDecision || trialInvitation?.action_taken) && (
                      <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        DECISION NEEDED
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {(localDecision === 'ACCEPT' || trialInvitation?.action_taken === 'ACCEPT')
                      ? '✓ Congratulations! You are enrolled in the Type 2 Diabetes Study'
                      : (localDecision === 'REJECT' || trialInvitation?.action_taken === 'REJECT')
                      ? 'You have declined participation for this trial'
                      : 'You are Eligible: Type 2 Diabetes Study (C4H11N5 Renal Dynamics)'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    {(localDecision === 'ACCEPT' || trialInvitation?.action_taken === 'ACCEPT')
                      ? 'Your participation is confirmed. A Baseline Clinical Intake & Physical Exam visit has been automatically scheduled in your portal below.'
                      : (localDecision === 'REJECT' || trialInvitation?.action_taken === 'REJECT')
                      ? 'Your decision has been communicated to the clinical research staff. You may still view your study materials.'
                      : 'Your clinical screening criteria matched protocol ADA-2026-T2D. Please accept your invitation to confirm enrollment and receive your automated baseline appointment.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {!(localDecision || trialInvitation?.action_taken) && (
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  <button
                    onClick={handleAcceptTrial}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all hover:shadow-lg"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Accept for Trial
                  </button>
                  <button
                    onClick={handleRejectTrial}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Clinical Trial - main card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white animate-fade-in">
        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <FlaskConical className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">My Clinical Trial</p>
              <h2 className="mt-0.5 text-xl font-semibold text-slate-900">{me?.studyName || myStudy?.name || 'Clinical Trial'}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={(localDecision === 'ACCEPT' || trialInvitation?.action_taken === 'ACCEPT') ? 'enrolled' : (localDecision === 'REJECT' ? 'declined' : (me?.enrollmentStatus || 'enrolled'))} />
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-500">Participant ID: {me?.id || defaultParticipant.id}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => onNavigate('studies')} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors">
              <FlaskConical className="h-4 w-4" /> View Study
            </button>
            <button onClick={() => onNavigate('visits')} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Calendar className="h-4 w-4" /> View Visits
            </button>
            <button onClick={() => onNavigate('documents')} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <FileText className="h-4 w-4" /> Documents
            </button>
            <button onClick={() => onNavigate('messages')} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <MessageSquare className="h-4 w-4" /> Messages
            </button>
          </div>
        </div>

        {/* Next visit info bar */}
        {upcomingVisit && (
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Next Visit</p>
                <p className="text-sm font-semibold text-slate-900">{upcomingVisit.date} · {upcomingVisit.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Location</p>
                <p className="text-sm font-semibold text-slate-900">{upcomingVisit.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Visit Type</p>
                <p className="text-sm font-semibold text-slate-900">{upcomingVisit.type}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Calendar, label: 'Upcoming Visits', value: myVisits.filter(v => v.status === 'scheduled').length, bg: 'bg-blue-50', color: 'text-blue-600' },
          { icon: FileText, label: 'My Documents', value: myDocuments.length, bg: 'bg-purple-50', color: 'text-purple-600' },
          { icon: MessageSquare, label: 'Unread Messages', value: myMessages.filter(m => !m.read).length, bg: 'bg-green-50', color: 'text-green-600' },
          { icon: CheckCircle2, label: 'Completed Visits', value: myVisits.filter(v => v.status === 'completed').length, bg: 'bg-amber-50', color: 'text-amber-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-slate-200/60 bg-white p-5"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* My Visits + Trial Anatomy */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* My Visits */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">My Visits</h2>
            <button onClick={() => onNavigate('visits')} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {myVisits.slice(0, 4).map((visit) => (
              <div key={visit.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-50">
                  <span className="text-[10px] font-medium text-slate-400">{visit.date.split('-')[1]}</span>
                  <span className="text-sm font-bold text-slate-800">{visit.date.split('-')[2]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{visit.type} · {visit.studyName}</p>
                  <p className="text-xs text-slate-500">{visit.time} · {visit.location}</p>
                </div>
                <StatusBadge status={visit.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Study Information */}
        {myStudy && (
          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FlaskConical className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">Study Information & Guidance</h2>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Condition & Objectives</p>
              <p className="text-sm font-medium text-slate-800 mt-1">{myStudy.condition}</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{myStudy.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Trial Phase</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{myStudy.phase}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Lead Investigator</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{myStudy.principalInvestigator}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
        </div>
        <div className="mt-4 space-y-2">
          {myMessages.length > 0 ? myMessages.slice(0, 3).map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 rounded-xl p-3 hover:bg-slate-50 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                {msg.type === 'visit_reminder' ? <Calendar className="h-4 w-4 text-blue-600" /> : msg.type === 'consent_reminder' ? <FileText className="h-4 w-4 text-purple-600" /> : <MessageSquare className="h-4 w-4 text-green-600" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">{msg.subject}</p>
                <p className="truncate text-xs text-slate-500">{msg.preview}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{msg.time}</span>
            </div>
          )) : (
            <div className="py-8 text-center">
              <Phone className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-400">No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
