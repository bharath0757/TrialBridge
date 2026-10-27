import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type {
  Study,
  Participant,
  Visit,
  Task,
  ConsentRecord,
  Document,
  Message,
  Role,
  ScreeningStatus,
  ConsentStatus,
  EnrollmentStatus,
} from '@/types';
import { useAuth } from './AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/lib/apiError';

interface TrialBridgeContextType {
  dataError: string;
  role: Role;
  setRole: (role: Role) => void;
  studies: Study[];
  participants: Participant[];
  visits: Visit[];
  tasks: Task[];
  consentRecords: ConsentRecord[];
  documents: Document[];
  messages: Message[];
  addStudy: (study: Study) => Promise<void>;
  approveScreening: (participantId: string, reviewerName: string, notes: string) => void;
  rejectScreening: (participantId: string, reviewerName: string, notes: string) => void;
  updateConsentStatus: (participantId: string, status: ConsentStatus) => void;
  enrollParticipant: (participantId: string) => void;
  scheduleVisit: (visit: Visit) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  markMessageRead: (messageId: string) => void;
  refreshData: () => Promise<void>;
  refreshStudies: () => Promise<void>;
}

const TrialBridgeContext = createContext<TrialBridgeContextType | null>(null);

export function TrialBridgeProvider({ children }: { children: ReactNode }) {
  const { role, isAuthenticated } = useAuth();
  
  const [dataError, setDataError] = useState('');
  const [studies, setStudies] = useState<Study[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Fast single-resource study refresh
  const refreshStudies = useCallback(async () => {
    try {
      const res = await api.get('/studies/');
      if (Array.isArray(res.data)) {
        setStudies(res.data);
      }
    } catch (err) {
      console.warn('Fast study refresh warning:', err);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    if (!isAuthenticated) return;
    let failed = false;
    const unavailable = () => { failed = true; return { data: [] }; };
    try {
      const [
        studiesRes,
        participantsRes,
        visitsRes,
        tasksRes,
        consentRes,
        documentsRes,
        messagesRes
      ] = await Promise.all([
        api.get('/studies/').catch(unavailable),
        api.get('/participants/').catch(unavailable),
        api.get('/visits/').catch(unavailable),
        api.get('/tasks/').catch(unavailable),
        api.get('/consent-records/').catch(unavailable),
        api.get('/documents/').catch(unavailable),
        api.get('/messages/').catch(unavailable)
      ]);

      setDataError(failed ? 'Some data could not be loaded. Please try again shortly.' : '');
      if (Array.isArray(studiesRes.data)) setStudies(studiesRes.data);
      if (Array.isArray(participantsRes.data)) setParticipants(participantsRes.data);
      if (Array.isArray(visitsRes.data)) setVisits(visitsRes.data);
      if (Array.isArray(tasksRes.data)) setTasks(tasksRes.data);
      if (Array.isArray(consentRes.data)) setConsentRecords(consentRes.data);
      if (Array.isArray(documentsRes.data)) setDocuments(documentsRes.data);
      if (Array.isArray(messagesRes.data)) setMessages(messagesRes.data);
    } catch (error) {
      console.error('Error fetching initial data', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchInitialData();

    // Zero-latency instant hydration via WebSocket broadcast
    const handleStudyCreated = (e: any) => {
      const newStudy = e.detail?.study;
      if (newStudy && (newStudy.id || newStudy.study_code)) {
        setStudies((prev) => {
          const exists = prev.some(
            (s) => s.id === newStudy.id || (s as any).study_code === newStudy.study_code
          );
          if (exists) {
            return prev.map((s) =>
              s.id === newStudy.id || (s as any).study_code === newStudy.study_code
                ? { ...s, ...newStudy }
                : s
            );
          }
          return [newStudy, ...prev];
        });
      } else {
        refreshStudies();
      }
    };

    const handleReviewsUpdated = () => refreshStudies();

    window.addEventListener('trialbridge:study_created', handleStudyCreated);
    window.addEventListener('trialbridge:reviews_updated', handleReviewsUpdated);
    return () => {
      window.removeEventListener('trialbridge:study_created', handleStudyCreated);
      window.removeEventListener('trialbridge:reviews_updated', handleReviewsUpdated);
    };
  }, [isAuthenticated, refreshStudies, fetchInitialData]);

  const addStudy = useCallback(async (study: Study) => {
    try {
      const res = await api.post('/studies/', study);
      const created = res.data;
      if (created && (created.id || created.study_code)) {
        setStudies((prev) => [
          created,
          ...prev.filter((s) => s.id !== study.id && s.id !== created.id)
        ]);
      }
    } catch (e) {
      toast.error(apiErrorMessage(e));
      throw e;
    }
  }, []);


  const approveScreening = useCallback(async (participantId: string, reviewerName: string, notes: string) => {
    try {
      await api.post(`/participants/${participantId}/approve-screening`, { reviewerName, notes });
      fetchInitialData();
    } catch (e) {
      toast.error(apiErrorMessage(e));
      throw e;
    }
  }, [fetchInitialData]);

  const rejectScreening = useCallback(async (participantId: string, reviewerName: string, notes: string) => {
    try {
      await api.post(`/participants/${participantId}/reject-screening`, { reviewerName, notes });
      fetchInitialData();
    } catch (e) {
      toast.error(apiErrorMessage(e));
      throw e;
    }
  }, [fetchInitialData]);

  const updateConsentStatus = useCallback(async (participantId: string, status: ConsentStatus) => {
    try {
      await api.patch(`/participants/${participantId}/consent`, { status });
      fetchInitialData();
    } catch (e) {
      toast.error(apiErrorMessage(e));
      throw e;
    }
  }, [fetchInitialData]);

  const enrollParticipant = useCallback(async (participantId: string) => {
    try {
      await api.post(`/participants/${participantId}/enroll`);
      fetchInitialData();
    } catch (e) {
      toast.error(apiErrorMessage(e));
      throw e;
    }
  }, [fetchInitialData]);

  const scheduleVisit = useCallback(async (visit: Visit) => {
    try {
      const res = await api.post('/visits', visit);
      setVisits((prev) => [...prev, res.data]);
    } catch (e) {
      toast.error(apiErrorMessage(e));
      throw e;
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    } catch (e) {
      toast.error(apiErrorMessage(e));
      throw e;
    }
  }, []);

  const markMessageRead = useCallback(async (messageId: string) => {
    try {
      await api.patch(`/messages/${messageId}/read`);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, read: true } : m)));
    } catch (e) {
      toast.error(apiErrorMessage(e));
      throw e;
    }
  }, []);

  return (
    <TrialBridgeContext.Provider
      value={{
        dataError,
        role,
        setRole: () => {}, // No-op, role comes from AuthContext
        studies,
        participants,
        visits,
        tasks,
        consentRecords,
        documents,
        messages,
        addStudy,
        approveScreening,
        rejectScreening,
        updateConsentStatus,
        enrollParticipant,
        scheduleVisit,
        updateTaskStatus,
        markMessageRead,
        refreshData: fetchInitialData,
        refreshStudies,
      }}
    >
      {children}
    </TrialBridgeContext.Provider>
  );
}

export function useTrialBridge() {
  const ctx = useContext(TrialBridgeContext);
  if (!ctx) throw new Error('useTrialBridge must be used within TrialBridgeProvider');
  return ctx;
}
