'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (data: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: false,
  updateUser: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('accessToken');
      if (token) {
        try {
          const profile = await UserService.getProfile();
          setUser(profile);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          Cookies.remove('accessToken');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (data: any) => {
    const userData = await AuthService.login(data);
    setUser(userData);
  };

  const register = async (data: any) => {
    const userData = await AuthService.register(data);
    setUser(userData);
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!Cookies.get('accessToken'),
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
