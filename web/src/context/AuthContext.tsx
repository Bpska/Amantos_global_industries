import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '../types';
import { api, getApiErrorMessage } from '../services/api';
import { clearStoredSession, getStoredToken, isUsableToken, subscribeToSessionExpiry, TOKEN_KEY, USER_KEY } from '../services/session';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  sessionError: string;
  retrySession: () => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const version = useRef(0);

  const logout = useCallback(() => {
    version.current++;
    clearStoredSession();
    setToken(null);
    setUser(null);
    setSessionError('');
    setIsLoading(false);
  }, []);

  useEffect(() => subscribeToSessionExpiry(logout), [logout]);

  useEffect(() => {
    let active = true;
    const currentVersion = ++version.current;
    const storedToken = getStoredToken();
    if (!isUsableToken(storedToken)) {
      logout();
      return;
    }

    setIsLoading(true);
    setSessionError('');
    const current = () => active && version.current === currentVersion && getStoredToken() === storedToken;
    api.me(storedToken).then((profile) => {
      if (!current()) return;
      if ((profile.role !== 'ADMIN' && profile.role !== 'SALESPERSON') || profile.active === false) {
        logout();
        return;
      }
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
      setUser(profile);
      setToken(storedToken);
    }).catch((error: unknown) => {
      if (current()) setSessionError(getApiErrorMessage(error, 'Unable to restore your session. Please try again.'));
    }).finally(() => {
      if (current()) setIsLoading(false);
    });

    return () => { active = false; };
  }, [attempt, logout]);

  useEffect(() => {
    const syncSession = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === null) {
        version.current++;
        setUser(null);
        setToken(null);
        setSessionError('');
        setIsLoading(true);
        setAttempt((value) => value + 1);
      }
    };
    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    version.current++;
    setToken(newToken);
    setUser(newUser);
    setSessionError('');
    setIsLoading(false);
  };

  const refreshUser = async () => {
    const storedToken = getStoredToken();
    const currentVersion = version.current;
    try {
      const profile = await api.me(storedToken);
      if (version.current !== currentVersion || getStoredToken() !== storedToken) return;
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
      setUser(profile);
    } catch (error) {
      if (version.current === currentVersion) {
        setSessionError(getApiErrorMessage(error, 'Unable to refresh your profile. Please try again.'));
      }
    }
  };

  const retrySession = () => { setIsLoading(true); setAttempt((value) => value + 1); };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, sessionError, retrySession, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
