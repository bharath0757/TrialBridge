import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/store/AuthContext';
import api from '@/lib/api';
import type { Notification } from '@/types';
import { toast } from 'sonner';

export function useRealTimeNotifications() {
  const { user, token, role, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);

  // Compute unread count from notifications list
  const updateCount = useCallback((list: Notification[]) => {
    const unread = list.filter((n) => !n.read).length;
    setUnreadCount(unread);
  }, []);

  // Fetch initial notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications/');
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
        updateCount(res.data);
      }
    } catch (err) {
      console.warn('Failed fetching notifications:', err);
    }
  }, [isAuthenticated, updateCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // WebSocket Connection Management
  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    if (!token) return;
    const configured = import.meta.env.VITE_WS_URL;
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    // Firebase Hosting cannot carry WebSocket upgrades. Poll unless a direct
    // backend WebSocket URL is configured.
    if (!configured && !isLocal) {
      const timer = setInterval(() => { void fetchNotifications(); }, 30000);
      return () => clearInterval(timer);
    }
    const socketURL = new URL(configured || 'ws://localhost:8000/api/ws/notifications');
    socketURL.searchParams.set('token', token);
    const wsUrl = socketURL.toString();

    let isUnmounted = false;

    const connectWebSocket = () => {
      if (isUnmounted) return;
      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          // Set up keepalive ping every 25 seconds
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.event === 'NOTIFICATION_RECEIVED' && data.notification) {
              const newNotif: Notification = data.notification;
              setNotifications((prev) => {
                const next = [newNotif, ...prev.filter((n) => n.id !== newNotif.id)];
                updateCount(next);
                return next;
              });

              toast.info(newNotif.title, {
                description: newNotif.message,
                duration: 6000,
              });
            } else if (data.event === 'TRIAL_DECISION_ACCEPTED') {
              toast.success(`Trial Invitation Accepted`, {
                description: `${data.participant_name || 'Participant'} accepted! Baseline clinical intake visit scheduled.`,
                duration: 7000,
              });
              fetchNotifications();
            } else if (data.event === 'TRIAL_DECISION_REJECTED') {
              toast.error(`Trial Invitation Declined`, {
                description: data.message || 'Participant declined clinical trial invitation.',
                duration: 5000,
              });
              fetchNotifications();
            } else if (data.event === 'STUDY_CREATED') {
              toast.info(`New Study Published: ${data.study_title || 'Clinical Trial'}`, {
                description: `Created by ${data.principal_investigator || 'PI'}. Candidate intake now open.`,
                duration: 8000,
              });
              window.dispatchEvent(new CustomEvent('trialbridge:study_created', { detail: data }));
              fetchNotifications();
            } else if (data.event === 'ELIGIBILITY_REVIEW_REQUESTED') {
              if (role === 'PRINCIPAL_INVESTIGATOR' || role === 'PLATFORM_ADMIN') {
                toast.info(`Eligibility Reviews Awaiting Sign-off`, {
                  description: `${data.coordinator_name || 'Coordinator'} submitted ${data.count || ''} candidates in ${data.study_title || 'Study'}.`,
                  duration: 8000,
                });
              }
              window.dispatchEvent(new CustomEvent('trialbridge:reviews_updated', { detail: data }));
              fetchNotifications();
            } else if (data.event === 'ELIGIBILITY_REVIEW_FINALIZED') {
              toast.success(`Authoritative Sign-off Recorded`, {
                description: `Participant ${data.participant_code}: ${data.decision} by PI.`,
                duration: 7000,
              });
              window.dispatchEvent(new CustomEvent('trialbridge:reviews_updated', { detail: data }));
              fetchNotifications();
            } else if (data.event === 'ADMET_REVIEW_REQUESTED') {
              if (role === 'PRINCIPAL_INVESTIGATOR') {
                toast.info(`ADMET Review Requested`, {
                  description: `${data.coordinator_name} submitted simulation ${data.analysis_id} for your sign-off.`,
                  duration: 8000,
                });
              }
              fetchNotifications();
            } else if (data.event === 'ADMET_REVIEW_COMPLETED') {
              toast.success(`ADMET Final Sign-Off Recorded`, {
                description: `Investigator ${data.reviewer_name} marked simulation as ${data.decision}. Review lifecycle complete.`,
                duration: 7000,
              });
              fetchNotifications();
            }

          } catch {
            // ping response or non-json message
          }
        };

        ws.onerror = (e) => {
          console.debug('WebSocket notification error:', e);
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          if (!isUnmounted) {
            // Exponential backoff reconnect
            reconnectTimeoutRef.current = setTimeout(() => {
              if (!isUnmounted) connectWebSocket();
            }, 3000);
          }
        };
      } catch (e) {
        console.warn('WebSocket connection attempt failed:', e);
      }
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (socketRef.current) {
        const ws = socketRef.current;
        socketRef.current = null;
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => {
            try { ws.close(); } catch (_) {}
          };
        } else if (ws.readyState === WebSocket.OPEN) {
          try { ws.close(); } catch (_) {}
        }
      }
    };
  }, [isAuthenticated, token, role, user?.id, fetchNotifications, updateCount]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      updateCount(next);
      return next;
    });
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // Local optimistic update
    }
  }, [updateCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      updateCount(next);
      return next;
    });
    try {
      await api.patch('/notifications/read-all');
    } catch {
      // Local optimistic update
    }
  }, [updateCount]);

  // Take action on notification (e.g. ACCEPT or REJECT trial invitation)
  const takeAction = useCallback(async (notificationId: string, action: 'ACCEPT' | 'REJECT', _meta?: Record<string, unknown>) => {
    try {
      await api.post(`/notifications/${notificationId}/action`, { action });
      await fetchNotifications();
      toast.success(action === 'ACCEPT' ? 'Trial invitation accepted' : 'Trial invitation declined');
    } catch (error) {
      toast.error('Your decision could not be saved. Please try again.');
      throw error;
    }
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    takeAction,
    refetch: fetchNotifications,
  };
}
