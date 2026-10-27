import { useState } from 'react';
import { useTrialBridge } from '@/store/TrialBridgeContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Search,
  Users,
  ChevronRight,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FlaskConical,
  Brain,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  Activity,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Participant } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ParticipantsPageProps {
  title?: string;
  description?: string;
  initialStatusFilter?: string;
}

export function ParticipantsPage({
  title = 'Participants',
  description = 'Manage and track study participants',
  initialStatusFilter = 'all',
}: ParticipantsPageProps = {}) {
  const { participants, studies, visits, tasks, consentRecords, documents } = useTrialBridge();
  const [search, setSearch] = useState('');
  const [studyFilter, setStudyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [selected, setSelected] = useState<Participant | null>(null);

  const filtered = participants.filter(
    (p) =>
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())) &&
      (studyFilter === 'all' || p.studyId === studyFilter) &&
      (statusFilter === 'all' || p.screeningStatus === statusFilter)
  );

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={studyFilter} onValueChange={setStudyFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filter by study" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Studies</SelectItem>
            {studies.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Screening status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="candidate">Candidate</SelectItem>
            <SelectItem value="screening">Screening</SelectItem>
            <SelectItem value="potentially_eligible">Potentially Eligible</SelectItem>
            <SelectItem value="human_review">Human Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                <th className="px-4 py-3 text-left font-medium">Participant ID</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Age</th>
                <th className="px-4 py-3 text-left font-medium">Dose Cohort</th>
                <th className="px-4 py-3 text-left font-medium">HbA1c & Renal Clear.</th>
                <th className="px-4 py-3 text-left font-medium">Screening</th>
                <th className="px-4 py-3 text-left font-medium">Consent</th>
                <th className="px-4 py-3 text-left font-medium">Enrollment</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setSelected(p)}
                >
                  <td className="px-4 py-3 text-xs font-mono font-bold text-slate-800">{p.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700">
                        {p.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{p.age}y · {p.gender}</td>
                  <td className="px-4 py-3">
                    {p.clinicalData ? (
                      <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-bold text-blue-800">
                        {p.clinicalData.doseMg} mg
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {p.clinicalData ? (
                      <div>
                        <span className="font-semibold text-slate-800">{p.clinicalData.baselineHba1c}%</span>
                        <span className="text-slate-400 mx-1">→</span>
                        <span className="font-bold text-emerald-600">{p.clinicalData.week12Hba1c}%</span>
                        <span className="text-[10px] text-slate-400 block">{p.clinicalData.renalExcretion}% renal exc.</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.screeningStatus} /></td>
                  <td className="px-4 py-3"><StatusBadge status={p.consentStatus} /></td>
                  <td className="px-4 py-3"><StatusBadge status={p.enrollmentStatus} /></td>
                  <td className="px-4 py-3"><ChevronRight className="h-4 w-4 text-slate-300" /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-400">No participants found</p>
          </div>
        )}
      </div>

      {/* Participant Detail Sheet */}
      <ParticipantDetailSheet
        participant={selected}
        onClose={() => setSelected(null)}
        visits={selected ? visits.filter(v => v.participantId === selected.id) : []}
        tasks={selected ? tasks.filter(t => t.participantId === selected.id) : []}
        consent={selected ? consentRecords.find(c => c.participantId === selected.id) : null}
        docs={selected ? documents.filter(d => d.participantId === selected.id) : []}
        study={selected ? studies.find(s => s.id === selected.studyId) : null}
      />
    </div>
  );
}

function ParticipantDetailSheet({ participant, onClose, visits, tasks, consent, docs, study }: {
  participant: Participant | null;
  onClose: () => void;
  visits: any[];
  tasks: any[];
  consent: any;
  docs: any[];
  study: any;
}) {
  return (
    <Sheet open={!!participant} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {participant && (
          <>
            <SheetHeader>
              <SheetTitle className="text-xl">Participant Profile</SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Basic Info */}
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-lg font-semibold text-white">
                  {participant.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-900">{participant.name}</h2>
                  <p className="text-sm text-slate-500">{participant.id} · {participant.age} years · {participant.gender}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={participant.screeningStatus} />
                    <StatusBadge status={participant.consentStatus} />
                    <StatusBadge status={participant.enrollmentStatus} />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{participant.email}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{participant.phone}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{participant.location}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{participant.enrolledDate ? `Enrolled: ${participant.enrolledDate}` : 'Not enrolled'}</span>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="clinical">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="clinical">PK/PD & Biomarkers</TabsTrigger>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="screening">Screening</TabsTrigger>
                  <TabsTrigger value="visits">Visits</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                {participant.clinicalData && (
                  <TabsContent value="clinical" className="space-y-4">
                    {/* Glycemic Efficacy Card */}
                    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                          <Activity className="h-4 w-4 text-blue-600" />
                          Glycemic Efficacy Response
                        </h4>
                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                          {participant.clinicalData.doseMg} mg/day Cohort
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white border border-slate-200/80">
                          <p className="text-[11px] text-slate-500 font-medium">HbA1c Reduction</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-base font-bold text-slate-900">{participant.clinicalData.baselineHba1c}%</span>
                            <span className="text-xs text-slate-400">→</span>
                            <span className="text-base font-bold text-emerald-600">{participant.clinicalData.week12Hba1c}%</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 mt-0.5 block">
                            Change: {participant.clinicalData.hba1cChange}%
                          </span>
                        </div>

                        <div className="p-3 rounded-lg bg-white border border-slate-200/80">
                          <p className="text-[11px] text-slate-500 font-medium">Fasting Plasma Glucose (FPG)</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-base font-bold text-slate-900">{participant.clinicalData.baselineFpg}</span>
                            <span className="text-xs text-slate-400">→</span>
                            <span className="text-base font-bold text-emerald-600">{participant.clinicalData.week12Fpg}</span>
                            <span className="text-[10px] text-slate-400">mg/dL</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 mt-0.5 block">
                            Change: {participant.clinicalData.fpgChange} mg/dL
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pharmacokinetics Grid */}
                    <div className="rounded-xl border border-slate-200/80 p-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <FlaskConical className="h-4 w-4 text-purple-600" />
                        Pharmacokinetic (PK) Profile
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-500 block">Peak Plasma (Cmax)</span>
                          <span className="font-bold text-slate-900">{participant.clinicalData.cmax} ng/mL</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-500 block">Time to Peak (Tmax)</span>
                          <span className="font-bold text-slate-900">{participant.clinicalData.tmax} hrs</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-500 block">Exposure (AUC 0-24)</span>
                          <span className="font-bold text-slate-900">{participant.clinicalData.auc024} ng·h/mL</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-500 block">Total Clearance</span>
                          <span className="font-bold text-slate-900">{participant.clinicalData.clearanceLh} L/h</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-500 block">Elimination Half-Life</span>
                          <span className="font-bold text-slate-900">{participant.clinicalData.halfLifeH} hrs</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-500 block">Bioavailability (F)</span>
                          <span className="font-bold text-slate-900">{participant.clinicalData.bioavailability}%</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-500 block">Dist. Volume (Vd)</span>
                          <span className="font-bold text-slate-900">{participant.clinicalData.vdLkg} L/kg</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-500 block">Protein Binding</span>
                          <span className="font-bold text-slate-900">{participant.clinicalData.proteinBinding}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Renal & Metabolism */}
                    <div className="rounded-xl border border-red-100 bg-red-50/20 p-4 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-red-600" />
                        Renal Excretion & Metabolism
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-white border border-red-100">
                          <span className="text-[10px] text-slate-500 block">Renal Excretion</span>
                          <span className="font-bold text-red-600 text-sm">{participant.clinicalData.renalExcretion}%</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Dominant Route</span>
                          <span className="font-semibold text-slate-800">{participant.clinicalData.dominantRoute}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Primary Enzyme</span>
                          <span className="font-semibold text-slate-800">{participant.clinicalData.primaryEnzyme}</span>
                        </div>
                      </div>
                    </div>

                    {/* Safety Assessment */}
                    <div className="rounded-xl border border-slate-200/80 p-4 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Safety & Adverse Event Status</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-500 block">Liver ALT</span>
                          <span className="font-bold text-slate-900">{participant.clinicalData.alt} U/L (Normal)</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-500 block">Liver AST</span>
                          <span className="font-bold text-slate-900">{participant.clinicalData.ast} U/L (Normal)</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-500 block">Hypoglycemia Event</span>
                          <span className={cn('font-bold', participant.clinicalData.hypoglycemiaEvent ? 'text-amber-600' : 'text-emerald-600')}>
                            {participant.clinicalData.hypoglycemiaEvent ? 'Reported (Mild)' : 'None'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50">
                          <span className="text-[10px] text-slate-500 block">Adverse Event</span>
                          <span className={cn('font-bold', participant.clinicalData.adverseEvent ? 'text-red-600' : 'text-emerald-600')}>
                            {participant.clinicalData.adverseEvent ? `Reported (${participant.clinicalData.aeSeverity})` : 'None'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="overview" className="space-y-3">
                  <div className="rounded-xl border border-slate-100 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Study Information</h3>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FlaskConical className="h-4 w-4 text-slate-400" /> {participant.studyName}
                      </div>
                      {study && (
                        <>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="h-4 w-4 text-slate-400" /> {study.researchSite}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Activity className="h-4 w-4 text-slate-400" /> {study.phase} · {study.condition}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {consent && (
                    <div className="rounded-xl border border-slate-100 p-4">
                      <h3 className="text-sm font-semibold text-slate-900">Consent</h3>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-slate-400">Version:</span> <span className="text-slate-700 font-medium">{consent.consentVersion}</span></div>
                        <div><span className="text-slate-400">Status:</span> <StatusBadge status={consent.status} /></div>
                        <div><span className="text-slate-400">Sent:</span> <span className="text-slate-700">{consent.dateSent}</span></div>
                        <div><span className="text-slate-400">Signed:</span> <span className="text-slate-700">{consent.dateSigned || '—'}</span></div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-100 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Documents ({docs.length})</h3>
                    <div className="mt-3 space-y-2">
                      {docs.length > 0 ? docs.map((d) => (
                        <div key={d.id} className="flex items-center gap-2 text-sm text-slate-600">
                          <FileText className="h-4 w-4 text-slate-400" /> {d.name}
                        </div>
                      )) : <p className="text-xs text-slate-400">No documents</p>}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="screening" className="space-y-3">
                  {participant.screeningResults ? (
                    <>
                      <div className="rounded-xl border border-slate-100 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-purple-600" />
                            <h3 className="text-sm font-semibold text-slate-900">AI Screening Results</h3>
                          </div>
                          {participant.aiConfidence && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">Confidence</span>
                              <span className={cn('rounded-lg px-2 py-0.5 text-sm font-bold', participant.aiConfidence >= 80 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>
                                {participant.aiConfidence}%
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 space-y-2">
                          {participant.screeningResults.map((r) => (
                            <div key={r.criterionId} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5">
                              {r.status === 'match' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />}
                              {r.status === 'review' && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                              {r.status === 'mismatch' && <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
                              <div>
                                <p className="text-sm font-medium text-slate-800">{r.criterionLabel}</p>
                                <p className="text-xs text-slate-500">{r.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {participant.screeningReviewed && (
                        <div className="rounded-xl border border-slate-100 p-4">
                          <h3 className="text-sm font-semibold text-slate-900">Human Review Decision</h3>
                          <div className="mt-3 space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">Decision:</span>
                              <StatusBadge status={participant.screeningStatus} />
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <span className="text-slate-400">Reviewer:</span> {participant.screeningReviewedBy}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <span className="text-slate-400">Date:</span> {participant.screeningReviewedDate}
                            </div>
                            {participant.screeningNotes && (
                              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{participant.screeningNotes}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border border-slate-100 p-8 text-center">
                      <Brain className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-sm text-slate-400">No screening results yet</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="visits" className="space-y-2">
                  {visits.length > 0 ? visits.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-50">
                        <span className="text-[9px] text-slate-400">{v.date.split('-')[1]}</span>
                        <span className="text-sm font-bold text-slate-800">{v.date.split('-')[2]}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">{v.type}</p>
                        <p className="text-xs text-slate-500">{v.time} · {v.location}</p>
                      </div>
                      <StatusBadge status={v.status} />
                    </div>
                  )) : <p className="text-sm text-slate-400 py-4 text-center">No visits scheduled</p>}
                </TabsContent>

                <TabsContent value="timeline" className="space-y-2">
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200" />
                    {[
                      { label: 'Registered as candidate', date: '2026-07-15', icon: Users, color: 'bg-slate-100 text-slate-500' },
                      { label: 'AI screening completed', date: '2026-08-05', icon: Brain, color: 'bg-purple-50 text-purple-600' },
                      ...(participant.screeningReviewed ? [{ label: `Screening ${participant.screeningStatus}`, date: participant.screeningReviewedDate || '', icon: CheckCircle2, color: 'bg-green-50 text-green-600' }] : []),
                      ...(participant.consentStatus === 'consented' ? [{ label: 'Consent signed', date: consent?.dateSigned || '', icon: FileText, color: 'bg-blue-50 text-blue-600' }] : []),
                      ...(participant.enrollmentStatus === 'enrolled' ? [{ label: 'Enrolled in study', date: participant.enrolledDate || '', icon: CheckCircle2, color: 'bg-green-50 text-green-600' }] : []),
                    ].map((event, i) => (
                      <div key={i} className="relative mb-4">
                        <div className={cn('absolute -left-4 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white', event.color)}>
                          <event.icon className="h-3 w-3" />
                        </div>
                        <p className="text-sm text-slate-800">{event.label}</p>
                        <p className="text-xs text-slate-400">{event.date}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
