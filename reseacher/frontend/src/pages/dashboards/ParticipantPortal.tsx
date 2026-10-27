import { useState } from 'react';
import { useTrialBridge } from '@/store/TrialBridgeContext';
import { useAuth } from '@/store/AuthContext';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { apiErrorMessage } from '@/lib/apiError';
import { Calendar, FileText, FlaskConical, MessageSquare, RefreshCw } from 'lucide-react';
import type { NavKey } from '@/components/layout/Sidebar';

interface Props { onNavigate: (key: NavKey) => void }

export function ParticipantPortal({ onNavigate }: Props) {
  const { participants, visits, documents, messages, studies, refreshData } = useTrialBridge();
  const { user } = useAuth();
  const { notifications, takeAction } = useRealTimeNotifications();
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const me = participants.find(p => p.email === user?.email);
  const myStudy = me?.studyId ? studies.find(s => s.id === me.studyId) : undefined;
  const myVisits = visits.filter(v => v.participantId === me?.id);
  const today = new Date().toISOString().slice(0, 10);
  const nextVisit = myVisits.filter(v => v.status.toLowerCase() === 'scheduled' && v.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const myDocuments = documents.filter(d => d.participantId === me?.id);
  const invitation = notifications.find(n => n.type === 'TRIAL_INVITATION' && n.requires_action && !n.action_taken);
  const firstName = user?.name?.split(' ')[0] || 'Participant';

  async function decide(action: 'ACCEPT' | 'REJECT') {
    if (!invitation || saving) return;
    setSaving(true);
    setActionError('');
    try {
      await takeAction(invitation.id, action);
      await refreshData();
    } catch (error) {
      setActionError(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm font-medium text-blue-600">Your participant portal</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Welcome, {firstName}</h1><p className="mt-1 text-sm text-slate-500">Your research participation, appointments, and documents.</p></div>
      <button onClick={() => void refreshData()} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"><RefreshCw className="h-4 w-4" />Refresh</button>
    </div>
    {actionError ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p> : null}
    {invitation ? <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5" aria-labelledby="invitation-title">
      <h2 id="invitation-title" className="font-semibold text-slate-900">{invitation.title}</h2><p className="mt-2 text-sm text-slate-600">{invitation.message}</p>
      <div className="mt-4 flex gap-3"><button disabled={saving} onClick={() => void decide('ACCEPT')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Accept invitation'}</button><button disabled={saving} onClick={() => void decide('REJECT')} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-50">Decline</button></div>
    </section> : null}
    <section className="rounded-2xl border border-slate-200 bg-white p-6" aria-labelledby="study-title">
      <div className="flex items-start gap-4"><div className="rounded-xl bg-blue-50 p-3"><FlaskConical className="h-6 w-6 text-blue-600" /></div><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">My clinical trial</p><h2 id="study-title" className="mt-1 text-xl font-semibold text-slate-900">{myStudy?.name || (me?.studyId ? me.studyName : 'Not yet enrolled')}</h2><p className="mt-2 text-sm text-slate-500">{me ? 'Participant ID: ' + me.id : 'Your participant profile will appear here when it is available.'}</p><div className="mt-3"><StatusBadge status={me?.enrollmentStatus || 'not_enrolled'} /></div></div></div>
      {!me?.studyId ? <p className="mt-5 text-sm text-slate-600">Your research team will contact you when a study invitation is available. Enrollment and appointments appear after they are confirmed.</p> : <button onClick={() => onNavigate('my-studies')} className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">View my study</button>}
    </section>
    <div className="grid gap-4 sm:grid-cols-3">
      {[{label:'Appointments', count:myVisits.length, nav:'my-appointments' as NavKey, Icon:Calendar}, {label:'My documents', count:myDocuments.length, nav:'my-documents' as NavKey, Icon:FileText}, {label:'Messages', count:messages.length, nav:'messages' as NavKey, Icon:MessageSquare}].map(({label,count,nav,Icon}) => <button key={nav} onClick={() => onNavigate(nav)} className="rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-blue-300"><Icon className="h-5 w-5 text-blue-600" /><p className="mt-3 text-2xl font-semibold text-slate-900">{count}</p><p className="mt-1 text-sm text-slate-500">{label}</p></button>)}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-semibold text-slate-900">Next appointment</h2>{nextVisit ? <div className="mt-4 space-y-2 text-sm text-slate-600"><p className="font-medium text-slate-900">{nextVisit.type}</p><p>{nextVisit.date} {nextVisit.time}</p><p>{nextVisit.location}</p><StatusBadge status={nextVisit.status} /></div> : <p className="mt-4 text-sm text-slate-500">No upcoming appointments are scheduled.</p>}</section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-semibold text-slate-900">Study documents</h2>{myDocuments.length ? <ul className="mt-4 space-y-3">{myDocuments.slice(0,5).map(doc => { const url = (doc as typeof doc & {file_url?:string}).file_url; return <li key={doc.id} className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-slate-700">{doc.name}</span>{url && /^https?:\/\//i.test(url) ? <a className="text-blue-600 underline" href={url} target="_blank" rel="noopener noreferrer">Open</a> : <span className="text-slate-400">File unavailable</span>}</li>;})}</ul> : <p className="mt-4 text-sm text-slate-500">No documents have been shared with you.</p>}</section>
    </div>
  </div>;
}
