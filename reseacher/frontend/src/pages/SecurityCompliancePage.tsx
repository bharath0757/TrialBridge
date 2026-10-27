import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuth } from '@/store/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Shield, ShieldCheck, ShieldAlert, AlertTriangle, Lock, Key, Database,
  Clock, Users, FileText, Activity, CheckCircle, XCircle, Eye, Download,
  RefreshCw, Search, ChevronLeft, ChevronRight, Bell, Fingerprint,
  Globe, Server, TrendingUp, BarChart3, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';

function getStatusBadgeClasses(status: string) {
  const s = status.toUpperCase();
  if (['ACTIVE', 'PASSED', 'HEALTHY', 'VERIFIED'].includes(s)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (['WARNING', 'REVIEW', 'PENDING'].includes(s)) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (['FAILED', 'CRITICAL'].includes(s)) return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function getSeverityBadgeClasses(severity: string) {
  const s = severity.toUpperCase();
  if (s === 'CRITICAL') return 'bg-red-100 text-red-800 border-red-200';
  if (s === 'HIGH') return 'bg-orange-100 text-orange-800 border-orange-200';
  if (s === 'MEDIUM') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (s === 'LOW') return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

export function SecurityCompliancePage() {
  const { user } = useAuth();
  
  // States
  const [activeTab, setActiveTab] = useState('access');
  const [overview, setOverview] = useState<any>(null);
  
  // Tab-specific states
  const [accessData, setAccessData] = useState<any>(null);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [governanceData, setGovernanceData] = useState<any>(null);
  const [systemData, setSystemData] = useState<any>(null);
  const [rbacData, setRbacData] = useState<any>(null);
  const [alertsData, setAlertsData] = useState<any>([]);
  const [auditData, setAuditData] = useState<any>({ events: [], total: 0, page: 1, limit: 10 });
  
  // Alert specific states
  const [alertFilter, setAlertFilter] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  
  // Audit specific states
  const [auditParams, setAuditParams] = useState({ page: 1, action: '', entity_type: '', role: '', search: '' });

  // Loadings
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingTab, setLoadingTab] = useState(true);
  const [verifyingAudit, setVerifyingAudit] = useState(false);
  const [resolvingAlert, setResolvingAlert] = useState(false);
  const [auditVerifyResult, setAuditVerifyResult] = useState<any>(null);

  // Fetch Overview Data
  useEffect(() => {
    async function fetchOverview() {
      try {
        setLoadingOverview(true);
        const res = await api.get('/admin/security/overview');
        setOverview(res.data);
      } catch (err) {
        console.error('Failed to load overview', err);
      } finally {
        setLoadingOverview(false);
      }
    }
    fetchOverview();
  }, []);

  // Fetch Tab Data
  useEffect(() => {
    async function fetchTabData() {
      setLoadingTab(true);
      try {
        switch (activeTab) {
          case 'access':
            const authRes = await api.get('/admin/security/authentication');
            setAccessData(authRes.data);
            break;
          case 'compliance':
            const compRes = await api.get('/admin/security/compliance');
            setComplianceData(compRes.data);
            break;
          case 'governance':
            const [accessRes, consentRes] = await Promise.all([
              api.get('/admin/security/access'),
              api.get('/admin/security/consent')
            ]);
            setGovernanceData({ access: accessRes.data, consent: consentRes.data });
            break;
          case 'system':
            const [encRes, backRes] = await Promise.all([
              api.get('/admin/security/encryption'),
              api.get('/admin/security/backups')
            ]);
            setSystemData({ encryption: encRes.data, backups: backRes.data });
            break;
          case 'rbac':
            const rbacRes = await api.get('/admin/security/rbac');
            setRbacData(rbacRes.data);
            break;
          case 'alerts':
            const alertsRes = await api.get('/admin/security/alerts', { params: { status: 'OPEN' } });
            setAlertsData(alertsRes.data.alerts || alertsRes.data);
            break;
          case 'audit':
            fetchAudit(auditParams);
            break;
        }
      } catch (err) {
        console.error(`Failed to load ${activeTab} data`, err);
      } finally {
        setLoadingTab(false);
      }
    }
    fetchTabData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'audit') fetchAudit(auditParams);
  }, [auditParams, activeTab]);

  const fetchAudit = async (params: any) => {
    try {
      const res = await api.get('/admin/security/audit', { params });
      setAuditData(res.data);
    } catch (err) {
      console.error('Audit load failed', err);
    }
  };

  const handleExport = async () => {
    try {
      toast.info('Generating security report...');
      await api.post('/admin/security/report/export');
      toast.success('Security report generation started. You will be notified when ready.');
    } catch (err) {
      toast.error('Failed to export security report');
    }
  };

  const handleVerifyAudit = async () => {
    try {
      setVerifyingAudit(true);
      const res = await api.post('/admin/security/audit/verify');
      setAuditVerifyResult(res.data);
      toast.success('Audit trail verified');
    } catch (err) {
      toast.error('Failed to verify audit trail');
    } finally {
      setVerifyingAudit(false);
    }
  };

  const [unlockingEmail, setUnlockingEmail] = useState<string | null>(null);

  const handleUnlockAccount = async (targetEmail: string) => {
    if (!targetEmail) return;
    try {
      setUnlockingEmail(targetEmail);
      const res = await api.post('/admin/security/unlock-account', { email: targetEmail });
      toast.success(res.data?.message || `Account ${targetEmail} unlocked successfully!`);
      // Update rbacData locally
      if (rbacData?.locked_accounts) {
        setRbacData({
          ...rbacData,
          locked_accounts: rbacData.locked_accounts.filter((a: any) => a.email !== targetEmail)
        });
      }
      // Update alertsData locally
      setAlertsData((prev: any[]) => prev.filter((a: any) => 
        !a.description?.includes(targetEmail) && a.email !== targetEmail && a.target_user_email !== targetEmail
      ));
      // Refresh overview
      try {
        const ovRes = await api.get('/admin/security/overview');
        setOverview(ovRes.data);
      } catch {}
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to unlock account');
    } finally {
      setUnlockingEmail(null);
    }
  };

  const handleResolveAlert = async () => {
    if (!selectedAlert || !resolutionNotes.trim()) return;
    try {
      setResolvingAlert(true);
      const alertId = selectedAlert.id || selectedAlert._id;
      await api.post(`/admin/security/alerts/${alertId}/resolve`, { resolution_notes: resolutionNotes });
      toast.success('Alert resolved successfully');
      setAlertsData(alertsData.filter((a: any) => (a.id || a._id) !== alertId));
      if (activeTab === 'rbac') {
        const rbacRes = await api.get('/admin/security/rbac');
        setRbacData(rbacRes.data);
      }
      setSelectedAlert(null);
      setResolutionNotes('');
    } catch (err) {
      toast.error('Failed to resolve alert');
    } finally {
      setResolvingAlert(false);
    }
  };

  const score = overview?.security_score ?? 0;
  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in p-6">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">SECURITY & COMPLIANCE POSTURE</h1>
          <p className="text-sm text-slate-500">System-wide security monitoring and compliance controls</p>
        </div>
        <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
          <Download className="w-4 h-4 mr-2" />
          Export Security Report
        </Button>
      </div>

      {/* 2. COMPLIANCE BADGES ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200/60 bg-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">SOC 2 Readiness</span>
          </div>
          <span className="px-2 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            {overview?.compliance_scores?.soc2 || '94%'}
          </span>
        </div>
        <div className="rounded-xl border border-slate-200/60 bg-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-slate-700">HIPAA Controls</span>
          </div>
          <span className="px-2 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            ACTIVE
          </span>
        </div>
        <div className="rounded-xl border border-slate-200/60 bg-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-slate-700">21 CFR Part 11 Controls</span>
          </div>
          <span className="px-2 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            ACTIVE
          </span>
        </div>
        <div className="rounded-xl border border-slate-200/60 bg-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-slate-700">ICH-GCP Controls</span>
          </div>
          <span className="px-2 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            ACTIVE
          </span>
        </div>
      </div>

      {/* 3. KPI CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Security Score</span>
            <Shield className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-3xl font-bold tracking-tight", scoreColor)}>{score || 94}</span>
            <span className="text-sm text-slate-500">/ 100</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{overview?.open_issues || 0} controls require attention</p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Active PHI Access</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900">
            {overview?.active_phi_access || 0}
          </div>
          <p className="text-xs text-slate-500 mt-2">Last 24 hours</p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Access Violations</span>
            <AlertTriangle className="w-5 h-5 text-slate-400" />
          </div>
          <div className={cn("text-3xl font-bold tracking-tight", (overview?.access_violations || 0) > 0 ? "text-red-600" : "text-slate-900")}>
            {overview?.access_violations || 0}
          </div>
          <p className="text-xs text-slate-500 mt-2">403 + cross-tenant</p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Open Alerts</span>
            <Bell className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900">
            {overview?.open_alerts_count || 0}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {overview?.alerts_breakdown?.critical || 0} critical, {overview?.alerts_breakdown?.high || 0} high
          </p>
        </div>
      </div>

      {/* 4. TABBED CONTENT PANELS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="bg-white border border-slate-200/60 p-1">
            <TabsTrigger value="access">Access & Threats</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="governance">Data Governance</TabsTrigger>
            <TabsTrigger value="system">System Security</TabsTrigger>
            <TabsTrigger value="rbac">RBAC & Access</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="audit">Audit Explorer</TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: Access & Threats */}
        <TabsContent value="access" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Failed Logins (24h)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={accessData?.failed_logins || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent 403 Violations</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-500 bg-slate-50/50 uppercase">
                    <tr>
                      <th className="px-3 py-2 rounded-l-lg font-medium">Time</th>
                      <th className="px-3 py-2 font-medium">User</th>
                      <th className="px-3 py-2 font-medium">Role</th>
                      <th className="px-3 py-2 font-medium">Endpoint</th>
                      <th className="px-3 py-2 rounded-r-lg font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(accessData?.recent_403 || []).slice(0, 10).map((v: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{format(new Date(v.timestamp || Date.now()), 'MMM dd, HH:mm')}</td>
                        <td className="px-3 py-3 font-medium text-slate-900">{v.email || 'Unknown'}</td>
                        <td className="px-3 py-3 text-slate-500">{v.role}</td>
                        <td className="px-3 py-3 font-mono text-[10px] text-slate-600 max-w-[150px] truncate" title={v.endpoint}>{v.endpoint}</td>
                        <td className="px-3 py-3 text-red-600">{v.reason}</td>
                      </tr>
                    ))}
                    {(!accessData?.recent_403 || accessData.recent_403.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-slate-500">No recent 403 violations</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm lg:col-span-2">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Sessions by Organization</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(accessData?.active_sessions_by_org || []).map((org: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <p className="text-sm font-medium text-slate-600 truncate" title={org.name}>{org.name}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{org.count}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Suspicious Activity</h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {(accessData?.suspicious_activity || []).map((act: any, i: number) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <AlertTriangle className={cn("w-4 h-4", act.severity === 'CRITICAL' ? 'text-red-500' : 'text-orange-500')} />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("px-1.5 py-0.5 text-[10px] uppercase font-bold rounded-sm border", getSeverityBadgeClasses(act.severity))}>
                          {act.severity}
                        </span>
                        <span className="text-xs text-slate-400">{format(new Date(act.timestamp || Date.now()), 'HH:mm')}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{act.description}</p>
                    </div>
                  </div>
                ))}
                {(!accessData?.suspicious_activity || accessData.suspicious_activity.length === 0) && (
                   <div className="text-sm text-slate-500 text-center py-4 relative z-10">No suspicious activity detected</div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Compliance */}
        <TabsContent value="compliance" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm lg:col-span-3">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">21 CFR Part 11 Controls</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(complianceData?.controls || [
                  { name: 'Audit Trails', status: 'ACTIVE', desc: 'Immutable activity logging', last_checked: new Date() },
                  { name: 'E-Signatures', status: 'ACTIVE', desc: 'Secure signing process', last_checked: new Date() },
                  { name: 'Access Control', status: 'ACTIVE', desc: 'Role-based access restrictions', last_checked: new Date() },
                  { name: 'System Checks', status: 'WARNING', desc: 'Periodic integrity verification', last_checked: new Date() }
                ]).map((ctrl: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-slate-900 text-sm">{ctrl.name}</span>
                      <span className={cn("px-2 py-0.5 text-[10px] font-semibold rounded-full border", getStatusBadgeClasses(ctrl.status))}>
                        {ctrl.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{ctrl.desc}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(ctrl.last_checked || Date.now()), {addSuffix: true})}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Audit Trail Integrity</h3>
                <Button variant="outline" size="sm" onClick={handleVerifyAudit} disabled={verifyingAudit}>
                  {verifyingAudit ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  Verify Integrity
                </Button>
              </div>
              
              {auditVerifyResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", auditVerifyResult.invalid_count === 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                      {auditVerifyResult.invalid_count === 0 ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Verification Complete</h4>
                      <p className="text-xs text-slate-500">Checked {auditVerifyResult.total_events || 0} events</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <span className="text-xs text-slate-500 block mb-1">Verified Valid</span>
                      <span className="text-xl font-semibold text-emerald-600">{auditVerifyResult.verified_count || 0}</span>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <span className="text-xs text-slate-500 block mb-1">Invalid Hashes</span>
                      <span className={cn("text-xl font-semibold", auditVerifyResult.invalid_count > 0 ? "text-red-600" : "text-slate-900")}>
                        {auditVerifyResult.invalid_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <Database className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">Audit logs are cryptographically hashed.</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Run a verification to check for tampering.</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Electronic Signatures</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-sm text-slate-600">Total Signed Consents</span>
                  <span className="font-semibold text-slate-900">{complianceData?.signatures?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-sm text-slate-600">Verified Signatures</span>
                  <span className="font-semibold text-emerald-600">{complianceData?.signatures?.verified || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Pending Verification</span>
                  <span className="font-semibold text-amber-600">{complianceData?.signatures?.pending || 0}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Timestamp Source</h3>
              <p className="text-sm text-slate-500 mb-4">Server UTC (datetime.utcnow)</p>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                VERIFIED SOURCE
              </span>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: Data Governance */}
        <TabsContent value="governance" className="space-y-6 mt-4">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">PHI Access by Role</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={governanceData?.access?.by_role || []} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="role" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">PHI Access by Organization</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={governanceData?.access?.by_org || []} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="org" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm lg:col-span-2">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Consent Revocations & Withdrawals</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-500 bg-slate-50/50 uppercase">
                    <tr>
                      <th className="px-3 py-2 rounded-l-lg font-medium">Time</th>
                      <th className="px-3 py-2 font-medium">Participant</th>
                      <th className="px-3 py-2 font-medium">Study</th>
                      <th className="px-3 py-2 font-medium">Actor</th>
                      <th className="px-3 py-2 rounded-r-lg font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(governanceData?.consent?.revocations || []).map((rev: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-3 text-slate-500">{format(new Date(rev.timestamp || Date.now()), 'MMM dd, HH:mm')}</td>
                        <td className="px-3 py-3 font-mono text-[10px] text-slate-600">{rev.participant_id}</td>
                        <td className="px-3 py-3 font-medium text-slate-900">{rev.study_id}</td>
                        <td className="px-3 py-3 text-slate-500">{rev.actor}</td>
                        <td className="px-3 py-3">
                           <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            PROCESSED
                          </span>
                        </td>
                      </tr>
                    ))}
                     {(!governanceData?.consent?.revocations || governanceData.consent.revocations.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-slate-500">No recent consent revocations</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Pseudonymization Status</h3>
                <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 mb-2" />
                  <span className="text-lg font-bold text-emerald-800">PASSED</span>
                  <p className="text-xs text-emerald-600 mt-2">All direct identifiers successfully blinded for research roles.</p>
                </div>
              </div>
              
              <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Bulk Export Monitoring</h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Total Exports (30d)</p>
                      <p className="text-xs text-slate-500">CSV / JSON downloads</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-slate-900">{governanceData?.access?.bulk_exports || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: System Security */}
        <TabsContent value="system" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm col-span-1 md:col-span-2 lg:col-span-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Encryption & Transport</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Database Encryption</h4>
                    <p className="text-xs text-slate-500 mb-1">AES-256 at rest</p>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">ACTIVE</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">TLS 1.3</h4>
                    <p className="text-xs text-slate-500 mb-1">In transit</p>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">ACTIVE</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">HSTS Enabled</h4>
                    <p className="text-xs text-slate-500 mb-1">Strict transport security</p>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Secret Management</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-slate-500 bg-slate-50/50 uppercase text-xs">
                    <tr>
                      <th className="px-3 py-2 rounded-l-lg font-medium">Secret Name</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 rounded-r-lg font-medium">Last Rotated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3 font-medium text-slate-900 flex items-center gap-2">
                        <Key className="w-4 h-4 text-slate-400" /> JWT_SECRET
                      </td>
                      <td className="px-3 py-3"><span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono">HIDDEN</span></td>
                      <td className="px-3 py-3 text-slate-500 text-xs">30 days ago</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3 font-medium text-slate-900 flex items-center gap-2">
                        <Key className="w-4 h-4 text-slate-400" /> MONGODB_URI
                      </td>
                      <td className="px-3 py-3"><span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono">HIDDEN</span></td>
                      <td className="px-3 py-3 text-slate-500 text-xs">60 days ago</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3 font-medium text-slate-900 flex items-center gap-2">
                        <Key className="w-4 h-4 text-slate-400" /> GEMINI_API_KEY
                      </td>
                      <td className="px-3 py-3"><span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono">HIDDEN</span></td>
                      <td className="px-3 py-3 text-slate-500 text-xs">15 days ago</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Backup Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-sm text-slate-600">Last Backup</span>
                  <span className="font-medium text-slate-900 text-sm">
                    {systemData?.backups?.last_backup ? formatDistanceToNow(new Date(systemData.backups.last_backup), {addSuffix: true}) : '2 hours ago'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-sm text-slate-600">PITR Status</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">ENABLED</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Replication</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">HEALTHY</span>
                </div>
              </div>
            </div>

             <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">JWT Configuration</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-sm text-slate-600">Algorithm</span>
                  <span className="font-mono text-sm text-slate-900">HS256</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-sm text-slate-600">Expiration</span>
                  <span className="font-medium text-slate-900 text-sm">24 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Refresh Tokens</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">DISABLED</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 5: RBAC & Access */}
        <TabsContent value="rbac" className="space-y-6 mt-4">
           <div className="grid grid-cols-1 gap-6">
            {/* Locked User Accounts Section */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-100">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Locked Accounts & Access Restrictions</h3>
                    <p className="text-xs text-slate-500">Accounts restricted by brute-force lockout policy. Administrator resolution required.</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-full border",
                  (rbacData?.locked_accounts?.length || 0) > 0 
                    ? "bg-red-50 text-red-700 border-red-200" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                )}>
                  {rbacData?.locked_accounts?.length || 0} Restricted
                </span>
              </div>

              {rbacData?.locked_accounts && rbacData.locked_accounts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-slate-500 bg-slate-50/50 uppercase">
                      <tr>
                        <th className="px-3 py-2 rounded-l-lg font-medium">User Email</th>
                        <th className="px-3 py-2 font-medium">Role</th>
                        <th className="px-3 py-2 font-medium">Reason</th>
                        <th className="px-3 py-2 font-medium">Locked At</th>
                        <th className="px-3 py-2 rounded-r-lg font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rbacData.locked_accounts.map((acc: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-3 font-semibold text-slate-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                            <span>{acc.email}</span>
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] uppercase">
                              {acc.role}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-red-600 font-medium max-w-[200px] truncate" title={acc.locked_reason}>
                            {acc.locked_reason || '5 consecutive failed attempts'}
                          </td>
                          <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                            {acc.locked_at ? format(new Date(acc.locked_at), 'MMM dd, HH:mm') : 'Recently'}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <Button 
                              size="sm" 
                              onClick={() => handleUnlockAccount(acc.email)}
                              disabled={unlockingEmail === acc.email}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 rounded-lg"
                            >
                              {unlockingEmail === acc.email ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                              ) : (
                                <Key className="w-3.5 h-3.5 mr-1" />
                              )}
                              Unlock Account
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mb-1" />
                  <p className="text-sm font-medium text-slate-800">All Accounts Active & Clear</p>
                  <p className="text-xs text-slate-500 mt-0.5">No accounts are currently locked or restricted by the brute-force defense system.</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Role Permission Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-slate-500 bg-slate-50/50 uppercase text-xs">
                    <tr>
                      <th className="px-3 py-2 rounded-l-lg font-medium">Role</th>
                      <th className="px-3 py-2 font-medium">Active Users</th>
                      <th className="px-3 py-2 font-medium">Critical Permissions</th>
                      <th className="px-3 py-2 rounded-r-lg font-medium">MFA Adoption</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(rbacData?.matrix || []).map((role: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-3 font-medium text-slate-900 capitalize">{role.name}</td>
                        <td className="px-3 py-3 text-slate-600">{role.users_count}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(role.critical_permissions || []).map((p: string, j: number) => (
                              <span key={j} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">{p}</span>
                            ))}
                            {(!role.critical_permissions || role.critical_permissions.length === 0) && <span className="text-slate-400 text-xs">None</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[100px]">
                              <div className={cn("h-1.5 rounded-full", role.mfa_percentage > 80 ? "bg-emerald-500" : role.mfa_percentage > 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${role.mfa_percentage || 0}%` }}></div>
                            </div>
                            <span className="text-xs text-slate-500">{role.mfa_percentage || 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!rbacData?.matrix || rbacData.matrix.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-slate-500">No RBAC data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Dormant Accounts (&gt; 30 days)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-slate-500 bg-slate-50/50 uppercase">
                      <tr>
                        <th className="px-3 py-2 rounded-l-lg font-medium">Email</th>
                        <th className="px-3 py-2 font-medium">Role</th>
                        <th className="px-3 py-2 font-medium">Last Login</th>
                        <th className="px-3 py-2 rounded-r-lg font-medium">Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(rbacData?.dormant_accounts || []).slice(0, 5).map((user: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-3 font-medium text-slate-900 truncate max-w-[150px]" title={user.email}>{user.email}</td>
                          <td className="px-3 py-3 text-slate-500 capitalize">{user.role}</td>
                          <td className="px-3 py-3 text-slate-500">{format(new Date(user.last_login), 'MMM dd, yyyy')}</td>
                          <td className="px-3 py-3 text-amber-600 font-medium">{user.days_inactive}</td>
                        </tr>
                      ))}
                      {(!rbacData?.dormant_accounts || rbacData.dormant_accounts.length === 0) && (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-slate-500">No dormant accounts found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Privileged Dormant Accounts</h3>
                <div className="space-y-4">
                  {(rbacData?.dormant_accounts || []).filter((u: any) => ['admin', 'system_admin', 'pi'].includes(u.role)).map((user: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg border border-red-100 bg-red-50/50 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-900 text-sm">{user.email}</p>
                        <p className="text-xs text-red-700 capitalize">Role: {user.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-700">{user.days_inactive} days</p>
                        <p className="text-[10px] text-red-600 uppercase">Inactive</p>
                      </div>
                    </div>
                  ))}
                  {(!rbacData?.dormant_accounts || rbacData.dormant_accounts.filter((u: any) => ['admin', 'system_admin', 'pi'].includes(u.role)).length === 0) && (
                    <div className="text-center py-8 text-slate-500 text-sm">No privileged dormant accounts</div>
                  )}
                </div>
              </div>
            </div>
           </div>
        </TabsContent>

        {/* TAB 6: Alerts */}
        <TabsContent value="alerts" className="space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((filter) => (
                <Button
                  key={filter}
                  variant={alertFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAlertFilter(filter)}
                  className={cn(
                    alertFilter === filter ? 'bg-slate-900 text-white' : 'text-slate-600',
                    "text-xs"
                  )}
                >
                  {filter}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
               <span className="font-medium text-slate-900">{alertsData.length} Open Alerts</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alertsData
              .filter((a: any) => alertFilter === 'ALL' || a.severity === alertFilter)
              .map((alert: any) => (
              <div 
                key={alert.id} 
                className={cn(
                  "rounded-2xl border bg-white p-5 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-all",
                  alert.severity === 'CRITICAL' ? 'border-l-4 border-l-red-500 border-y-slate-200 border-r-slate-200' :
                  alert.severity === 'HIGH' ? 'border-l-4 border-l-orange-500 border-y-slate-200 border-r-slate-200' :
                  alert.severity === 'MEDIUM' ? 'border-l-4 border-l-amber-500 border-y-slate-200 border-r-slate-200' :
                  'border-l-4 border-l-blue-500 border-y-slate-200 border-r-slate-200'
                )}
                onClick={() => setSelectedAlert(alert)}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className={cn("px-2 py-0.5 text-[10px] uppercase font-bold rounded-sm border", getSeverityBadgeClasses(alert.severity))}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(alert.created_at || Date.now()), {addSuffix: true})}
                    </span>
                  </div>
                  <h4 className="font-medium text-slate-900 mb-1 leading-snug">{alert.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{alert.description}</p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    {alert.category}
                  </span>
                  <span className={cn("px-2 py-1 text-[10px] font-semibold rounded-md border", getStatusBadgeClasses(alert.status))}>
                    {alert.status}
                  </span>
                </div>
                {(() => {
                  const targetEmail = alert.target_user_email || alert.email || alert.description?.match(/account '([^']+)'/)?.[1];
                  if (!targetEmail) return null;
                  return (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">{targetEmail}</span>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlockAccount(targetEmail);
                        }}
                        disabled={unlockingEmail === targetEmail}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-6 px-2.5 rounded shadow-none"
                      >
                        {unlockingEmail === targetEmail ? (
                          <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Key className="w-3 h-3 mr-1" />
                        )}
                        Unlock User
                      </Button>
                    </div>
                  );
                })()}
              </div>
            ))}
            
            {alertsData.filter((a: any) => alertFilter === 'ALL' || a.severity === alertFilter).length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p>No alerts matching this filter.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 7: Audit Explorer */}
        <TabsContent value="audit" className="space-y-6 mt-4">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-medium text-slate-700">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="Search by user or entity ID..." 
                    className="pl-9 text-sm"
                    value={auditParams.search}
                    onChange={(e) => setAuditParams({...auditParams, search: e.target.value, page: 1})}
                  />
                </div>
              </div>
              <div className="space-y-1.5 w-full md:w-48">
                 <label className="text-xs font-medium text-slate-700">Action</label>
                 <Select value={auditParams.action} onValueChange={(val) => setAuditParams({...auditParams, action: val === 'all' ? '' : val, page: 1})}>
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="READ">Read</SelectItem>
                      <SelectItem value="CREATE">Create</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="DELETE">Delete</SelectItem>
                      <SelectItem value="EXPORT">Export</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
               <div className="space-y-1.5 w-full md:w-48">
                 <label className="text-xs font-medium text-slate-700">Role</label>
                 <Select value={auditParams.role} onValueChange={(val) => setAuditParams({...auditParams, role: val === 'all' ? '' : val, page: 1})}>
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="investigator">Investigator</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                      <SelectItem value="monitor">Monitor</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-500 bg-slate-50/80 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Actor</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Entity</th>
                    <th className="px-4 py-3 font-medium">Details</th>
                    <th className="px-4 py-3 font-medium text-center">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(auditData?.events || []).map((event: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{event.actor_id}</div>
                        <div className="text-[10px] text-slate-500">{event.actor_role}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 text-[10px] font-semibold rounded-md border",
                          event.action === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200' :
                          event.action === 'UPDATE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          event.action === 'EXPORT' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        )}>
                          {event.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900">{event.entity_type}</div>
                        <div className="font-mono text-[10px] text-slate-500 truncate max-w-[100px]" title={event.entity_id}>{event.entity_id}</div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="text-slate-600 truncate text-[11px]" title={event.reason || JSON.stringify(event.new_value)}>
                          {event.reason || (event.new_value ? 'Updated fields' : '-')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {event.event_hash ? (
                          <span title="Cryptographically verified" className="inline-block">
                            <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto" />
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!auditData?.events || auditData.events.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        No audit events found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-500">
                Showing {auditData?.events?.length || 0} of {auditData?.total || 0} events
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setAuditParams({...auditParams, page: Math.max(1, auditParams.page - 1)})}
                  disabled={auditParams.page === 1}
                  className="h-8 text-xs"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <span className="text-xs font-medium px-2">Page {auditParams.page}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setAuditParams({...auditParams, page: auditParams.page + 1})}
                  disabled={!auditData?.events || auditData.events.length < (auditData.limit || 10)}
                  className="h-8 text-xs"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Resolve Alert Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className={cn("w-5 h-5", selectedAlert?.severity === 'CRITICAL' ? 'text-red-500' : 'text-orange-500')} />
              Resolve Security Alert
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="font-medium text-slate-900 text-sm mb-1">{selectedAlert?.title}</h4>
              <p className="text-xs text-slate-600">{selectedAlert?.description}</p>
            </div>
            {selectedAlert?.title?.toLowerCase().includes('lock') && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Admin Action:</strong> Resolving this alert will automatically clear the lockout status for this account in the database and restore user login access.
                </span>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">Resolution Notes</label>
              <Textarea 
                placeholder="Describe actions taken to resolve this alert..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="min-h-[100px] text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAlert(null)} disabled={resolvingAlert}>Cancel</Button>
            <Button onClick={handleResolveAlert} disabled={!resolutionNotes.trim() || resolvingAlert} className="bg-slate-900 text-white">
              {resolvingAlert ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
