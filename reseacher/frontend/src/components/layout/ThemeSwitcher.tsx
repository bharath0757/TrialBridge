import { useState, useRef, useEffect } from 'react';
import { useTheme, THEME_CONFIGS, type ThemeMode } from '@/store/ThemeContext';
import { Moon, Sun, Sparkles, Zap, Check, ChevronDown, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'pure-dark':
        return <Moon className="h-4 w-4 text-purple-400" />;
      case 'pure-light':
        return <Sun className="h-4 w-4 text-amber-500" />;
      case 'white-glow':
        return <Sparkles className="h-4 w-4 text-blue-500" />;
      case 'dark-glow':
        return <Zap className="h-4 w-4 text-cyan-400" />;
    }
  };

  const activeConfig = THEME_CONFIGS[theme];

  return (
    <div className="relative" ref={containerRef}>
      {/* Theme Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={`Current Theme: ${activeConfig.name}`}
        aria-label="Change theme"
        className={cn(
          'flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-blue-400/40',
          theme === 'pure-dark' || theme === 'dark-glow'
            ? 'bg-zinc-900/90 text-zinc-200 border-zinc-700/80 hover:bg-zinc-800 hover:text-white shadow-xs'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
        )}
      >
        <span className="flex items-center justify-center">
          {getThemeIcon(theme)}
        </span>
        <span className="hidden sm:inline-block font-medium">{activeConfig.name}</span>
        <span
          className={cn(
            'hidden md:inline-flex text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md font-bold',
            theme === 'pure-dark'
              ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              : theme === 'pure-light'
              ? 'bg-slate-100 text-slate-700 border border-slate-200'
              : theme === 'white-glow'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
              : 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
          )}
        >
          {activeConfig.badge}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {/* Theme Selector Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl',
              theme === 'pure-dark' || theme === 'dark-glow'
                ? 'bg-zinc-950/95 border-zinc-800 text-white'
                : 'bg-white/95 border-slate-200/90 text-slate-900'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/60 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  Select Theme &amp; UI Mode
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">TrailBridge UI</span>
            </div>

            {/* Theme Options Grid */}
            <div className="space-y-2">
              {(Object.keys(THEME_CONFIGS) as ThemeMode[]).map((mode) => {
                const config = THEME_CONFIGS[mode];
                const isActive = theme === mode;

                return (
                  <button
                    key={mode}
                    onClick={() => {
                      setTheme(mode);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'group relative flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-all duration-200 border',
                      isActive
                        ? mode === 'pure-dark'
                          ? 'bg-zinc-900 border-zinc-600 shadow-md ring-1 ring-zinc-500'
                          : mode === 'pure-light'
                          ? 'bg-slate-50 border-slate-400 shadow-md ring-1 ring-slate-400'
                          : mode === 'white-glow'
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50/70 border-blue-300 shadow-[0_0_14px_rgba(59,130,246,0.25)] ring-1 ring-blue-400'
                          : 'bg-zinc-900 border-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                        : 'border-transparent hover:bg-slate-100/70 dark:hover:bg-zinc-900/60'
                    )}
                  >
                    {/* Visual Theme Preview Swatch */}
                    <div className="flex flex-col gap-0.5 shrink-0 w-8 h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-zinc-700 shadow-xs">
                      {mode === 'pure-dark' && (
                        <div className="w-full h-full bg-black flex">
                          <div className="w-2.5 h-full bg-zinc-900 border-r border-zinc-800" />
                          <div className="flex-1 bg-black p-0.5 flex flex-col justify-center">
                            <div className="h-1 w-3 bg-white rounded-xs mb-0.5" />
                            <div className="h-0.5 w-2 bg-zinc-400 rounded-xs" />
                          </div>
                        </div>
                      )}
                      {mode === 'pure-light' && (
                        <div className="w-full h-full bg-white flex">
                          <div className="w-2.5 h-full bg-slate-100 border-r border-slate-200" />
                          <div className="flex-1 bg-white p-0.5 flex flex-col justify-center">
                            <div className="h-1 w-3 bg-black rounded-xs mb-0.5" />
                            <div className="h-0.5 w-2 bg-slate-400 rounded-xs" />
                          </div>
                        </div>
                      )}
                      {mode === 'white-glow' && (
                        <div className="w-full h-full bg-slate-50 flex">
                          <div className="w-2.5 h-full bg-white border-r border-slate-200 relative flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_#3b82f6]" />
                          </div>
                          <div className="flex-1 bg-slate-100 p-0.5 flex flex-col justify-center">
                            <div className="h-1 w-3 bg-black rounded-xs mb-0.5" />
                            <div className="h-0.5 w-2 bg-blue-500 rounded-xs" />
                          </div>
                        </div>
                      )}
                      {mode === 'dark-glow' && (
                        <div className="w-full h-full bg-black flex">
                          <div className="w-2.5 h-full bg-zinc-950 border-r border-zinc-800 relative flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee]" />
                          </div>
                          <div className="flex-1 bg-black p-0.5 flex flex-col justify-center">
                            <div className="h-1 w-3 bg-white rounded-xs mb-0.5" />
                            <div className="h-0.5 w-2 bg-cyan-400 rounded-xs" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Theme Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          {config.name}
                        </span>
                        {isActive && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-zinc-300 mt-0.5">
                        {config.subtitle}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-snug mt-0.5">
                        {config.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Tip Footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/80 text-[10px] text-slate-500 dark:text-zinc-400 text-center flex items-center justify-center gap-1">
              <span>Preferences automatically saved to your browser session.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
