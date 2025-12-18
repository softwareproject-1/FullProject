"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MainPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in - redirect to login
        router.replace("/auth/login");
      } else {
        // Logged in - check if System Admin (case-insensitive)
        const normalizedRoles = (user.roles || []).map((r: string) => (r || "").toLowerCase());
        const isSystemAdmin = normalizedRoles.includes("system admin") || 
                             normalizedRoles.includes("system_admin") ||
                             normalizedRoles.includes("systemadmin");
        if (isSystemAdmin) {
          // System Admin - redirect to admin page
          router.replace("/admin");
        }
        // Non-admin users stay on home page
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background-light to-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-muted text-lg">Loading...</p>
        </div>
      </main>
    );
  }

  // If not logged in, show login prompt
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
        <Card title="Welcome to Employee Performance System" className="max-w-md w-full text-center">
          <p className="text-slate-600 mb-6">
            Please login to access the system.
          </p>
          <Button 
            onClick={() => router.push("/auth/login")} 
            variant="default"
            className="w-full"
          >
            Go to Login
          </Button>
        </Card>
      </main>
    );
  }

  // Logged in user (non-admin) - show welcome page
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Welcome, {user.firstName} {user.lastName}
          </h1>
          <p className="text-slate-600 text-lg">
            Employee Number: <span className="text-blue-600 font-medium">{user.employeeNumber}</span>
          </p>
          {user.roles && user.roles.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
              <span className="text-slate-600 text-sm">Roles:</span>
              {user.roles.map((role, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs md:text-sm font-medium border border-blue-300"
                >
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>

        <Card title="Dashboard" className="mb-6">
          <p className="text-slate-600 mb-4">
            Welcome to the Employee Performance Management System. Your dashboard is being prepared.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => router.push("/admin")}
              variant="outline"
              className="w-full"
            >
              View Admin Panel
            </Button>
            <Button
              onClick={() => router.push("/auth/login")}
              variant="outline"
              className="w-full"
            >
              Login Page
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
