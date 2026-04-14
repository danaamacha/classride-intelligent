import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../services/storage';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await storage.getItem('accessToken');
      const storedUser = await storage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: any) => {
    await storage.setItem('accessToken', data.accessToken);
    await storage.setItem('refreshToken', data.refreshToken);
    await storage.setItem('phoneNumber', data.phoneNumber);
    await storage.setItem('role', data.role);
    await storage.setItem('user', JSON.stringify(data));
    setToken(data.accessToken);
    setUser(data);
  };

  const logout = async () => {
    await storage.removeItem('accessToken');
    await storage.removeItem('refreshToken');
    await storage.removeItem('phoneNumber');
    await storage.removeItem('role');
    await storage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);