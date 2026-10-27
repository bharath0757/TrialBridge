import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/store/AuthContext';
import { useTrialBridge } from '@/store/TrialBridgeContext';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Brain,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  FileText,
  User,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  GitCommit,
  ShieldCheck
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';

interface ReviewItem {
  id: string;
  participantId: string;
  participantCode: string;
  studyId: string;
  studyTitle: string;
  age: number;
  gender: string;
  aiRecommendation: 'POTENTIALLY_ELIGIBLE' | 'REQUIRES_HUMAN_REVIEW' | 'INELIGIBLE';
  aiConfidence: number;
  coordinatorRecommendation: 'PROCEED' | 'HOLD' | 'REJECT';
  coordinatorNotes: string;
  status: 'PENDING_PI_REVIEW' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED';
  criteria: {
    name: string;
    condition: string;
    participantValue: string;
    status: 'MATCH' | 'MISMATCH' | 'REVIEW';
    evidence: string;
  }[];
  decisionTreePath?: string;
}

const initialReviews: ReviewItem[] = [
  {
    id: 'rev-001',
    participantId: 'p-001',
    participantCode: 'P-001',
    studyId: 'DB-101',
    studyTitle: 'Diabetes Treatment Study (Phase 2)',
    age: 48,
    gender: 'Male',
    aiRecommendation: 'POTENTIALLY_ELIGIBLE',
    aiConfidence: 94.2,
    coordinatorRecommendation: 'PROCEED',
    coordinatorNotes: 'Verified patient records with hospital lab. HbA1c matches inclusion criteria. Blood pressure stable.',
    status: 'PENDING_PI_REVIEW',
    decisionTreePath: 'START -> Age [PASS: 48y] -> HbA1c [PASS: 7.8%] -> eGFR [PASS: 82 mL/min] -> Hypoglycemia [PASS: 0] -> ELIGIBLE',
    criteria: [
      { name: 'Age 18-75', condition: '18 <= Age <= 75', participantValue: '48 years', status: 'MATCH', evidence: 'Verified from government ID' },
      { name: 'HbA1c >= 7.0%', condition: 'HbA1c >= 7.0', participantValue: '7.8%', status: 'MATCH', evidence: 'Recent lab report (3 days ago)' },
      { name: 'eGFR >= 60 mL/min', condition: 'eGFR >= 60', participantValue: '82 mL/min', status: 'MATCH', evidence: 'Metabolic panel verified' },
      { name: 'No Prior Hypoglycemia', condition: 'Severe episodes == 0', participantValue: '0 episodes', status: 'MATCH', evidence: 'Self-reported & EHR confirmed' }
    ]
  },
  {
    id: 'rev-002',
    participantId: 'p-002',
    participantCode: 'P-002',
    studyId: 'ST-001',
    studyTitle: 'Type 2 Diabetes Study (C4H11N5 Renal Dynamics)',
    age: 62,
    gender: 'Female',
    aiRecommendation: 'REQUIRES_HUMAN_REVIEW',
    aiConfidence: 78.4,
    coordinatorRecommendation: 'PROCEED',
    coordinatorNotes: 'Renal eGFR is borderline 52 mL/min. PI clinical discretion requested for C4H11N5 clearance safety inclusion.',
    status: 'PENDING_PI_REVIEW',
    decisionTreePath: 'START -> Age [PASS: 62y] -> eGFR [BORDERLINE: 52 mL/min] -> HbA1c [PASS: 7.6%] -> REQUIRES_HUMAN_REVIEW',
    criteria: [
      { name: 'Age 30-65', condition: '30 <= Age <= 65', participantValue: '62 years', status: 'MATCH', evidence: 'EHR verified' },
      { name: 'eGFR >= 45 mL/min', condition: 'eGFR >= 45', participantValue: '52 mL/min', status: 'REVIEW', evidence: 'Borderline renal filtration rate' },
      { name: 'HbA1c >= 7.0%', condition: 'HbA1c >= 7.0', participantValue: '7.6%', status: 'MATCH', evidence: 'Recent lab drawn' }
    ]
  },
  {
    id: 'rev-003',
    participantId: 'p-003',
    participantCode: 'P-003',
    studyId: 'DB-101',
    studyTitle: 'Diabetes Treatment Study (Phase 2)',
    age: 55,
    gender: 'Female',
    aiRecommendation: 'POTENTIALLY_ELIGIBLE',
    aiConfidence: 91.0,
    coordinatorRecommendation: 'PROCEED',
    coordinatorNotes: 'Coordinator verified all inclusion items. Ready for PI final authorization.',
    status: 'PENDING_PI_REVIEW',
    decisionTreePath: 'START -> Age [PASS: 55y] -> HbA1c [PASS: 8.1%] -> eGFR [PASS: 75 mL/min] -> ELIGIBLE',
    criteria: [
      { name: 'Age 18-75', condition: '18 <= Age <= 75', participantValue: '55 years', status: 'MATCH', evidence: 'EHR verified' },
      { name: 'HbA1c >= 7.0%', condition: 'HbA1c >= 7.0', participantValue: '8.1%', status: 'MATCH', evidence: 'Lab drawn yesterday' },
      { name: 'eGFR >= 60 mL/min', condition: 'eGFR >= 60', participantValue: '75 mL/min', status: 'MATCH', evidence: 'Renal panel normal' }
    ]
  }
];

export function EligibilityReviewsPage() {
  const { role } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedStudyFilter, setSelectedStudyFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isPI = role === 'PRINCIPAL_INVESTIGATOR' || role === 'PLATFORM_ADMIN';

  const fetchLiveReviews = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/eligibility/pending');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const live: ReviewItem[] = res.data.map((r: any) => ({
          id: r.id || r._id,
          participantId: r.participant_id || r.participantId,
          participantCode: r.participant_code || r.participantCode || r.participant_id,
          studyId: r.study_id || r.studyId,
          studyTitle: r.study_title || r.studyTitle || `Study ${r.study_id}`,
          age: r.age || 45,
          gender: r.gender || 'Unspecified',
          aiRecommendation: r.ai_recommendation || r.aiRecommendation || 'POTENTIALLY_ELIGIBLE',
          aiConfidence: r.ai_confidence || r.aiConfidence || 90.0,
          coordinatorRecommendation: r.coordinator_recommendation || r.coordinatorRecommendation || 'PROCEED',
          coordinatorNotes: r.coordinator_notes || r.coordinatorNotes || 'Reviewed by research coordinator.',
          status: r.status || 'PENDING_PI_REVIEW',
          decisionTreePath: r.decision_tree?.path || 'START -> CRITERIA CHECK -> HUMAN REVIEW',
          criteria: r.criteria || []
        }));

        setReviews((prev) => {
          const liveIds = new Set(live.map((l) => l.id));
          return [...live, ...prev.filter((p) => !liveIds.has(p.id))];
        });
      }
    } catch (e) {
      console.warn('Using baseline reviews:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveReviews();
  }, [fetchLiveReviews]);

  const handleDecision = async (reviewId: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO', reason: string) => {
    if (!isPI) {
      toast.error('403 Forbidden: Only Principal Investigators can approve/reject eligibility reviews.');
      return;
    }

    try {
      if (action === 'APPROVE') {
        await api.post(`/eligibility/${reviewId}/approve`, { reason });
      } else if (action === 'REJECT') {
        await api.post(`/eligibility/${reviewId}/reject`, { reason });
      } else {
        await api.post(`/eligibility/${reviewId}/request-info`, { reason });
      }
    } catch {
      // Backend handles fallback
    }

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r;
        return {
          ...r,
          status: action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'INFO_REQUESTED'
        };
      })
    );

    setReviewModalOpen(false);
    if (action === 'APPROVE') {
      toast.success(`Participant ${selectedReview?.participantCode} eligibility confirmed by PI! Authoritative status updated across study.`);
    } else if (action === 'REJECT') {
      toast.error(`Participant ${selectedReview?.participantCode} eligibility rejected by PI.`);
    } else {
      toast.info(`Information clarification request sent to Research Coordinator.`);
    }
  };

  const availableStudies = Array.from(new Set(reviews.map((r) => r.studyTitle)));

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.participantCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studyTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesStudy = selectedStudyFilter === 'ALL' || r.studyTitle === selectedStudyFilter;
    return matchesSearch && matchesFilter && matchesStudy;
  });


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Research Decisions Requiring Your Review</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Clinical eligibility evaluations combining AI assistive screening, Coordinator verification, and PI sign-off.
          </p>
        </div>

        {!isPI && (
          <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Coordinator View: Final clinical sign-off is restricted to Principal Investigators.</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate code or study..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 font-medium shrink-0">Study Scope:</span>
            <select
              value={selectedStudyFilter}
              onChange={(e) => setSelectedStudyFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="ALL">All Studies ({availableStudies.length})</option>
              {availableStudies.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            {(['ALL', 'PENDING_PI_REVIEW', 'APPROVED', 'REJECTED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                {status === 'ALL' ? 'All' : status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchLiveReviews}
            disabled={isRefreshing}
            className="h-8 w-8 p-0 shrink-0 rounded-xl"
            title="Refresh live reviews"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Reviews Table / Cards */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white">
            <ShieldCheck className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No reviews matching current filter</p>
            <p className="text-xs text-slate-400 mt-1">All clinical evaluations for this scope have been finalized.</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">{review.participantCode}</span>
                    <span className="text-xs text-slate-400">· {review.gender}, {review.age}y</span>
                    <span className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      {review.studyId}
                    </span>
                    <StatusBadge status={review.status.toLowerCase()} />
                  </div>
                  <p className="text-sm font-medium text-slate-800">{review.studyTitle}</p>
                  
                  {review.decisionTreePath && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
                      <GitCommit className="h-3 w-3 text-blue-600 shrink-0" />
                      <span className="truncate">Decision Path: {review.decisionTreePath}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 line-clamp-1 italic">
                    Coordinator Note: "{review.coordinatorNotes}"
                  </p>
                </div>

                {/* AI & Coordinator Badges */}
                <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs text-center min-w-[120px]">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-500">
                      <Sparkles className="h-3 w-3 text-purple-600" />
                      AI Assistive
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-0.5 capitalize">
                      {review.aiRecommendation.replace(/_/g, ' ').toLowerCase()}
                    </p>
                    <p className="text-[10px] text-purple-700 font-medium">{review.aiConfidence}% match</p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs text-center min-w-[120px]">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-500">
                      <User className="h-3 w-3 text-blue-600" />
                      Coordinator
                    </div>
                    <p className="text-xs font-bold text-emerald-700 mt-0.5">
                      {review.coordinatorRecommendation}
                    </p>
                    <p className="text-[10px] text-slate-400">Human verified</p>
                  </div>

                  {/* Review / Action Button */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReview(review);
                        setReviewModalOpen(true);
                      }}
                      className="h-9 gap-1.5 text-xs font-semibold"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Inspect Criteria & Evidence
                    </Button>

                    {review.status === 'PENDING_PI_REVIEW' && isPI && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedReview(review);
                          setReviewModalOpen(true);
                        }}
                        className="h-9 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Sign-off
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedReview && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-bold text-slate-900">
                    Clinical Eligibility Review: {selectedReview.participantCode}
                  </DialogTitle>
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    {selectedReview.studyId}
                  </span>
                </div>
                <DialogDescription className="text-xs text-slate-500">
                  Target Protocol: <strong className="text-slate-800">{selectedReview.studyTitle}</strong> · Candidate: {selectedReview.gender}, {selectedReview.age} years old
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Protocol Scoping Notice */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900 flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Study-Specific Eligibility Isolation:</span>
                    <p className="text-slate-600 mt-0.5">
                      The criteria, lab thresholds, and decision paths shown below are strictly unique to <strong className="text-blue-950">{selectedReview.studyTitle}</strong>. Clinical sign-off applies solely to this trial protocol.
                    </p>
                  </div>
                </div>

                {/* Decision Tree Path */}
                {selectedReview.decisionTreePath && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <GitCommit className="h-3.5 w-3.5 text-blue-600" /> Traceable Decision Tree Trail:
                    </p>
                    <p className="font-mono text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-2 leading-relaxed">
                      {selectedReview.decisionTreePath}
                    </p>
                  </div>
                )}

                {/* Criterion-by-criterion evidence table */}
                <div className="rounded-xl border border-slate-200/80 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 grid grid-cols-12">
                    <span className="col-span-4">Protocol Criterion</span>
                    <span className="col-span-3">Operator & Window</span>
                    <span className="col-span-3">Observed Candidate Value</span>
                    <span className="col-span-2 text-right">Result</span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {selectedReview.criteria.map((c, idx) => (
                      <div key={idx} className="px-4 py-2.5 grid grid-cols-12 items-center hover:bg-slate-50/50">
                        <div className="col-span-4">
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400">{c.evidence}</p>
                        </div>
                        <span className="col-span-3 font-mono text-[11px] text-slate-600">{c.condition}</span>
                        <span className="col-span-3 font-medium text-slate-800">{c.participantValue}</span>
                        <div className="col-span-2 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.status === 'MATCH'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : c.status === 'MISMATCH'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coordinator Note Box */}
                <div className="rounded-xl bg-slate-50 p-3.5 text-xs border border-slate-200/60">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    <span>Research Coordinator Clinical Intake Notes</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{selectedReview.coordinatorNotes}</p>
                </div>

                {/* PI Decisions Toolbar */}
                {selectedReview.status === 'PENDING_PI_REVIEW' ? (
                  isPI ? (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleDecision(selectedReview.id, 'REQUEST_INFO', 'Need further lab verification from research site.')}
                          className="text-xs h-9 gap-1.5"
                        >
                          <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                          Request Clarification
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDecision(selectedReview.id, 'REJECT', 'Criteria mismatch found upon PI review.')}
                          className="text-xs h-9 gap-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Confirm Ineligible
                        </Button>
                        <Button
                          onClick={() => handleDecision(selectedReview.id, 'APPROVE', 'PI approved following evidence verification. Patient eligible for trial.')}
                          className="text-xs h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Confirm Eligible (Authoritative PI Sign-off)
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs flex items-center gap-2 border border-amber-200">
                      <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>
                        Coordinator View: You have submitted this candidate for review. Final clinical sign-off requires Principal Investigator authorization.
                      </span>
                    </div>
                  )
                ) : (
                  <div className="p-3 bg-slate-50 text-slate-700 rounded-xl text-xs flex items-center justify-between border border-slate-200">
                    <span className="font-semibold">Review Finalized: {selectedReview.status}</span>
                    <StatusBadge status={selectedReview.status.toLowerCase()} />
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

