import { useState } from 'react';
import { useTrialBridge } from '@/store/TrialBridgeContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldAlert,
  User,
  ThumbsUp,
  ThumbsDown,
  Info,
  Clock,
  FileSignature,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast as sonnerToast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function ScreeningPage() {
  const { participants, studies, approveScreening, rejectScreening } = useTrialBridge();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'info' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [queueSearch, setQueueSearch] = useState('');
  const [queueFilter, setQueueFilter] = useState<'all' | 'pending' | 'reviewed'>('all');

  const reviewableParticipants = participants.filter(
    (p) => p.screeningStatus === 'potentially_eligible' || p.screeningStatus === 'human_review' || (p.screeningReviewed && p.screeningResults)
  );

  const filteredQueue = reviewableParticipants.filter((p) => {
    const q = queueSearch.trim().toLowerCase();
    const matchesSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.studyName && p.studyName.toLowerCase().includes(q));
    if (!matchesSearch) return false;

    if (queueFilter === 'pending') {
      return p.screeningStatus === 'potentially_eligible' || p.screeningStatus === 'human_review';
    }
    if (queueFilter === 'reviewed') {
      return p.screeningReviewed || p.screeningStatus === 'approved' || p.screeningStatus === 'rejected';
    }
    return true;
  });

  const selected = participants.find((p) => p.id === selectedId) || reviewableParticipants[0] || participants.find(p => p.screeningResults);

  const handleReview = () => {
    if (!selected || !reviewAction) return;
    const reviewerName = 'Dr. James Patel';
    if (reviewAction === 'approve') {
      approveScreening(selected.id, reviewerName, reviewNotes);
      sonnerToast.success('Screening approved', {
        description: `${selected.name} (${selected.id}) is now eligible. Consent document has been sent.`,
      });
    } else if (reviewAction === 'reject') {
      rejectScreening(selected.id, reviewerName, reviewNotes);
      sonnerToast.error('Screening rejected', {
        description: `${selected.name} (${selected.id}) does not meet eligibility criteria.`,
      });
    } else if (reviewAction === 'info') {
      sonnerToast.info('More information requested', {
        description: `Additional information has been requested for ${selected.name} (${selected.id}).`,
      });
    }
    setReviewAction(null);
    setReviewNotes('');
  };

  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Brain className="h-12 w-12 text-slate-300" />
        <p className="mt-4 text-lg font-medium text-slate-700">No participants ready for screening</p>
        <p className="mt-1 text-sm text-slate-400">Participants will appear here once they enter the screening pipeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">AI-Assisted Eligibility Screening</h1>
        <p className="mt-1 text-sm text-slate-500">Review AI recommendations and make final eligibility decisions</p>
      </div>

      {/* Important Warning */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 animate-fade-in">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-800">AI screening is an assistive recommendation only.</p>
          <p className="text-xs text-amber-700">Final eligibility must be determined by a qualified research professional. The AI provides a potentially eligible recommendation with reasoning — it does not make clinical decisions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Participant List */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-4 animate-fade-in flex flex-col h-[650px] max-h-[calc(100vh-12rem)] lg:sticky lg:top-6 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Screening Queue</h2>
              <p className="text-xs text-slate-500">{reviewableParticipants.length} participants</p>
            </div>
            {filteredQueue.length !== reviewableParticipants.length && (
              <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {filteredQueue.length} shown
              </span>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search queue by name or ID..."
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs bg-slate-50/70 border-slate-200 focus:bg-white transition-colors"
            />
            {queueSearch && (
              <button
                onClick={() => setQueueSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 mb-3">
            {(['all', 'pending', 'reviewed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setQueueFilter(filter)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-medium rounded-lg capitalize transition-colors',
                  queueFilter === filter
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                )}
              >
                {filter === 'all' ? 'All' : filter}
              </button>
            ))}
          </div>

          {/* Scrollable list with smooth scrolling */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scroll-smooth overscroll-contain">
            {filteredQueue.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  'w-full rounded-xl p-3 text-left transition-all duration-150 border',
                  selected?.id === p.id 
                    ? 'bg-blue-50/90 border-blue-300 ring-1 ring-blue-300 shadow-xs' 
                    : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold transition-colors",
                    selected?.id === p.id ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-600"
                  )}>
                    {p.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500 truncate">{p.id} · {p.studyName}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <StatusBadge status={p.screeningStatus} />
                  {p.aiConfidence && (
                    <span className={cn('text-xs font-semibold', p.aiConfidence >= 80 ? 'text-green-600' : 'text-amber-600')}>
                      {p.aiConfidence}%
                    </span>
                  )}
                </div>
              </button>
            ))}

            {filteredQueue.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-500">No participants matching criteria</p>
                {(queueSearch || queueFilter !== 'all') && (
                  <button
                    onClick={() => { setQueueSearch(''); setQueueFilter('all'); }}
                    className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Screening Detail */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="space-y-4"
            >
              {/* Participant & Study Info */}
              <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-semibold text-white">
                      {selected.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{selected.name}</h2>
                      <p className="text-sm text-slate-500">{selected.id} · {selected.age} years · {selected.gender}</p>
                    </div>
                  </div>
                  <StatusBadge status={selected.screeningStatus} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Study</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{selected.studyName}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Location</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{selected.location}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Last Activity</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{selected.lastActivity}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Enrollment</p>
                    <p className="mt-0.5"><StatusBadge status={selected.enrollmentStatus} /></p>
                  </div>
                </div>
              </div>

              {/* AI Result */}
              {selected.screeningResults && (
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50">
                        <Brain className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">AI Screening Result</h3>
                        <p className="text-xs text-slate-500">Automated eligibility assessment</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {selected.aiConfidence && (
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Confidence</p>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', selected.aiConfidence >= 80 ? 'bg-green-500' : 'bg-amber-500')}
                                style={{ width: `${selected.aiConfidence}%` }}
                              />
                            </div>
                            <span className={cn('text-sm font-bold', selected.aiConfidence >= 80 ? 'text-green-600' : 'text-amber-600')}>
                              {selected.aiConfidence}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Recommendation Banner */}
                  <div className={cn(
                    'mt-4 flex items-center gap-3 rounded-xl p-4',
                    selected.screeningStatus === 'rejected' ? 'bg-red-50' :
                    selected.screeningStatus === 'approved' ? 'bg-green-50' :
                    selected.aiConfidence && selected.aiConfidence >= 80 ? 'bg-green-50' : 'bg-amber-50'
                  )}>
                    {selected.screeningStatus === 'rejected' ? <XCircle className="h-5 w-5 text-red-600" /> :
                     selected.screeningStatus === 'approved' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                     <AlertCircle className="h-5 w-5 text-amber-600" />}
                    <div>
                      <p className={cn('text-sm font-semibold',
                        selected.screeningStatus === 'rejected' ? 'text-red-800' :
                        selected.screeningStatus === 'approved' ? 'text-green-800' : 'text-amber-800'
                      )}>
                        {selected.screeningStatus === 'rejected' ? 'Not Eligible' :
                         selected.screeningStatus === 'approved' ? 'Approved by Researcher' :
                         'Potentially Eligible'}
                      </p>
                      <p className={cn('text-xs',
                        selected.screeningStatus === 'rejected' ? 'text-red-600' :
                        selected.screeningStatus === 'approved' ? 'text-green-600' : 'text-amber-600'
                      )}>
                        {selected.screeningStatus === 'rejected' ? 'AI recommendation: Not eligible based on criteria' :
                         selected.screeningStatus === 'approved' ? 'Human review completed — participant approved' :
                         'AI recommendation based on eligibility criteria — pending human review'}
                      </p>
                    </div>
                  </div>

                  {/* Criteria Breakdown */}
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Reasoning — Criteria Breakdown</h4>
                    <div className="space-y-2">
                      {selected.screeningResults.map((r) => (
                        <div key={r.criterionId} className={cn(
                          'flex items-start gap-3 rounded-xl border p-3',
                          r.status === 'match' ? 'border-green-100 bg-green-50/30' :
                          r.status === 'review' ? 'border-amber-100 bg-amber-50/30' :
                          'border-red-100 bg-red-50/30'
                        )}>
                          {r.status === 'match' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />}
                          {r.status === 'review' && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                          {r.status === 'mismatch' && <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-800">{r.criterionLabel}</p>
                              <span className={cn(
                                'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                                r.status === 'match' ? 'bg-green-100 text-green-700' :
                                r.status === 'review' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              )}>
                                {r.status === 'match' ? 'MATCH' : r.status === 'review' ? 'REVIEW' : 'MISMATCH'}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">{r.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Human Review Section */}
              {!selected.screeningReviewed ? (
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Human Researcher Verification</h3>
                      <p className="text-xs text-slate-500">Review the AI recommendation and make a final decision</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button onClick={() => setReviewAction('approve')} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                      <ThumbsUp className="h-4 w-4" /> Approve
                    </Button>
                    <Button onClick={() => setReviewAction('reject')} variant="outline" className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50">
                      <ThumbsDown className="h-4 w-4" /> Reject
                    </Button>
                    <Button onClick={() => setReviewAction('info')} variant="outline" className="flex items-center gap-2">
                      <Info className="h-4 w-4" /> Request More Information
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                      {selected.screeningStatus === 'approved' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Review Decision Record</h3>
                      <p className="text-xs text-slate-500">Audit trail of the human review decision</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Decision:</span>
                      <StatusBadge status={selected.screeningStatus} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Reviewer:</span>
                      <span className="font-medium text-slate-800">{selected.screeningReviewedBy}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-medium text-slate-800">{selected.screeningReviewedDate}</span>
                    </div>
                    {selected.screeningNotes && (
                      <div className="mt-2 border-t border-slate-200 pt-2">
                        <p className="text-xs text-slate-500 mb-1">Notes:</p>
                        <p className="text-sm text-slate-700">{selected.screeningNotes}</p>
                      </div>
                    )}
                  </div>
                  {selected.screeningStatus === 'approved' && selected.consentStatus !== 'consented' && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
                      <FileSignature className="h-4 w-4" />
                      Consent document has been automatically sent to the participant.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!reviewAction} onOpenChange={(o) => !o && setReviewAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' && 'Approve Screening'}
              {reviewAction === 'reject' && 'Reject Screening'}
              {reviewAction === 'info' && 'Request More Information'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-semibold text-white">
                {selected.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{selected.name}</p>
                <p className="text-xs text-slate-500">{selected.id} · {selected.studyName}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm">
                {reviewAction === 'approve' ? 'Approval notes (optional)' :
                 reviewAction === 'reject' ? 'Reason for rejection' :
                 'What information is needed?'}
              </Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add your review notes..."
                className="mt-1"
                rows={3}
              />
            </div>
            {reviewAction === 'approve' && (
              <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Approving will update the participant's screening status to "Approved" and automatically send a consent document.</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewAction(null)}>Cancel</Button>
            <Button
              onClick={handleReview}
              className={cn(reviewAction === 'reject' && 'bg-red-600 hover:bg-red-700')}
            >
              {reviewAction === 'approve' && 'Confirm Approval'}
              {reviewAction === 'reject' && 'Confirm Rejection'}
              {reviewAction === 'info' && 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
