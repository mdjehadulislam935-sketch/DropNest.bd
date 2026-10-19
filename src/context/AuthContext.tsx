import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiService } from '../services/api.ts';
import type { UserAccount, UserRole } from '../types/platform.ts';

interface AuthContextType {
  user: UserAccount | null;
  role: UserRole | null;
  token: string | null;
  loginTimestamp: string | null;
  platformVersion: string;
  isLoading: boolean;
  login: (credential: string, pass: string, expectedRole?: UserRole) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loginTimestamp, setLoginTimestamp] = useState<string | null>(null);
  const [platformVersion] = useState<string>('DropNest Core v1.0.0-PROD');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const saved = ApiService.getSavedAuth();
    if (saved) {
      setUser(saved.user);
      setToken(saved.token);
      setLoginTimestamp(saved.loginTimestamp);
    }
    setIsLoading(false);
  }, []);

  const login = async (credential: string, pass: string, expectedRole?: UserRole) => {
    setIsLoading(true);
    try {
      const data = await ApiService.login(credential, pass, expectedRole);
      setUser(data.user);
      setToken(data.token);
      setLoginTimestamp(data.loginTimestamp);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const data = await ApiService.register(payload);
      setUser(data.user);
      setToken(data.token);
      setLoginTimestamp(data.loginTimestamp);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await ApiService.logout();
      setUser(null);
      setToken(null);
      setLoginTimestamp(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        loginTimestamp,
        platformVersion,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
