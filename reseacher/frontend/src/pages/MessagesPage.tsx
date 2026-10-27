import { useState } from 'react';
import { useTrialBridge } from '@/store/TrialBridgeContext';
import {
  MessageSquare,
  Send,
  FileText,
  Calendar,
  CheckSquare,
  FlaskConical,
  Bell,
  Search,
  Reply,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '@/types';

const messageTypeIcons: Record<string, any> = {
  consent_reminder: FileText,
  visit_reminder: Calendar,
  eligibility_review: CheckSquare,
  task_assignment: Bell,
  study_update: FlaskConical,
  general: MessageSquare,
};

const messageTypeColors: Record<string, string> = {
  consent_reminder: 'bg-purple-50 text-purple-600',
  visit_reminder: 'bg-blue-50 text-blue-600',
  eligibility_review: 'bg-green-50 text-green-600',
  task_assignment: 'bg-amber-50 text-amber-600',
  study_update: 'bg-slate-100 text-slate-600',
  general: 'bg-slate-100 text-slate-600',
};

export function MessagesPage() {
  const { messages, markMessageRead } = useTrialBridge();
  const [selectedId, setSelectedId] = useState<string | null>(messages[0]?.id || null);
  const [search, setSearch] = useState('');

  const filtered = messages.filter(
    (m) => m.subject.toLowerCase().includes(search.toLowerCase()) || m.from.toLowerCase().includes(search.toLowerCase())
  );
  const selected = messages.find((m) => m.id === selectedId);

  const handleSelect = (msg: Message) => {
    setSelectedId(msg.id);
    if (!msg.read) markMessageRead(msg.id);
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">{unreadCount > 0 ? `${unreadCount} unread messages` : 'All caught up'}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 rounded-2xl border border-slate-200/60 bg-white overflow-hidden animate-fade-in" style={{ minHeight: 480 }}>
        {/* Message List */}
        <div className="border-r border-slate-100 lg:col-span-1">
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[440px]">
            {filtered.map((msg) => {
              const Icon = messageTypeIcons[msg.type] || MessageSquare;
              return (
                <button
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={cn(
                    'w-full border-b border-slate-50 p-3 text-left transition-colors',
                    selected?.id === msg.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', messageTypeColors[msg.type])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn('truncate text-sm', msg.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900')}>
                          {msg.from}
                        </p>
                        <span className="shrink-0 text-[10px] text-slate-400">{msg.time}</span>
                      </div>
                      <p className={cn('truncate text-sm mt-0.5', msg.read ? 'text-slate-500' : 'font-medium text-slate-700')}>
                        {msg.subject}
                      </p>
                      <p className="truncate text-xs text-slate-400 mt-0.5">{msg.preview}</p>
                    </div>
                    {!msg.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-col p-5"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', messageTypeColors[selected.type])}>
                      {(() => { const Icon = messageTypeIcons[selected.type] || MessageSquare; return <Icon className="h-5 w-5" />; })()}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">{selected.subject}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">From {selected.from} · To {selected.to}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{selected.date} · {selected.time}</span>
                </div>

                <div className="flex-1 py-4">
                  <p className="text-sm text-slate-700 leading-relaxed">{selected.body}</p>
                </div>

                <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                  <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <Reply className="h-4 w-4" /> Reply
                  </button>
                  <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <Send className="h-4 w-4" /> Forward
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Notification types info */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 animate-fade-in">
        <h2 className="text-sm font-semibold text-slate-900">Notification Types</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(messageTypeIcons).map(([type, Icon]) => (
            <div key={type} className="flex items-center gap-2 rounded-xl border border-slate-100 p-3">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', messageTypeColors[type])}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs text-slate-600 capitalize">{type.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
