"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { checkBackendConnection } from "@/utils/ApiClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<{ connected: boolean; message: string } | null>(null);

  // Check backend connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const status = await checkBackendConnection();
      setBackendStatus(status);
      if (!status.connected) {
        setMessage(status.message);
      }
    };
    testConnection();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      // Check if System Admin (case-insensitive)
      const normalizedRoles = (user.roles || []).map((r: string) => (r || "").toLowerCase());
      const isSystemAdmin = normalizedRoles.includes("system admin") || 
                           normalizedRoles.includes("system_admin") ||
                           normalizedRoles.includes("systemadmin");
      if (isSystemAdmin) {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setMessage("Password is required");
      return;
    }
    
    if (!identifier && !workEmail && !personalEmail) {
      setMessage("Please enter National ID, Work Email, or Personal Email");
      return;
    }
    
    setIsLoading(true);
    setMessage("");

    // Check backend connection before attempting login
    const connectionStatus = await checkBackendConnection();
    if (!connectionStatus.connected) {
      setMessage(connectionStatus.message);
      setIsLoading(false);
      return;
    }

    try {
      await login(password, identifier, workEmail, personalEmail);
      // The login function in AuthContext will handle the redirect
      setMessage("Login successful! Redirecting...");
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMsg = "Login failed. Please check your credentials and try again.";
      
      // Check for network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
        errorMsg = "Network Error: Cannot connect to server. Please make sure the backend is running on http://localhost:3001/api";
      } else if (error.message) {
        errorMsg = error.message;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMsg = "Invalid credentials. Please check your email/national ID and password.";
      } else if (error.response?.status >= 500) {
        errorMsg = "Server error. Please try again later.";
      }
      
      setMessage(errorMsg);
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 relative">
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      
      <Card className="max-w-md w-full relative z-10 shadow-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-2xl">Login to Employee Performance System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button
              type="button"
              onClick={() => router.push("/auth/register")}
              variant="outline"
              className="w-full mb-4"
              disabled={isLoading}
            >
              Register as Candidate
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-6">
              <p className="text-slate-600 text-sm">
                Enter your National ID, Work Email, or Personal Email along with your password to login.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalId">National ID</Label>
              <Input
                id="nationalId"
                name="nationalId"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setWorkEmail("");
                  setPersonalEmail("");
                }}
                placeholder="Enter national ID"
                disabled={isLoading}
              />
            </div>

            <div className="text-center my-3">
              <span className="text-slate-500 text-sm font-medium">OR</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workEmail">Work Email</Label>
              <Input
                id="workEmail"
                name="workEmail"
                type="email"
                value={workEmail}
                onChange={(e) => {
                  setWorkEmail(e.target.value);
                  setIdentifier("");
                  setPersonalEmail("");
                }}
                placeholder="Enter work email"
                disabled={isLoading}
              />
            </div>

            <div className="text-center my-3">
              <span className="text-slate-500 text-sm font-medium">OR</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalEmail">Personal Email</Label>
              <Input
                id="personalEmail"
                name="personalEmail"
                type="email"
                value={personalEmail}
                onChange={(e) => {
                  setPersonalEmail(e.target.value);
                  setIdentifier("");
                  setWorkEmail("");
                }}
                placeholder="Enter personal email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            {backendStatus && !backendStatus.connected && (
              <div className="mt-4 p-4 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200">
                <p className="font-semibold mb-2">⚠️ Backend Connection Issue</p>
                <p className="mb-2">{backendStatus.message}</p>
                <p className="text-xs mt-2">
                  <strong>To fix:</strong> Open a terminal, navigate to the <code className="bg-slate-100 px-2 py-1 rounded">Milestone2/HR-System-main</code> folder, and run: <code className="bg-slate-100 px-2 py-1 rounded">npm run start:dev</code>
                </p>
              </div>
            )}

            {message && (
              <div
                className={`mt-4 p-4 rounded-lg text-sm ${
                  message.includes("success")
                    ? "bg-green-50 text-green-600 border border-green-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
