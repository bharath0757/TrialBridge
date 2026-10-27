import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FlaskConical,
  Users,
  Brain,
  FileSignature,
  Calendar,
  CheckSquare,
  Folder,
  MessageSquare,
  BarChart3,
  LifeBuoy,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Building2,
  Activity,
  ShieldAlert,
  ShieldCheck,
  FileText,
  ClipboardCheck,
  TestTube2,
  Clock,
  Home,
  User,
  Bell
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/types';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';

export type NavKey =
  | 'dashboard' | 'organizations' | 'users' | 'platform-studies' | 'system-activity' | 'audit-logs' | 'security' | 'reports' | 'support'
  | 'studies' | 'research-sites' | 'team' | 'participants' | 'analytics' | 'documents' | 'messages'
  | 'my-studies' | 'eligibility-reviews' | 'protocol' | 'study-visits' | 'approvals' | 'simulation-lab'
  | 'candidates' | 'screening' | 'consent' | 'visits' | 'tasks' | 'follow-ups'
  | 'home' | 'my-appointments' | 'my-consent' | 'my-documents' | 'notifications' | 'profile' | 'help';

interface NavItem {
  key: NavKey;
  label: string;
  icon: LucideIcon;
}

const navConfigs: Record<Role, NavItem[]> = {
  PLATFORM_ADMIN: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'organizations', label: 'Organizations', icon: Building2 },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'platform-studies', label: 'Platform Studies', icon: FlaskConical },
    { key: 'system-activity', label: 'System Activity', icon: Activity },
    { key: 'audit-logs', label: 'Audit Logs', icon: FileText },
    { key: 'security', label: 'Security', icon: ShieldAlert },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'support', label: 'Support', icon: LifeBuoy },
  ],
  ORGANIZATION: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'studies', label: 'Studies', icon: FlaskConical },
    { key: 'research-sites', label: 'Research Sites', icon: Building2 },
    { key: 'team', label: 'Team', icon: Users },
    { key: 'participants', label: 'Participants', icon: Users },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'documents', label: 'Documents', icon: Folder },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'reports', label: 'Reports', icon: FileText },
  ],
  PRINCIPAL_INVESTIGATOR: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'my-studies', label: 'My Studies', icon: FlaskConical },
    { key: 'eligibility-reviews', label: 'Eligibility Reviews', icon: ClipboardCheck },
    { key: 'participants', label: 'Participants', icon: Users },
    { key: 'protocol', label: 'Protocol', icon: FileText },
    { key: 'study-visits', label: 'Study Visits', icon: Calendar },
    { key: 'approvals', label: 'Approvals', icon: ShieldCheck },
    { key: 'documents', label: 'Documents', icon: Folder },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'simulation-lab', label: 'Simulation Lab', icon: TestTube2 },
  ],
  RESEARCH_COORDINATOR: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'my-studies', label: 'My Studies', icon: FlaskConical },
    { key: 'simulation-lab', label: 'Simulation Lab', icon: TestTube2 },
    { key: 'candidates', label: 'Candidates', icon: Users },
    { key: 'screening', label: 'Screening', icon: Brain },
    { key: 'consent', label: 'Consent', icon: FileSignature },
    { key: 'visits', label: 'Visits', icon: Calendar },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare },
    { key: 'documents', label: 'Documents', icon: Folder },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'follow-ups', label: 'Follow-ups', icon: Clock },
  ],
  PARTICIPANT: [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'my-studies', label: 'My Studies', icon: FlaskConical },
    { key: 'my-appointments', label: 'My Appointments', icon: Calendar },
    { key: 'my-consent', label: 'My Consent', icon: FileSignature },
    { key: 'my-documents', label: 'My Documents', icon: Folder },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'help', label: 'Help', icon: HelpCircle },
  ],
};

// Re-icons: Domain-specific tailored radiant gradients
const reiconGradients: Record<string, { bg: string; shadow: string }> = {
  dashboard: { bg: 'from-blue-600 to-cyan-500', shadow: 'shadow-blue-500/30' },
  'simulation-lab': { bg: 'from-emerald-500 to-teal-400', shadow: 'shadow-emerald-500/30' },
  studies: { bg: 'from-indigo-600 to-purple-500', shadow: 'shadow-indigo-500/30' },
  'my-studies': { bg: 'from-indigo-600 to-purple-500', shadow: 'shadow-indigo-500/30' },
  'platform-studies': { bg: 'from-indigo-600 to-purple-500', shadow: 'shadow-indigo-500/30' },
  candidates: { bg: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/30' },
  participants: { bg: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/30' },
  team: { bg: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/30' },
  users: { bg: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/30' },
  screening: { bg: 'from-purple-600 to-pink-500', shadow: 'shadow-purple-500/30' },
  'eligibility-reviews': { bg: 'from-purple-600 to-pink-500', shadow: 'shadow-purple-500/30' },
  consent: { bg: 'from-rose-500 to-red-600', shadow: 'shadow-rose-500/30' },
  'my-consent': { bg: 'from-rose-500 to-red-600', shadow: 'shadow-rose-500/30' },
  visits: { bg: 'from-sky-500 to-blue-600', shadow: 'shadow-sky-500/30' },
  'study-visits': { bg: 'from-sky-500 to-blue-600', shadow: 'shadow-sky-500/30' },
  'my-appointments': { bg: 'from-sky-500 to-blue-600', shadow: 'shadow-sky-500/30' },
  tasks: { bg: 'from-teal-500 to-emerald-600', shadow: 'shadow-teal-500/30' },
  documents: { bg: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
  'my-documents': { bg: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
  messages: { bg: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/30' },
  'follow-ups': { bg: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/30' },
  reports: { bg: 'from-violet-600 to-indigo-600', shadow: 'shadow-violet-500/30' },
  analytics: { bg: 'from-violet-600 to-indigo-600', shadow: 'shadow-violet-500/30' },
  'system-activity': { bg: 'from-fuchsia-600 to-purple-600', shadow: 'shadow-fuchsia-500/30' },
  'audit-logs': { bg: 'from-fuchsia-600 to-purple-600', shadow: 'shadow-fuchsia-500/30' },
  security: { bg: 'from-emerald-600 to-teal-600', shadow: 'shadow-emerald-500/30' },
  approvals: { bg: 'from-emerald-600 to-teal-600', shadow: 'shadow-emerald-500/30' },
  organizations: { bg: 'from-blue-600 to-slate-700', shadow: 'shadow-blue-600/30' },
  'research-sites': { bg: 'from-blue-600 to-slate-700', shadow: 'shadow-blue-600/30' },
  protocol: { bg: 'from-sky-500 to-cyan-600', shadow: 'shadow-sky-500/30' },
  notifications: { bg: 'from-amber-500 to-red-500', shadow: 'shadow-amber-500/30' },
  home: { bg: 'from-blue-600 to-indigo-600', shadow: 'shadow-blue-500/30' },
  profile: { bg: 'from-slate-600 to-zinc-800', shadow: 'shadow-slate-600/30' },
  support: { bg: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-500/30' },
  help: { bg: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-500/30' },
};

interface SidebarProps {
  current: NavKey;
  onNavigate: (key: NavKey) => void;
  role: Role;
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  current,
  onNavigate,
  role,
  open,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const { user } = useAuth();
  const { theme, isWhiteNav, hasGlowingNav, hasReicons } = useTheme();
  const navItems = navConfigs[role] || navConfigs.PARTICIPANT;
  
  const roleLabel: Record<Role, string> = {
    PLATFORM_ADMIN: 'Platform Admin',
    ORGANIZATION: 'Organization',
    PRINCIPAL_INVESTIGATOR: 'Principal Investigator',
    RESEARCH_COORDINATOR: 'Research Coordinator',
    PARTICIPANT: 'Participant',
  };

  const getInitials = (name?: string) => {
    if (!name || typeof name !== 'string' || !name.trim()) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col sidebar-transition lg:translate-x-0',
          collapsed ? 'w-20' : 'w-64',
          open ? 'translate-x-0' : '-translate-x-full',
          isWhiteNav
            ? 'bg-white text-slate-900 border-r border-slate-200/90 shadow-sm'
            : theme === 'pure-light'
            ? 'bg-slate-50 text-slate-900 border-r border-slate-200'
            : 'bg-black text-white border-r border-zinc-800'
        )}
      >
        {/* Floating docked arrow toggle button for desktop */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden lg:flex absolute -right-3 top-5 z-50 h-6 w-6 items-center justify-center rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md',
              isWhiteNav || theme === 'pure-light'
                ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        {/* Logo & Brand Header */}
        <div
          className={cn(
            'flex items-center py-4 transition-all duration-300 border-b',
            isWhiteNav || theme === 'pure-light'
              ? 'border-slate-200/90'
              : 'border-zinc-800/90',
            collapsed ? 'justify-center px-3' : 'justify-between px-4'
          )}
        >
          <div
            onClick={collapsed ? onToggleCollapse : undefined}
            className={cn(
              'flex items-center gap-3 overflow-hidden',
              collapsed && 'cursor-pointer'
            )}
            title={collapsed ? 'Click to expand sidebar' : undefined}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black border border-zinc-800 p-0.5 overflow-hidden shadow-inner">
              <img
                src="/logo.png"
                alt="TrailBridge Logo"
                className="h-full w-full object-contain rounded-lg"
              />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <h1
                  className={cn(
                    'truncate text-base font-bold tracking-tight',
                    isWhiteNav || theme === 'pure-light' ? 'text-slate-900' : 'text-white'
                  )}
                >
                  TrailBridge
                </h1>
                <p
                  className={cn(
                    'truncate text-[10px] font-medium',
                    isWhiteNav || theme === 'pure-light' ? 'text-slate-500' : 'text-zinc-400'
                  )}
                >
                  Clinical Research Platform
                </p>
              </div>
            )}
          </div>

          {/* Mobile close arrow button */}
          <button
            onClick={onClose}
            title="Close sidebar"
            aria-label="Close sidebar"
            className={cn(
              'flex lg:hidden h-8 w-8 items-center justify-center rounded-lg transition-colors',
              isWhiteNav || theme === 'pure-light'
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            )}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {!collapsed && (
            <p
              className={cn(
                'px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-wider',
                isWhiteNav || theme === 'pure-light' ? 'text-slate-400' : 'text-zinc-500'
              )}
            >
              Menu
            </p>
          )}
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = current === item.key;
              const reicon = reiconGradients[item.key] || { bg: 'from-blue-600 to-indigo-600', shadow: 'shadow-blue-500/25' };

              return (
                <li key={item.key}>
                  <button
                    onClick={() => {
                      onNavigate(item.key);
                      onClose();
                    }}
                    title={item.label}
                    className={cn(
                      'group relative flex w-full items-center rounded-xl text-sm font-medium transition-all duration-200',
                      collapsed
                        ? 'justify-center p-2.5'
                        : 'gap-3 px-3 py-2',
                      // Glowing Navigation button mode
                      hasGlowingNav && isActive
                        ? 'nav-button-glow-active'
                        : hasGlowingNav
                        ? isWhiteNav
                          ? 'text-slate-700 hover:bg-blue-50/50 hover:text-blue-700 nav-button-glow-hover'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 nav-button-glow-hover'
                        : // Standard button mode
                        isActive
                        ? isWhiteNav || theme === 'pure-light'
                          ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-200'
                          : 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                        : isWhiteNav || theme === 'pure-light'
                        ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                    )}
                  >
                    {/* Glowing active pillar */}
                    {hasGlowingNav && isActive && (
                      <span className="nav-button-glow-pillar" />
                    )}

                    {/* Re-icon: Upgraded Luminous Gradient Micro-badge */}
                    {hasReicons ? (
                      <div
                        className={cn(
                          'reicon-pod bg-gradient-to-br text-white',
                          reicon.bg,
                          reicon.shadow,
                          collapsed ? 'h-8 w-8' : 'h-7 w-7',
                          isActive && 'reicon-active'
                        )}
                      >
                        <item.icon className="h-4 w-4 text-white drop-shadow-xs" />
                      </div>
                    ) : (
                      <item.icon
                        className={cn(
                          'shrink-0 transition-colors',
                          collapsed ? 'h-5 w-5' : 'h-4.5 w-4.5',
                          isActive
                            ? isWhiteNav
                              ? 'text-blue-600'
                              : 'text-blue-400'
                            : isWhiteNav
                            ? 'text-slate-500 group-hover:text-slate-800'
                            : 'text-zinc-400 group-hover:text-zinc-200'
                        )}
                        style={{
                          width: collapsed ? '1.25rem' : '1.125rem',
                          height: collapsed ? '1.25rem' : '1.125rem',
                        }}
                      />
                    )}

                    {!collapsed && (
                      <span className={cn('truncate', isActive && 'font-semibold')}>
                        {item.label}
                      </span>
                    )}

                    {/* Standard active dot (when not in glowing nav mode) */}
                    {!hasGlowingNav && isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className={cn(
                          'rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]',
                          collapsed
                            ? 'absolute right-1 top-1 h-2 w-2'
                            : 'ml-auto h-1.5 w-1.5'
                        )}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {!collapsed && (
            <p
              className={cn(
                'px-3 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-wider',
                isWhiteNav || theme === 'pure-light' ? 'text-slate-400' : 'text-zinc-500'
              )}
            >
              Support
            </p>
          )}
          <ul
            className={cn(
              'space-y-1',
              collapsed &&
                (isWhiteNav || theme === 'pure-light'
                  ? 'pt-4 border-t border-slate-200 mt-2'
                  : 'pt-4 border-t border-zinc-800/80 mt-2')
            )}
          >
            <li>
              <button
                title="Help & Support"
                className={cn(
                  'group flex w-full items-center rounded-xl text-sm font-medium transition-colors',
                  collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                  isWhiteNav || theme === 'pure-light'
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                )}
              >
                {hasReicons ? (
                  <div className="reicon-pod bg-gradient-to-br from-cyan-500 to-blue-500 text-white h-7 w-7 shadow-cyan-500/20">
                    <LifeBuoy className="h-4 w-4" />
                  </div>
                ) : (
                  <LifeBuoy className="h-4.5 w-4.5" />
                )}
                {!collapsed && <span>Help &amp; Support</span>}
              </button>
            </li>
            <li>
              <button
                title="Settings"
                className={cn(
                  'group flex w-full items-center rounded-xl text-sm font-medium transition-colors',
                  collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                  isWhiteNav || theme === 'pure-light'
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                )}
              >
                {hasReicons ? (
                  <div className="reicon-pod bg-gradient-to-br from-slate-600 to-zinc-700 text-white h-7 w-7 shadow-slate-500/20">
                    <Settings className="h-4 w-4" />
                  </div>
                ) : (
                  <Settings className="h-4.5 w-4.5" />
                )}
                {!collapsed && <span>Settings</span>}
              </button>
            </li>
          </ul>
        </nav>

        {/* User Profile */}
        <div
          className={cn(
            'border-t p-3 transition-colors',
            isWhiteNav || theme === 'pure-light'
              ? 'border-slate-200/90 bg-white'
              : 'border-zinc-800/90 bg-black'
          )}
        >
          <div
            className={cn(
              'flex items-center rounded-xl py-2 cursor-pointer transition-colors',
              isWhiteNav || theme === 'pure-light'
                ? 'hover:bg-slate-100'
                : 'hover:bg-zinc-900',
              collapsed ? 'justify-center px-1' : 'gap-3 px-3'
            )}
            title={user?.name || 'User'}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-semibold text-white shadow-sm">
              {user ? getInitials(user?.name || user?.email) : 'U'}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-sm font-medium',
                      isWhiteNav || theme === 'pure-light' ? 'text-slate-900' : 'text-white'
                    )}
                  >
                    {user?.name || 'User'}
                  </p>
                  <p
                    className={cn(
                      'truncate text-xs',
                      isWhiteNav || theme === 'pure-light' ? 'text-slate-500' : 'text-zinc-400'
                    )}
                  >
                    {roleLabel[role]}
                  </p>
                </div>
                <HelpCircle
                  className={cn(
                    'h-4 w-4',
                    isWhiteNav || theme === 'pure-light' ? 'text-slate-400' : 'text-zinc-500'
                  )}
                />
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
