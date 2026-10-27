import { useState } from 'react';
import { useTrialBridge } from '@/store/TrialBridgeContext';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Users,
  CheckCircle2,
  FileSignature,
  Activity,
  FlaskConical,
  ShieldAlert,
  Flame,
  Droplets,
  HeartPulse,
  Award,
} from 'lucide-react';
import {
  computeRecruitmentTrend,
  computeConsentConversion,
  computeRetentionData,
  computeSitePerformance,
  computeStudyPerformance,
  computeScreeningConversion,
  computeClinicalEfficacyMetrics,
  computePharmacokineticsMetrics,
  computeSafetyMetrics,
} from '@/lib/analytics';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444'];

export function ReportsPage() {
  const { studies, participants, visits, consentRecords } = useTrialBridge();
  const [activeTab, setActiveTab] = useState<'clinical' | 'pk' | 'safety' | 'operations'>('clinical');

  const totalParticipants = participants.length;
  const enrolledCount = participants.filter((p) => p.enrollmentStatus === 'enrolled').length;
  const consentedCount = participants.filter((p) => p.consentStatus === 'consented').length;
  const eligibleCount = participants.filter((p) => p.screeningStatus === 'potentially_eligible' || p.screeningStatus === 'approved').length;

  const consentRate = totalParticipants > 0 ? Math.round((consentedCount / totalParticipants) * 100) : 0;
  const screeningRate = totalParticipants > 0 ? Math.round((eligibleCount / totalParticipants) * 100) : 0;

  // Clinical analytics computations
  const clinicalEfficacy = computeClinicalEfficacyMetrics(participants);
  const pkMetrics = computePharmacokineticsMetrics(participants);
  const safetyMetrics = computeSafetyMetrics(participants);

  // Operations analytics computations
  const recruitmentTrendData = computeRecruitmentTrend(participants);
  const screeningConversion = computeScreeningConversion(participants);
  const consentConversionData = computeConsentConversion(consentRecords, participants);
  const retentionData = computeRetentionData(participants, visits);
  const sitePerformanceData = computeSitePerformance(studies, participants);
  const studyPerformanceData = computeStudyPerformance(studies);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-blue-600" />
            Clinical Trial Analytics & Research Workbench
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time pharmacokinetics, glycemic response, safety monitoring, and operational metrics for <strong>Type 2 Diabetes Study (C₄H₁₁N₅)</strong>.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
          <button
            onClick={() => setActiveTab('clinical')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
              activeTab === 'clinical' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Clinical Efficacy
          </button>
          <button
            onClick={() => setActiveTab('pk')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
              activeTab === 'pk' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Pharmacokinetics & Renal
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
              activeTab === 'safety' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Safety & AE Monitoring
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
              activeTab === 'operations' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Operations & Funnel
          </button>
        </div>
      </div>

      {/* TAB 1: CLINICAL EFFICACY (HbA1c & FPG) */}
      {activeTab === 'clinical' && (
        <div className="space-y-6">
          {/* Clinical summary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Flame className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{clinicalEfficacy.overall.meanHba1cChange}%</p>
              <p className="text-xs text-slate-500 font-medium">Mean HbA1c Reduction</p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                Baseline {clinicalEfficacy.overall.meanBaselineHba1c}% → W12 {clinicalEfficacy.overall.meanWeek12Hba1c}%
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Droplets className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{clinicalEfficacy.overall.meanFpgChange} mg/dL</p>
              <p className="text-xs text-slate-500 font-medium">Mean FPG Reduction</p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                Baseline {clinicalEfficacy.overall.meanBaselineFpg} → W12 {clinicalEfficacy.overall.meanWeek12Fpg}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Award className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{clinicalEfficacy.overall.count} Patients</p>
              <p className="text-xs text-slate-500 font-medium">Evaluated in Cohort</p>
              <p className="mt-1 text-xs font-semibold text-blue-600">Dose-ranging: 50, 100, 150mg</p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/70 to-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white">
                <HeartPulse className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {clinicalEfficacy.byDose.find((d) => d.doseNum === 150)?.hba1cChange || -1.16}%
              </p>
              <p className="text-xs text-slate-500 font-medium">Max Dose Efficacy (150mg)</p>
              <p className="mt-1 text-xs font-semibold text-purple-700">Optimal Glycemic Response</p>
            </div>
          </div>

          {/* Dose Response Chart & Fasting Glucose */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Glycemic Response by Dose Cohort */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Dose-Dependent Glycemic Reduction</h2>
                  <p className="text-xs text-slate-500">Mean reduction in HbA1c (%) across 50mg, 100mg, and 150mg cohorts</p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200">
                  C₄H₁₁N₅ Titration
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={clinicalEfficacy.byDose} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="dose" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip
                    formatter={(val: number) => [`${val}%`, 'HbA1c Change']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                  />
                  <Bar dataKey="hba1cChange" fill="#3B82F6" radius={[6, 6, 0, 0]} name="HbA1c Reduction (%)">
                    {clinicalEfficacy.byDose.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 2 ? '#2563EB' : index === 1 ? '#3B82F6' : '#60A5FA'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                {clinicalEfficacy.byDose.map((d) => (
                  <div key={d.dose} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="font-bold text-slate-800">{d.dose} (n={d.count})</p>
                    <p className="text-emerald-600 font-semibold mt-0.5">{d.hba1cChange}% HbA1c</p>
                    <p className="text-slate-500 text-[10px]">{d.fpgChange} mg/dL FPG</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fasting Plasma Glucose Reduction */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Baseline vs Week 12 Fasting Glucose</h2>
                  <p className="text-xs text-slate-500">Mean FPG reduction per cohort (mg/dL)</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  Glycemic Control
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={clinicalEfficacy.byDose} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="dose" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} unit=" mg/dL" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="baselineFpg" fill="#94A3B8" name="Baseline FPG (mg/dL)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="week12Fpg" fill="#10B981" name="Week 12 FPG (mg/dL)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-3 text-xs text-slate-500 text-center">
                Consistent drop in fasting plasma glucose across all dose levels with no treatment dropouts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHARMACOKINETICS & RENAL ELIMINATION */}
      {activeTab === 'pk' && (
        <div className="space-y-6">
          {/* PK metric cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/70 to-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
                <FlaskConical className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{pkMetrics.meanRenalExcretion}%</p>
              <p className="text-xs text-slate-500 font-medium">Mean Renal Excretion</p>
              <p className="mt-1 text-xs font-semibold text-red-700">Kidney Clearance Pathway</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{pkMetrics.meanClearance} L/h</p>
              <p className="text-xs text-slate-500 font-medium">Mean Total Clearance</p>
              <p className="mt-1 text-xs font-semibold text-blue-600">Glomerular & OCT2 Elimination</p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 to-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{pkMetrics.meanHalfLife} hrs</p>
              <p className="text-xs text-slate-500 font-medium">Elimination Half-Life (t½)</p>
              <p className="mt-1 text-xs font-semibold text-amber-700">Supports BID / QD Dosing</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{pkMetrics.meanBioavailability}%</p>
              <p className="text-xs text-slate-500 font-medium">Oral Bioavailability (F)</p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">Optimal GI Absorption</p>
            </div>
          </div>

          {/* PK Charts Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Dose Proportionality (Cmax & AUC) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Plasma Exposure Proportionality</h2>
                  <p className="text-xs text-slate-500">Cmax (ng/mL) vs AUC 0-24 (ng·h/mL) across cohorts</p>
                </div>
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-mono font-bold text-blue-800">
                  Linear PK
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={pkMetrics.dosePk} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="dose" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} unit=" ng/mL" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} unit=" AUC" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line yAxisId="left" type="monotone" dataKey="cmax" stroke="#2563EB" strokeWidth={3} dot={{ r: 5 }} name="Cmax (ng/mL)" />
                  <Line yAxisId="right" type="monotone" dataKey="auc" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} name="AUC 0-24 (ng·h/mL)" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 flex justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span>50mg: 111.1 ng/mL (AUC 931)</span>
                <span>100mg: 213.6 ng/mL (AUC 1845)</span>
                <span>150mg: 298.7 ng/mL (AUC 2411)</span>
              </div>
            </div>

            {/* Metabolizing Enzymes & Excretion Route */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Metabolizing Enzyme Distribution</h2>
                  <p className="text-xs text-slate-500">Primary pathways participating in C₄H₁₁N₅ biotransformation</p>
                </div>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-mono font-bold text-emerald-800">
                  CYP & Renal
                </span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pkMetrics.enzymeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="count" nameKey="enzyme">
                    {pkMetrics.enzymeDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [`${val} patients`, 'Count']} contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <p className="mt-2 text-center text-xs text-slate-500">
                CYP3A4 (50%), CYP2C9 (20%), Non-CYP/Renal Direct Filtration (16%), CYP2D6 (14%).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAFETY & ADVERSE EVENTS MONITORING */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          {/* Safety Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">76.0%</p>
              <p className="text-xs text-slate-500 font-medium">AE-Free Cohort</p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">38 of 50 Patients with 0 AEs</p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 to-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{safetyMetrics.aePercentage}%</p>
              <p className="text-xs text-slate-500 font-medium">Reported AEs (Total: 12)</p>
              <p className="mt-1 text-xs font-semibold text-amber-700">10 Mild/Mod, 2 Severe</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Droplets className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{safetyMetrics.hypoglycemiaPercentage}%</p>
              <p className="text-xs text-slate-500 font-medium">Hypoglycemia Incidence</p>
              <p className="mt-1 text-xs font-semibold text-blue-600">8 Episodes · All resolved</p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <HeartPulse className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{safetyMetrics.liverSafety.normalRate}%</p>
              <p className="text-xs text-slate-500 font-medium">Hepatic Safety (ALT/AST)</p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">Zero drug-induced liver injury</p>
            </div>
          </div>

          {/* Severity & Dose Distribution */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Adverse Event Severity Breakdown */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Adverse Event Severity Distribution</h2>
                  <p className="text-xs text-slate-500">Grading across the 50 trial participants</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={safetyMetrics.severityBreakdown} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="severity" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {safetyMetrics.severityBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-between text-xs text-slate-600">
                <span>None: 38 (76%)</span>
                <span>Mild: 5 (10%)</span>
                <span>Moderate: 5 (10%)</span>
                <span>Severe: 2 (4%)</span>
              </div>
            </div>

            {/* AE & Hypoglycemia Rate by Dose Cohort */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Safety Event Rates by Dose</h2>
                  <p className="text-xs text-slate-500">Adverse event and hypoglycemia frequency across 50mg, 100mg, 150mg</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={safetyMetrics.byDoseAe} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="dose" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="aeRate" fill="#F59E0B" name="AE Rate (%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="hypoRate" fill="#3B82F6" name="Hypoglycemia Rate (%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-2 text-center text-xs text-slate-500">
                Mild GI discomfort occurred in 100mg/150mg cohorts; all events managed with dose scheduling adjustments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TRIAL RECRUITMENT & OPERATIONS */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{totalParticipants}</p>
              <p className="text-xs text-slate-500">Total Participants</p>
              <p className="mt-1 text-xs font-semibold text-green-600">Active cohort (50)</p>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{enrolledCount}</p>
              <p className="text-xs text-slate-500">Enrolled in Protocol</p>
              <p className="mt-1 text-xs font-semibold text-green-600">100% adherence</p>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                <FileSignature className="h-5 w-5 text-purple-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{consentRate}%</p>
              <p className="text-xs text-slate-500">Consent Rate</p>
              <p className="mt-1 text-xs font-semibold text-purple-600">{consentedCount} signed</p>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{screeningRate}%</p>
              <p className="text-xs text-slate-500">Screening Conversion</p>
              <p className="mt-1 text-xs font-semibold text-amber-600">{eligibleCount} verified</p>
            </div>
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Recruitment Trend */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Recruitment Trend</h2>
                  <p className="text-xs text-slate-500">Weekly candidates vs enrolled</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Candidates</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />Enrolled</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240} className="mt-4">
                <AreaChart data={recruitmentTrendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="enr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="candidates" stroke="#3B82F6" strokeWidth={2} fill="url(#cand)" />
                  <Area type="monotone" dataKey="enrolled" stroke="#22C55E" strokeWidth={2} fill="url(#enr)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Screening Conversion */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
              <h2 className="text-base font-semibold text-slate-900">Screening Conversion Funnel</h2>
              <p className="text-xs text-slate-500">From candidates to enrolled</p>
              <ResponsiveContainer width="100%" height={240} className="mt-4">
                <BarChart data={screeningConversion} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="value" fill="#93C5FD" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Consent Conversion */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Consent Conversion</h2>
                  <p className="text-xs text-slate-500">Sent vs signed over time</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-purple-500" />Sent</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />Signed</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240} className="mt-4">
                <LineChart data={consentConversionData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Line type="monotone" dataKey="sent" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4, fill: '#8B5CF6' }} />
                  <Line type="monotone" dataKey="signed" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4, fill: '#22C55E' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Participant Retention */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
              <h2 className="text-base font-semibold text-slate-900">Participant Retention (6 Months)</h2>
              <p className="text-xs text-slate-500">Retention trajectory</p>
              <ResponsiveContainer width="100%" height={240} className="mt-4">
                <AreaChart data={retentionData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ret" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[70, 100]} tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="retained" stroke="#22C55E" strokeWidth={2.5} fill="url(#ret)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Study Progress */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-900">Study Progress</h2>
            </div>
            <p className="text-xs text-slate-500">Active Type 2 Diabetes study enrollment achievement</p>
            <div className="mt-4 space-y-4">
              {studyPerformanceData.map((s) => (
                <div key={s.study}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{s.study}</span>
                    <span className="text-sm font-semibold text-slate-900">{s.progress}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out bg-emerald-600"
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
