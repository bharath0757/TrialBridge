import { useState } from 'react';
import { useTrialBridge } from '@/store/TrialBridgeContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  FileText,
  Search,
  Download,
  Upload,
  FileSignature,
  FlaskConical,
  User,
  Beaker,
  Folder,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const categoryIcons: Record<string, LucideIcon> = {
  'Consent Forms': FileSignature,
  'Study Protocol': FlaskConical,
  'Participant Documents': User,
  'Lab Reports': Beaker,
  'Research Documents': Folder,
};

export function DocumentsPage() {
  const { documents } = useTrialBridge();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = ['Consent Forms', 'Study Protocol', 'Participant Documents', 'Lab Reports', 'Research Documents'];

  const filtered = documents.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) &&
      (categoryFilter === 'all' || d.category === categoryFilter)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Documents</h1>
          <p className="mt-1 text-sm text-slate-500">Secure document management for clinical trial files</p>
        </div>
        <Button className="flex items-center gap-2">
          <Upload className="h-4 w-4" /> Upload Document
        </Button>
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-2 rounded-xl bg-blue-50/50 border border-blue-100 p-3 animate-fade-in">
        <Shield className="h-4 w-4 shrink-0 text-blue-600" />
        <p className="text-xs text-blue-700">Documents are access-controlled. Only authorized roles can view sensitive participant documents.</p>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat, i) => {
          const count = documents.filter((d) => d.category === cat).length;
          const Icon = categoryIcons[cat] || FileText;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'rounded-xl border bg-white p-4 text-left transition-all animate-fade-in',
                categoryFilter === cat ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200/60 hover:border-slate-300'
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                <Icon className="h-4.5 w-4.5 text-slate-600" style={{ width: '1.125rem', height: '1.125rem' }} />
              </div>
              <p className="mt-3 text-lg font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500 leading-tight">{cat}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Documents table */}
      <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                <th className="px-4 py-3 text-left font-medium">Document Name</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Study</th>
                <th className="px-4 py-3 text-left font-medium">Participant</th>
                <th className="px-4 py-3 text-left font-medium">Uploaded By</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Size</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((d) => {
                const Icon = categoryIcons[d.category] || FileText;
                return (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
                          <Icon className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-800">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{d.type}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{d.category}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[100px] truncate">{d.studyName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{d.participantName || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{d.uploadedBy}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{d.date}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{d.size}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3">
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-400">No documents found</p>
          </div>
        )}
      </div>
    </div>
  );
}
