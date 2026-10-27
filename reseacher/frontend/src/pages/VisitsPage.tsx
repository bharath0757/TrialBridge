import { useState } from 'react';
import { useTrialBridge } from '@/store/TrialBridgeContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Clock,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Visit } from '@/types';

const visitTypes = ['Screening', 'Visit 1', 'Visit 2', 'Visit 3', 'Follow-up', 'Final Visit'];

export function VisitsPage() {
  const { visits, participants, studies, scheduleVisit } = useTrialBridge();
  const [showSchedule, setShowSchedule] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 8, 1)); // September 2026

  // Group visits by date
  const visitsByDate = visits.reduce((acc, v) => {
    if (!acc[v.date]) acc[v.date] = [];
    acc[v.date].push(v);
    return acc;
  }, {} as Record<string, Visit[]>);

  const upcomingVisits = visits
    .filter((v) => v.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calendar generation
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const formatDate = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Study Visits</h1>
          <p className="mt-1 text-sm text-slate-500">Schedule and track participant study visits</p>
        </div>
        <Button onClick={() => setShowSchedule(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Schedule Visit
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Calendar */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 lg:col-span-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">{monthName}</h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="rounded-lg p-1.5 hover:bg-slate-100">
                <ChevronLeft className="h-4 w-4 text-slate-500" />
              </button>
              <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="rounded-lg p-1.5 hover:bg-slate-100">
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="pb-2 text-center text-xs font-medium text-slate-400">{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={i} />;
              const dateStr = formatDate(day);
              const dayVisits = visitsByDate[dateStr] || [];
              const isToday = dateStr === '2026-09-10';
              return (
                <div
                  key={i}
                  className={cn(
                    'min-h-[72px] rounded-lg border p-1.5 transition-colors',
                    isToday ? 'border-blue-300 bg-blue-50/30' : 'border-slate-100 hover:bg-slate-50',
                    dayVisits.length > 0 && !isToday && 'border-slate-200'
                  )}
                >
                  <span className={cn('text-xs', isToday ? 'font-bold text-blue-600' : 'text-slate-600')}>{day}</span>
                  <div className="mt-1 space-y-1">
                    {dayVisits.slice(0, 2).map((v) => (
                      <div
                        key={v.id}
                        className={cn(
                          'truncate rounded px-1 py-0.5 text-[10px] font-medium',
                          v.status === 'completed' ? 'bg-green-50 text-green-700' :
                          v.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                          'bg-slate-100 text-slate-500'
                        )}
                      >
                        {v.time} {v.participantName.split(' ')[0]}
                      </div>
                    ))}
                    {dayVisits.length > 2 && (
                      <p className="text-[10px] text-slate-400">+{dayVisits.length - 2} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Visits List */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
          <h2 className="text-base font-semibold text-slate-900">Upcoming Visits</h2>
          <p className="text-xs text-slate-500 mb-3">{upcomingVisits.length} scheduled</p>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {upcomingVisits.map((v) => (
              <div key={v.id} className="rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-50">
                    <span className="text-[9px] font-medium text-blue-400">{v.date.split('-')[1]}</span>
                    <span className="text-sm font-bold text-blue-700">{v.date.split('-')[2]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{v.type}</p>
                    <p className="text-xs text-slate-500">{v.participantName} · {v.studyName}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {v.time}</span>
                      <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {v.location.split(',')[0]}</span>
                    </div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Visits Table */}
      <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden animate-fade-in">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-base font-semibold text-slate-900">All Visits</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                <th className="px-4 py-3 text-left font-medium">Participant</th>
                <th className="px-4 py-3 text-left font-medium">Study</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Location</th>
                <th className="px-4 py-3 text-left font-medium">Coordinator</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visits.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{v.participantName}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{v.studyName}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{v.type}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{v.date}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{v.time}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{v.location}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{v.coordinator}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ScheduleVisitDialog
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        participants={participants}
        studies={studies}
        onSchedule={scheduleVisit}
      />
    </div>
  );
}

function ScheduleVisitDialog({ open, onClose, participants, studies, onSchedule }: {
  open: boolean;
  onClose: () => void;
  participants: any[];
  studies: any[];
  onSchedule: (v: Visit) => void;
}) {
  const [participantId, setParticipantId] = useState('');
  const [type, setType] = useState('Screening');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  const handleSchedule = () => {
    const p = participants.find(p => p.id === participantId);
    if (!p || !date || !time) return;
    onSchedule({
      id: `v-${Date.now()}`,
      participantId: p.id,
      participantName: p.name,
      studyId: p.studyId,
      studyName: p.studyName,
      date,
      time,
      location: location || studies.find(s => s.id === p.studyId)?.researchSite || '',
      coordinator: 'Maya Rodriguez',
      type,
      status: 'scheduled',
    });
    onClose();
    setParticipantId('');
    setType('Screening');
    setDate('');
    setTime('');
    setLocation('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Visit</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Participant</Label>
            <Select value={participantId} onValueChange={setParticipantId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select participant" /></SelectTrigger>
              <SelectContent>
                {participants.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.id})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Visit Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {visitTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-sm">Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. City Hospital, Chennai" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSchedule} disabled={!participantId || !date || !time}>Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
