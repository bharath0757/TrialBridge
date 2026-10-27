import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser, Role } from '@/types';
import api from '@/lib/api';
import { apiErrorMessage } from '@/lib/apiError';
interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionError: string;
  role: Role;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | null>(null);
const roles = ['PLATFORM_ADMIN', 'ORGANIZATION', 'PRINCIPAL_INVESTIGATOR', 'RESEARCH_COORDINATOR', 'PARTICIPANT'];
function validUser(value: AuthUser): boolean {
  return !!value && typeof value.id === 'string' && typeof value.email === 'string' && roles.includes(value.role);
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const logout = useCallback(() => {
    localStorage.removeItem('trialbridge_token');
    localStorage.removeItem('trialbridge_user');
    setToken(null); setUser(null);
  }, []);
  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const saved = localStorage.getItem('trialbridge_token');
        if (!saved || saved.startsWith('demo-') || saved === 'undefined' || saved === 'null') {
          if (active) logout();
          return;
        }
        const { data } = await api.get<AuthUser>('/auth/me');
        if (!validUser(data)) throw new Error('The server returned an invalid session. Please sign in again.');
        if (active) { setUser(data); setToken(saved); }
      } catch (error) {
        if (active) { logout(); setSessionError(apiErrorMessage(error)); }
      } finally { if (active) setIsLoading(false); }
    }
    void restoreSession();
    return () => { active = false; };
  }, [logout]);
  const login = async (email: string, password?: string) => {
    const { data } = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
    if (typeof data?.access_token !== 'string' || !validUser(data?.user)) throw new Error('The server returned an invalid sign-in response. Please try again later.');
    localStorage.setItem('trialbridge_token', data.access_token);
    localStorage.setItem('trialbridge_user', JSON.stringify(data.user));
    setSessionError(''); setToken(data.access_token); setUser(data.user);
  };
  return <AuthContext.Provider value={{user, token, isAuthenticated: !!user && !!token, isLoading, sessionError, role: user?.role || 'PARTICIPANT', login, logout}}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
