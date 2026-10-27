import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { cn } from '@/lib/utils';
import { NotificationPopover } from '@/components/notifications/NotificationPopover';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import type { Role } from '@/types';

interface HeaderProps {
  onMenuClick: () => void;
  onNavigate?: (key: any) => void;
}

const roleLabels: Record<Role, string> = {
  PLATFORM_ADMIN: 'Platform Admin',
  ORGANIZATION: 'Organization',
  PRINCIPAL_INVESTIGATOR: 'Principal Investigator',
  RESEARCH_COORDINATOR: 'Research Coordinator',
  PARTICIPANT: 'Participant',
};

const roleColors: Record<Role, string> = {
  PLATFORM_ADMIN: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  ORGANIZATION: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  PRINCIPAL_INVESTIGATOR: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  RESEARCH_COORDINATOR: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  PARTICIPANT: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
};

export function Header({ onMenuClick, onNavigate }: HeaderProps) {
  const { user, logout, role } = useAuth();
  const { theme, isDark } = useTheme();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name || typeof name !== 'string' || !name.trim()) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  const userName = user?.name || user?.email || 'User';

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-16 items-center gap-3 px-4 backdrop-blur-md lg:px-6 transition-colors duration-200 border-b',
        isDark
          ? 'bg-black/90 border-zinc-800/90 text-white'
          : 'bg-white/90 border-slate-200/80 text-slate-900'
      )}
    >
      {/* Mobile open arrow button */}
      <button
        onClick={onMenuClick}
        aria-label="Open sidebar menu"
        title="Open navigation"
        className={cn(
          'flex items-center justify-center rounded-lg p-2 lg:hidden transition-colors',
          isDark
            ? 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
            : 'text-slate-700 hover:bg-slate-100'
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="relative hidden flex-1 md:block">
        <Search
          className={cn(
            'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
            isDark ? 'text-zinc-500' : 'text-slate-400'
          )}
        />
        <input
          type="text"
          placeholder="Search participants, studies, documents..."
          className={cn(
            'h-9 w-full max-w-md rounded-lg pl-10 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 border',
            isDark
              ? 'bg-zinc-900/80 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-zinc-700 focus:bg-zinc-900'
              : 'bg-slate-50/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white'
          )}
        />
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        {/* Interactive Theme Switcher */}
        <ThemeSwitcher />

        {/* Real-time Notifications Popover */}
        <NotificationPopover
          onNavigateToNotifications={() => onNavigate && onNavigate('notifications')}
        />

        {/* User Profile Dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className={cn(
              'flex items-center gap-2 rounded-full pl-1 pr-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 border border-transparent',
              isDark
                ? 'text-zinc-200 hover:bg-zinc-900 hover:border-zinc-800'
                : 'text-slate-700 hover:bg-slate-50 hover:border-slate-200'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-semibold text-white shadow-xs">
              {getInitials(userName)}
            </div>
            <div className="hidden lg:block text-left">
              <p
                className={cn(
                  'text-xs font-semibold leading-tight',
                  isDark ? 'text-white' : 'text-slate-800'
                )}
              >
                {userName}
              </p>
            </div>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 ml-1 transition-transform',
                isDark ? 'text-zinc-500' : 'text-slate-400',
                profileMenuOpen && 'rotate-180'
              )}
            />
          </button>
          
          <AnimatePresence>
            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  className={cn(
                    'absolute right-0 top-full z-20 mt-1.5 w-64 rounded-xl border p-2 shadow-xl backdrop-blur-md',
                    isDark
                      ? 'bg-zinc-950 border-zinc-800 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  )}
                >
                  <div
                    className={cn(
                      'px-3 py-2 border-b mb-1',
                      isDark ? 'border-zinc-800' : 'border-slate-100'
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm font-semibold truncate',
                        isDark ? 'text-white' : 'text-slate-900'
                      )}
                    >
                      {userName}
                    </p>
                    <p
                      className={cn(
                        'text-xs truncate mb-2',
                        isDark ? 'text-zinc-400' : 'text-slate-500'
                      )}
                    >
                      {user?.email}
                    </p>
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', roleColors[role])}>
                      {roleLabels[role]}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      logout();
                      setProfileMenuOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors',
                      isDark ? 'hover:bg-red-950/40' : 'hover:bg-red-50'
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
