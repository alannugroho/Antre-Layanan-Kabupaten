import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type AuthRole = 'admin' | 'staff';

interface AuthSession {
  accessToken: string;
  role: AuthRole;
}

interface AuthContextValue {
  session: AuthSession | null;
  isReady: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
}

const STORAGE_KEY = 'web-rico-auth-session';

const AuthContext = createContext<AuthContextValue | null>(null);

function readSessionFromStorage(): AuthSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (typeof parsed.accessToken === 'string' && (parsed.role === 'admin' || parsed.role === 'staff')) {
      return { accessToken: parsed.accessToken, role: parsed.role };
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSessionState(readSessionFromStorage());
    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isReady,
      setSession: (nextSession) => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
        setSessionState(nextSession);
      },
      clearSession: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        setSessionState(null);
      }
    }),
    [isReady, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}