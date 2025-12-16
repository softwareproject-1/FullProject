"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <Card title="Unauthorized Access" className="max-w-md w-full">
        <div className="text-center">
          <p className="text-text-muted mb-4">
            You don't have permission to access this page.
          </p>
          {user && (
            <div className="mb-4 p-4 bg-background-light rounded-lg border border-border text-left">
              <p className="text-text-muted text-sm mb-2">Your current roles:</p>
              {user.roles && user.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-primary/20 text-primary rounded text-xs border border-primary/30"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-error text-sm">No roles assigned</p>
              )}
              <p className="text-text-muted text-xs mt-2">
                To access admin features, you need the <span className="text-primary font-semibold">System Admin</span> role.
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

