"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "@/utils/ApiClient";
import { useRouter } from "next/navigation";
import { getDefaultRoute } from "@/utils/roleAccess";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  nationalId: string;
  workEmail?: string;
  personalEmail?: string;
  profilePictureUrl?: string;
  roles?: string[];
  permissions?: string[];
  status?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (password: string, identifier?: string, workEmail?: string, personalEmail?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user wants to clear session (for testing/development)
    if (typeof window !== "undefined") {
      const clearSession = sessionStorage.getItem("clearSessionOnLoad");
      if (clearSession === "true") {
        sessionStorage.removeItem("clearSessionOnLoad");
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setLoading(false);
        return;
      }
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axiosInstance.get("/auth/me");
      const roles = response.data.roles || [];
      
      // Ensure roles is always an array and log for debugging
      const rolesArray = Array.isArray(roles) ? roles : [];
      
      console.log("=== AUTH CHECK DEBUG ===");
      console.log("Raw response.data:", response.data);
      console.log("Profile Picture URL from backend:", response.data.profilePictureUrl);
      console.log("Raw roles from backend:", roles);
      console.log("Roles type:", typeof roles, Array.isArray(roles));
      console.log("Roles array (processed):", rolesArray);
      console.log("Roles array length:", rolesArray.length);
      rolesArray.forEach((role: string, index: number) => {
        console.log(`  Role[${index}]:`, role, `(type: ${typeof role}, length: ${role?.length})`);
      });
      console.log("Has 'System Admin' (exact match):", rolesArray.includes("System Admin"));
      console.log("Has 'system admin' (lowercase):", rolesArray.map((r: string) => r?.toLowerCase()).includes("system admin"));
      console.log("========================");
      
      const userData: User = {
        _id: response.data.id || response.data._id,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        employeeNumber: response.data.employeeNumber,
        nationalId: response.data.nationalId,
        workEmail: response.data.workEmail,
        personalEmail: response.data.personalEmail,
        profilePictureUrl: response.data.profilePictureUrl || undefined,
        roles: rolesArray,
        permissions: response.data.permissions || [],
        status: response.data.status,
      };
      setUser(userData);
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userData));
      }
      console.log("Auth check successful - Final user data:", userData);
      console.log("Auth check - profilePictureUrl value:", userData.profilePictureUrl, "Type:", typeof userData.profilePictureUrl);
    } catch (error: any) {
      console.error("Auth check failed (user not logged in):", error);
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (password: string, identifier?: string, workEmail?: string, personalEmail?: string) => {
    try {
      const loginData: any = { password };
      if (identifier) loginData.nationalId = identifier;
      if (workEmail) loginData.workEmail = workEmail;
      if (personalEmail) loginData.personalEmail = personalEmail;

      console.log("Attempting login...");
      console.log("API Base URL:", axiosInstance.defaults.baseURL);

      const response = await axiosInstance.post("/auth/login", loginData);
      
      console.log("Login response:", response.data);
      
      if (response.data.user) {
        const userData: User = {
          _id: response.data.user.id || response.data.user._id || response.data.user.sub,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          employeeNumber: response.data.user.employeeNumber,
          nationalId: response.data.user.nationalId,
          workEmail: response.data.user.workEmail,
          personalEmail: response.data.user.personalEmail,
          profilePictureUrl: response.data.user.profilePictureUrl || undefined,
          roles: response.data.user.roles || [],
          permissions: response.data.user.permissions || [],
          status: response.data.user.status,
        };
        
        console.log("Login - User profilePictureUrl:", userData.profilePictureUrl);
        
        // Ensure roles is always an array
        const rolesArray = Array.isArray(userData.roles) ? userData.roles : [];
        userData.roles = rolesArray;
        
        // Set user state first
        setUser(userData);
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(userData));
        }
        
        console.log("Login successful - User data:", userData);
        console.log("User roles (raw):", response.data.user.roles);
        console.log("User roles (processed):", rolesArray);
        
        // Get default route based on user roles
        const defaultRoute = getDefaultRoute(rolesArray);
        console.log("Default route for user roles:", defaultRoute);
        
        // Use router.replace for better navigation (replaces history entry)
        // Small delay to ensure state is set and React has updated
        setTimeout(() => {
          console.log("Redirecting to default route:", defaultRoute);
          router.replace(defaultRoute);
          // Fallback: force navigation if router.replace doesn't work
          setTimeout(() => {
            if (typeof window !== "undefined" && window.location.pathname !== defaultRoute) {
              window.location.href = defaultRoute;
            }
          }, 500);
        }, 100);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Enhanced error handling for network issues
      let errorMessage = "Login failed. Please check your credentials.";
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.code === 'ETIMEDOUT' || !error.response) {
        const baseURL = axiosInstance.defaults.baseURL || 'http://localhost:3001/api';
        errorMessage = `Network Error: Cannot connect to backend server.\n\n` +
          `Please ensure:\n` +
          `1. Backend server is running on ${baseURL.replace('/api', '')}\n` +
          `2. Start backend with: cd Milestone2/HR-System-main && npm run start:dev\n` +
          `3. Check that port 3001 is not blocked by firewall`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Invalid credentials. Please check your email/national ID and password.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      // Clear user state immediately for better UX
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        // Set flag to prevent auto-login on next page load
        sessionStorage.setItem("clearSessionOnLoad", "true");
      }
      
      // Try to call logout endpoint (but don't wait if it fails)
      try {
        await axiosInstance.post("/auth/logout");
      } catch (error) {
        console.error("Logout endpoint error (non-critical):", error);
      }
      
      // Redirect to login
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, clear local state and redirect
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        sessionStorage.setItem("clearSessionOnLoad", "true");
        router.push("/auth/login");
      }
    }
  };

  const hasRole = (role: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user || !user.roles) return false;
    return roles.some((role) => user.roles?.includes(role));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        checkAuth,
        hasRole,
        hasPermission,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

