import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('retailflow_admin_jwt'));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('retailflow_admin_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('retailflow_admin_jwt');
      if (storedToken) {
        try {
          const profile = await api.me();
          if (profile.role !== 'ADMIN') {
            logout();
          } else {
            setUser(profile);
            localStorage.setItem('retailflow_admin_user', JSON.stringify(profile));
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('retailflow_admin_jwt', newToken);
    localStorage.setItem('retailflow_admin_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('retailflow_admin_jwt');
    localStorage.removeItem('retailflow_admin_user');
  };

  const refreshUser = async () => {
    try {
      const profile = await api.me();
      setUser(profile);
      localStorage.setItem('retailflow_admin_user', JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

