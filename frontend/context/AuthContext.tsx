'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from '../lib/axios';
import { getDefaultRoute, hasFeature as checkFeature } from '../utils/roleAccess';

// User roles matching backend SystemRole enum
export type UserRole =
  | 'department employee'
  | 'department head'
  | 'HR Manager'
  | 'HR Employee'
  | 'Payroll Specialist'
  | 'Payroll Manager'
  | 'System Admin'
  | 'Legal & Policy Admin'
  | 'Recruiter'
  | 'Finance Staff'
  | 'Job Candidate'
  | 'HR Admin'
  | 'New Hire';

export interface User {
  id: string;
  _id?: string;
  nationalId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workEmail?: string;
  personalEmail?: string;
  profilePictureUrl?: string;
  roles: UserRole[];
  permissions?: string[];
  status?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string, identifierType?: 'workEmail' | 'personalEmail' | 'nationalId') => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  // Role checking helpers
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasPermission: (feature: string) => boolean;
  isHRManager: () => boolean;
  isHREmployee: () => boolean;
  isCandidate: () => boolean;
  isRecruiter: () => boolean;
  isSystemAdmin: () => boolean;
  isNewHire: () => boolean;
  isHRAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication on mount to restore session
  useEffect(() => {
    // Check if user wants to clear session (for testing/development)
    if (typeof window !== 'undefined') {
      const clearSession = sessionStorage.getItem('clearSessionOnLoad');
      if (clearSession === 'true') {
        sessionStorage.removeItem('clearSessionOnLoad');
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        // Try to restore user from localStorage (for cases where token was removed but user data exists)
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log('No token but found stored user data, clearing...');
          } catch (e) {
            // Invalid stored user
          }
          localStorage.removeItem('user');
        }
        setUser(null);
        setLoading(false);
        return;
      }

      // First try to restore from localStorage for faster UI
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id && parsedUser.roles) {
            setUser(parsedUser);
            console.log('Restored user from localStorage:', parsedUser.firstName, parsedUser.lastName);
          }
        } catch (e) {
          console.warn('Failed to parse stored user');
        }
      }

      // Then verify with backend (but don't clear user if it fails)
      try {
        const response = await axios.get('/auth/me');
        const userData = response.data.user || response.data;

        if (userData) {
          const normalizedUser: User = {
            id: userData.id || userData._id,
            _id: userData._id || userData.id,
            nationalId: userData.nationalId,
            employeeNumber: userData.employeeNumber,
            firstName: userData.firstName,
            lastName: userData.lastName,
            workEmail: userData.workEmail,
            personalEmail: userData.personalEmail,
            profilePictureUrl: userData.profilePictureUrl,
            roles: Array.isArray(userData.roles) ? userData.roles : [],
            permissions: userData.permissions || [],
            status: userData.status,
          };
          setUser(normalizedUser);
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          console.log('Auth check successful:', normalizedUser.firstName, normalizedUser.lastName);
        }
      } catch (error: any) {
        console.warn('Auth verification failed:', error.response?.status);
        // Only clear session if explicitly unauthorized (invalid/expired token)
        const errorMsg = error.response?.data?.message || '';
        const errorMsgLower = typeof errorMsg === 'string' ? errorMsg.toLowerCase() : '';
        const isTokenInvalid =
          errorMsgLower.includes('invalid') ||
          errorMsgLower.includes('expired') ||
          errorMsgLower.includes('malformed');

        if (error.response?.status === 401 && isTokenInvalid) {
          console.warn('Token is invalid/expired, clearing session');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
        // For network errors or other issues, keep the session from localStorage
      }
    } catch (error: any) {
      console.error('Unexpected error in checkAuth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    identifier: string,
    password: string,
    identifierType: 'workEmail' | 'personalEmail' | 'nationalId' = 'workEmail'
  ) => {
    try {
      const payload = {
        [identifierType]: identifier,
        password,
      };

      const response = await axios.post('/auth/login', payload);

      // Store the JWT token in localStorage
      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        console.log('Token stored successfully');
      }

      // Set user data from response
      if (response.data && response.data.user) {
        const userData = response.data.user;
        console.log('=== LOGIN RESPONSE DEBUG ===');
        console.log('Full response.data:', response.data);
        console.log('userData:', userData);
        console.log('userData.roles:', userData.roles);
        console.log('Is roles array?', Array.isArray(userData.roles));

        const normalizedUser: User = {
          id: userData.id || userData._id,
          _id: userData._id || userData.id,
          nationalId: userData.nationalId,
          employeeNumber: userData.employeeNumber,
          firstName: userData.firstName,
          lastName: userData.lastName,
          workEmail: userData.workEmail,
          personalEmail: userData.personalEmail,
          profilePictureUrl: userData.profilePictureUrl,
          roles: Array.isArray(userData.roles) ? userData.roles : [],
          permissions: userData.permissions || [],
          status: userData.status,
        };

        console.log('Normalized user roles:', normalizedUser.roles);
        console.log('=== END LOGIN RESPONSE DEBUG ===');

        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        console.log('User logged in:', normalizedUser.firstName, normalizedUser.lastName);
        console.log('User roles:', normalizedUser.roles);

        // Redirect to default route based on user roles
        const defaultRoute = getDefaultRoute(normalizedUser.roles);
        console.log('Redirecting to:', defaultRoute);

        setTimeout(() => {
          router.replace(defaultRoute);
        }, 100);
      }
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error('Unable to connect to server. Please ensure the backend is running on port 3000.');
      }
      throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  const logout = async () => {
    // Clear user state immediately for better UX
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.setItem('clearSessionOnLoad', 'true');
    }

    // Try to call logout endpoint (best effort - ignore failures)
    try {
      await axios.post('/auth/logout');
    } catch (error: any) {
      // Silently ignore logout endpoint errors (token might be expired/invalid)
      // This is expected and not critical - local session is already cleared
      if (error?.response?.status !== 401) {
        console.warn('Logout endpoint failed (non-critical):', error?.response?.status);
      }
    }

    router.push('/auth/login');
  };

  // Role checking helpers
  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user?.roles?.some(r => r.toLowerCase() === role.toLowerCase()) ?? false;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const hasPermission = (feature: string): boolean => {
    if (!user) return false;
    return checkFeature(user.roles, feature);
  };

  const isHRManager = (): boolean => hasRole('HR Manager');
  const isHREmployee = (): boolean => hasRole('HR Employee');
  const isCandidate = (): boolean => hasRole('Job Candidate');
  const isRecruiter = (): boolean => hasRole('Recruiter');
  const isSystemAdmin = (): boolean => hasRole('System Admin');
  const isNewHire = (): boolean => hasRole('New Hire');
  const isHRAdmin = (): boolean => hasRole('HR Admin');

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
    hasRole,
    hasAnyRole,
    hasPermission,
    isHRManager,
    isHREmployee,
    isCandidate,
    isRecruiter,
    isSystemAdmin,
    isNewHire,
    isHRAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
