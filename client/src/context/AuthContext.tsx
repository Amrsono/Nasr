import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SystemSettings } from '../types';
import { api } from '../services/api';
import { joinSocketUser } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  demoUsers: User[];
  settings: SystemSettings | null;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchUser: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('nasr_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Fetch demo users and settings on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const [users, sysSettings] = await Promise.all([
          api.getDemoUsers().catch(() => []),
          api.getSettings().catch(() => null),
        ]);
        setDemoUsers(users);
        if (sysSettings) setSettings(sysSettings);
      } catch (err) {
        console.error('Failed to init auth meta', err);
      }
    };
    initData();
  }, []);

  // Fetch current user if token exists
  useEffect(() => {
    const loadUser = async () => {
      const savedToken = localStorage.getItem('nasr_token');
      if (savedToken) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          joinSocketUser(profile);
        } catch (err) {
          console.error('Auth token invalid, clearing...', err);
          localStorage.removeItem('nasr_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, [token]);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      let pw = password?.trim();
      if (!pw) {
        if (cleanEmail === 'admin@nasr.com') pw = 'admin123';
        else if (cleanEmail.startsWith('driver')) pw = 'driver123';
        else if (cleanEmail === 'amrsono@nasr.com') pw = 'customer123';
        else pw = '123456';
      }

      const res = await api.login(cleanEmail, pw);
      localStorage.setItem('nasr_token', res.token);
      setToken(res.token);
      setUser(res.user);
      joinSocketUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem('nasr_token', res.token);
      setToken(res.token);
      setUser(res.user);
      joinSocketUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('nasr_token');
    setToken(null);
    setUser(null);
  };

  const switchUser = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    let pw = 'admin123';
    if (cleanEmail.startsWith('driver')) pw = 'driver123';
    if (cleanEmail.startsWith('amrsono')) pw = 'customer123';
    await login(cleanEmail, pw);
  };

  const refreshUser = async () => {
    try {
      const profile = await api.getMe();
      setUser(profile);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  const refreshSettings = async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);
    } catch (err) {
      console.error('Failed to refresh settings', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        demoUsers,
        settings,
        login,
        register,
        logout,
        switchUser,
        refreshUser,
        refreshSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
