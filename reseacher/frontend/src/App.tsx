import { useState, useEffect } from 'react';
import { TrialBridgeProvider, useTrialBridge } from '@/store/TrialBridgeContext';
import { AuthProvider, useAuth } from '@/store/AuthContext';
import { ThemeProvider, useTheme } from '@/store/ThemeContext';
import { Sidebar, type NavKey } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AdminDashboard } from '@/pages/dashboards/AdminDashboard';
import { PrincipalInvestigatorDashboard } from '@/pages/dashboards/PrincipalInvestigatorDashboard';
import { ResearchCoordinatorDashboard } from '@/pages/dashboards/ResearchCoordinatorDashboard';
import { SponsorDashboard } from '@/pages/dashboards/SponsorDashboard';
import { ParticipantPortal } from '@/pages/dashboards/ParticipantPortal';
import { LoginPage } from '@/pages/LoginPage';
import { StudiesPage } from '@/pages/StudiesPage';
import { ParticipantsPage } from '@/pages/ParticipantsPage';
import { ScreeningPage } from '@/pages/ScreeningPage';
import { ConsentPage } from '@/pages/ConsentPage';
import { VisitsPage } from '@/pages/VisitsPage';
import { TasksPage } from '@/pages/TasksPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SimulationLabPage } from '@/pages/SimulationLabPage';
import { EligibilityReviewsPage } from '@/pages/EligibilityReviewsPage';
import { AuditLogsPage } from '@/pages/AuditLogsPage';
import { OrganizationsPage } from '@/pages/OrganizationsPage';
import { UsersManagementPage } from '@/pages/UsersManagementPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { SecurityCompliancePage } from '@/pages/SecurityCompliancePage';
import { Toaster } from '@/components/ui/sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function AppContent() {
  const { dataError } = useTrialBridge();
  const { role, isAuthenticated, isLoading } = useAuth();
  const { isDark } = useTheme();
  const [currentNav, setCurrentNav] = useState<NavKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Reset to dashboard when role changes
  useEffect(() => {
    setCurrentNav(role === 'PARTICIPANT' ? 'home' : 'dashboard');
  }, [role]);

  if (isLoading) {
    return (
      <div className={cn('min-h-screen flex flex-col items-center justify-center gap-3 font-sans', isDark ? 'bg-slate-950 text-white' : 'bg-[#F8FAFC] text-slate-800')}>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black border border-zinc-800 p-0.5 overflow-hidden shadow-inner mb-2 animate-pulse">
          <img src="/logo.png" alt="TrialBridge" className="h-full w-full object-contain rounded-lg" />
        </div>
        <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">Loading TrialBridge...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderDashboard = () => {
    switch (role) {
      case 'PLATFORM_ADMIN': return <AdminDashboard />;
      case 'ORGANIZATION': return <SponsorDashboard />;
      case 'PRINCIPAL_INVESTIGATOR': return <PrincipalInvestigatorDashboard onNavigate={setCurrentNav} />;
      case 'RESEARCH_COORDINATOR': return <ResearchCoordinatorDashboard onNavigate={setCurrentNav} />;
      case 'PARTICIPANT': return <ParticipantPortal onNavigate={setCurrentNav} />;
      default: return <AdminDashboard />;
    }
  };

  const renderPage = () => {
    if (currentNav === 'dashboard' || currentNav === 'home') return renderDashboard();

    switch (currentNav) {
      case 'studies': return <StudiesPage />;
      case 'participants': return <ParticipantsPage />;
      case 'candidates': return <ParticipantsPage title="Candidates & Recruitment" description="Identify, manage, and evaluate clinical trial candidates" />;
      case 'screening': return <ScreeningPage />;
      case 'consent': return <ConsentPage />;
      case 'visits': return <VisitsPage />;
      case 'tasks': return <TasksPage />;
      case 'documents': return <DocumentsPage />;
      case 'messages': return <MessagesPage />;
      case 'reports': return <ReportsPage />;
      // Real Pages
      case 'organizations': return <OrganizationsPage />;
      case 'users': return <UsersManagementPage />;
      case 'platform-studies': return <StudiesPage />;
      case 'system-activity': return <AuditLogsPage />;
      case 'audit-logs': return <AuditLogsPage />;
      case 'security': 
        return role === 'PLATFORM_ADMIN'
          ? <SecurityCompliancePage />
          : <PlaceholderPage title="Access Restricted" description="Security & Compliance Control Center is restricted strictly to Platform Administrators." />;
      case 'support': return <PlaceholderPage title="Support & Helpdesk" description="Platform ticketing and researcher support." />;
      case 'research-sites': return <OrganizationsPage />;
      case 'team': return <UsersManagementPage />;
      case 'analytics': return <ReportsPage />;
      case 'my-studies': return <StudiesPage />;
      case 'eligibility-reviews': return <EligibilityReviewsPage />;
      case 'approvals': return <EligibilityReviewsPage />;
      case 'protocol': return <StudiesPage />;
      case 'study-visits': return <VisitsPage />;
      case 'simulation-lab': 
        return (role === 'PRINCIPAL_INVESTIGATOR' || role === 'RESEARCH_COORDINATOR') 
          ? <SimulationLabPage /> 
          : <PlaceholderPage title="Access Restricted" description="3D Simulation Lab & Molecular Workbench is restricted strictly to Principal Investigators and Researchers." />;
      case 'follow-ups': return <VisitsPage />;
      case 'my-appointments': return <VisitsPage />;
      case 'my-consent': return <ConsentPage />;
      case 'my-documents': return <DocumentsPage />;
      case 'notifications': return <NotificationsPage />;
      case 'profile': return <PlaceholderPage title="User Profile" description="Manage your credentials and preferences." />;
      case 'help': return <PlaceholderPage title="Help & FAQs" description="Participant guide and contact information." />;
      default: return renderDashboard();
    }
  };

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-200',
        isDark ? 'bg-black text-white' : 'bg-slate-50/50 text-slate-900'
      )}
    >
      <Sidebar
        current={currentNav}
        onNavigate={setCurrentNav}
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64')}>
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onNavigate={setCurrentNav}
        />

        <main className="p-4 lg:p-6">
          <div role="status" className="text-sm text-amber-800">{dataError}</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${role}-${currentNav}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Toaster richColors position="bottom-right" />
    </div>
  );
}

function SessionContent() {
  const { user } = useAuth();
  return <TrialBridgeProvider key={user?.id || 'signed-out'}><AppContent /></TrialBridgeProvider>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SessionContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
