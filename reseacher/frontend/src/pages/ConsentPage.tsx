import { useTrialBridge } from '@/store/TrialBridgeContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  FileSignature,
  Eye,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
} from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ConsentRecord } from '@/types';
import { cn } from '@/lib/utils';

const consentSteps: { status: string; label: string; icon: any }[] = [
  { status: 'not_started', label: 'Not Started', icon: FileText },
  { status: 'sent', label: 'Sent', icon: Clock },
  { status: 'viewed', label: 'Viewed', icon: Eye },
  { status: 'pending', label: 'Pending Signature', icon: FileSignature },
  { status: 'consented', label: 'Consented', icon: CheckCircle2 },
];

export function ConsentPage() {
  const { consentRecords, participants, updateConsentStatus } = useTrialBridge();
  const [selected, setSelected] = useState<ConsentRecord | null>(null);

  const stats = {
    notStarted: consentRecords.filter(c => c.status === 'not_started').length,
    sent: consentRecords.filter(c => c.status === 'sent').length,
    viewed: consentRecords.filter(c => c.status === 'viewed').length,
    pending: consentRecords.filter(c => c.status === 'pending').length,
    consented: consentRecords.filter(c => c.status === 'consented').length,
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Consent Management</h1>
        <p className="mt-1 text-sm text-slate-500">Track informed consent across participants and studies</p>
      </div>

      {/* Status flow cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {consentSteps.map((step, i) => (
          <div key={step.status} className="rounded-xl border border-slate-200/60 bg-white p-4 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg',
              step.status === 'consented' ? 'bg-green-50' :
              step.status === 'not_started' ? 'bg-slate-100' : 'bg-blue-50'
            )}>
              <step.icon className={cn('h-4.5 w-4.5',
                step.status === 'consented' ? 'text-green-600' :
                step.status === 'not_started' ? 'text-slate-400' : 'text-blue-600'
              )} style={{ width: '1.125rem', height: '1.125rem' }} />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{stats[step.status as keyof typeof stats] || 0}</p>
            <p className="text-xs text-slate-500">{step.label}</p>
          </div>
        ))}
      </div>

      {/* Consent records table */}
      <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden animate-fade-in">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-base font-semibold text-slate-900">Consent Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                <th className="px-4 py-3 text-left font-medium">Participant</th>
                <th className="px-4 py-3 text-left font-medium">Study</th>
                <th className="px-4 py-3 text-left font-medium">Version</th>
                <th className="px-4 py-3 text-left font-medium">Sent</th>
                <th className="px-4 py-3 text-left font-medium">Viewed</th>
                <th className="px-4 py-3 text-left font-medium">Signed</th>
                <th className="px-4 py-3 text-left font-medium">Researcher</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {consentRecords.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setSelected(c)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                        {c.participantName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{c.participantName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{c.studyName}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{c.consentVersion}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.dateSent}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.dateViewed || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.dateSigned || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.researcher}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3"><Eye className="h-4 w-4 text-slate-300" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consent Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Consent Detail</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Consent workflow visualization */}
              <div className="flex items-center gap-1">
                {consentSteps.map((step, i) => {
                  const currentIndex = consentSteps.findIndex(s => s.status === selected.status);
                  const isPassed = i <= currentIndex;
                  return (
                    <div key={step.status} className="flex items-center gap-1 flex-1">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                        isPassed ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'
                      )}>
                        <step.icon className="h-4 w-4" />
                      </div>
                      {i < consentSteps.length - 1 && (
                        <div className={cn('h-0.5 flex-1 rounded', isPassed && i < currentIndex ? 'bg-blue-500' : 'bg-slate-200')} />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Participant</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{selected.participantName}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Study</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{selected.studyName}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Consent Version</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{selected.consentVersion}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Researcher</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{selected.researcher}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Date Sent</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{selected.dateSent}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Date Signed</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{selected.dateSigned || 'Pending'}</p>
                </div>
              </div>

              {/* Document preview placeholder */}
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
                <FileText className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm text-slate-400">Consent Form {selected.consentVersion}</p>
                <p className="text-xs text-slate-400">Document preview will be displayed here</p>
              </div>

              {/* Actions */}
              {selected.status === 'viewed' && (
                <Button onClick={() => { updateConsentStatus(selected.participantId, 'consented'); setSelected(null); }} className="w-full">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Consented
                </Button>
              )}
              {selected.status === 'sent' && (
                <Button onClick={() => { updateConsentStatus(selected.participantId, 'viewed'); setSelected(null); }} className="w-full">
                  <Eye className="h-4 w-4 mr-2" /> Mark as Viewed
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
