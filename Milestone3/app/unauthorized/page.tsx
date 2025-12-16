"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <Card title="Unauthorized Access" className="max-w-md w-full">
        <div className="text-center">
          <p className="text-slate-600 mb-4">
            You don't have permission to access this page.
          </p>
          {user && (
            <div className="mb-4 p-4 bg-white rounded-lg border border-slate-300 text-left">
              <p className="text-slate-600 text-sm mb-2">Your current roles:</p>
              {user.roles && user.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs border border-blue-300"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-red-600 text-sm">No roles assigned</p>
              )}
              <p className="text-slate-600 text-xs mt-2">
                To access admin features, you need the <span className="text-blue-600 font-semibold">System Admin</span> role.
              </p>
            </div>
          )}
          <div className="flex gap-2 justify-center">
            <Button onClick={() => router.push("/")} variant="outline">
              Go to Home
            </Button>
            {user && (
              <Button onClick={() => router.push("/auth/login")} variant="primary">
                Login Again
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

