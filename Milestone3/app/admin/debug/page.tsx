"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/utils/ApiClient";
import { isSystemAdmin } from "@/utils/roleUtils";

export default function AdminDebugPage() {
  const { user, loading } = useAuth();
  const [authData, setAuthData] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);

  const checkAuth = async () => {
    setLoadingAuth(true);
    try {
      const response = await axiosInstance.get("/auth/me");
      setAuthData(response.data);
    } catch (error: any) {
      setAuthData({ error: error.message, response: error.response?.data });
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      checkAuth();
    }
  }, [loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card title="Admin Access Debug Information">
          <div className="space-y-6">
            {/* User from Context */}
            <div>
              <h3 className="text-lg font-semibold text-text mb-3">User from AuthContext:</h3>
              <div className="p-4 bg-background-light rounded-lg border border-border">
                <pre className="text-sm text-text-muted overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>

            {/* Auth API Response */}
            <div>
              <h3 className="text-lg font-semibold text-text mb-3">Auth API Response (/auth/me):</h3>
              <div className="p-4 bg-background-light rounded-lg border border-border">
                {loadingAuth ? (
                  <p className="text-text-muted">Loading...</p>
                ) : (
                  <pre className="text-sm text-text-muted overflow-auto">
                    {JSON.stringify(authData, null, 2)}
                  </pre>
                )}
              </div>
              <Button onClick={checkAuth} variant="outline" className="mt-2" isLoading={loadingAuth}>
                Refresh Auth Data
              </Button>
            </div>

            {/* Role Check */}
            <div>
              <h3 className="text-lg font-semibold text-text mb-3">Role Analysis:</h3>
              <div className="p-4 bg-background-light rounded-lg border border-border space-y-2">
                <div>
                  <span className="text-text-muted">Has user object: </span>
                  <span className={user ? "text-success" : "text-error"}>
                    {user ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">User roles: </span>
                  <span className="text-text">
                    {user?.roles ? JSON.stringify(user.roles) : "None"}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Roles is array: </span>
                  <span className={Array.isArray(user?.roles) ? "text-success" : "text-error"}>
                    {Array.isArray(user?.roles) ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Has 'System Admin' role: </span>
                  <span className={isSystemAdmin(user?.roles) ? "text-success" : "text-error"}>
                    {isSystemAdmin(user?.roles) ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Required role: </span>
                  <span className="text-primary font-semibold">"System Admin"</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="text-lg font-semibold text-text mb-3">How to Fix:</h3>
              <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <p className="text-text mb-2">
                  If you don't have the "System Admin" role, you need to assign it to your account:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-text-muted text-sm">
                  <li>Use the backend API to assign the role to your employee profile</li>
                  <li>Endpoint: <code className="bg-background px-2 py-1 rounded">PATCH /employee-profile/:profileId/system-roles</code></li>
                  <li>Body: <code className="bg-background px-2 py-1 rounded">{"{ \"roles\": [\"System Admin\"], \"isActive\": true }"}</code></li>
                  <li>Or use the PowerShell script: <code className="bg-background px-2 py-1 rounded">Backend/register-admin.ps1</code></li>
                  <li>After assigning the role, log out and log back in</li>
                </ol>
              </div>
            </div>

            <Button onClick={() => window.location.href = "/admin"} variant="default" className="w-full">
              Try Accessing Admin Dashboard
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

