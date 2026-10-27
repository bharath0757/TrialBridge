import { motion } from 'framer-motion';

export function PlaceholderPage({ title, description }: { title: string, description: string }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200/60 bg-white p-12 text-center shadow-sm"
      >
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Coming Soon</h2>
        <p className="text-slate-500">This page is currently under development.</p>
      </motion.div>
    </div>
  );
}
