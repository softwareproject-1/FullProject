"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { canAccessRoute, hasFeature, getCombinedAccess, hasRole, SystemRole } from "@/utils/roleAccess";
import { useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Don't show navbar on login page
  if (pathname === "/auth/login") {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Don't reset isLoggingOut here - let the redirect happen
      // The component will unmount when navigating to login page
    } catch (error) {
      console.error("Logout failed:", error);
      // Only reset if logout actually failed (shouldn't happen with new implementation)
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 1000);
    }
  };

  // Get role-based access
  const access = user ? getCombinedAccess(user.roles) : null;
  const canAccessAdmin = user ? canAccessRoute(user.roles, "/admin") : false;
  const canAccessPerformance = user ? canAccessRoute(user.roles, "/performance") : false;
  const canAccessHRManager = user ? canAccessRoute(user.roles, "/hr-manager") : false;
  const canAccessRecruiter = user ? canAccessRoute(user.roles, "/recruiter") : false;
  const canViewEmployees = user ? hasFeature(user.roles, "viewAllEmployees") : false;
  const canViewCandidates = user ? hasFeature(user.roles, "viewCandidates") : false;
  const canViewOwnProfile = user ? hasFeature(user.roles, "viewOwnProfile") : false;
  const isRecruiter = user ? hasRole(user.roles, SystemRole.RECRUITER) : false;

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo/Brand */}
          <div className="flex items-center">
            <button
              onClick={() => router.push("/")}
              className="text-xl font-bold text-text hover:text-primary transition-colors cursor-pointer"
            >
              Employee Performance System
            </button>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span className="text-text-muted text-sm">Loading...</span>
              </div>
            ) : user ? (
              <>
                {/* User Info - Desktop */}
                <div className="hidden md:flex items-center gap-3">
                  <div 
                    onClick={() => {
                      if (user?._id) {
                        router.push(`/admin/employee-profile/${user._id}`);
                      }
                    }}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group text-right"
                  >
                    <div>
                      <p className="text-sm font-medium text-text group-hover:text-primary transition-colors">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {user.employeeNumber}
                      </p>
                    </div>
                    {user.roles && user.roles.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {user.roles.slice(0, 2).map((role, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium border border-primary/30"
                          >
                            {role}
                          </span>
                        ))}
                        {user.roles.length > 2 && (
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium border border-primary/20">
                            +{user.roles.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info - Mobile */}
                <div className="md:hidden flex items-center gap-2">
                  <div
                    onClick={() => {
                      if (user?._id) {
                        router.push(`/admin/employee-profile/${user._id}`);
                      }
                    }}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    {user.roles && user.roles.length > 0 && (
                      <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium border border-primary/30">
                        {user.roles[0]}
                      </span>
                    )}
                    <p className="text-sm font-medium text-text">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                </div>

                {/* Navigation Links - Desktop */}
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    onClick={() => router.push("/")}
                    variant="outline"
                    className="text-sm px-3 py-1"
                  >
                    Home
                  </Button>
                  {canAccessAdmin && pathname !== "/admin" && (
                    <Button
                      onClick={() => router.push("/admin")}
                      variant="outline"
                      className="text-sm px-3 py-1"
                    >
                      Admin
                    </Button>
                  )}
                  {canAccessHRManager && pathname !== "/hr-manager" && (
                    <Button
                      onClick={() => router.push("/hr-manager")}
                      variant="outline"
                      className="text-sm px-3 py-1"
                    >
                      HR Manager
                    </Button>
                  )}
                  {canAccessRecruiter && pathname !== "/recruiter" && (
                    <Button
                      onClick={() => router.push("/recruiter")}
                      variant="outline"
                      className="text-sm px-3 py-1"
                    >
                      Recruiter
                    </Button>
                  )}
                  {canAccessPerformance && pathname !== "/performance" && (
                    <Button
                      onClick={() => router.push("/performance")}
                      variant="outline"
                      className="text-sm px-3 py-1"
                    >
                      Performance
                    </Button>
                  )}
                  {canViewEmployees && pathname !== "/admin/employee-profile" && (
                    <Button
                      onClick={() => router.push("/admin/employee-profile")}
                      variant="outline"
                      className="text-sm px-3 py-1"
                    >
                      Employees
                    </Button>
                  )}
                  {canViewCandidates && isRecruiter && pathname !== "/admin/employee-profile" && (
                    <Button
                      onClick={() => router.push("/admin/employee-profile")}
                      variant="outline"
                      className="text-sm px-3 py-1"
                    >
                      Candidates
                    </Button>
                  )}
                  {canViewOwnProfile && user?._id && pathname !== `/admin/employee-profile/${user._id}` && (
                    <Button
                      onClick={() => router.push(`/admin/employee-profile/${user._id}`)}
                      variant="outline"
                      className="text-sm px-3 py-1"
                    >
                      Profile
                    </Button>
                  )}
                </div>

                {/* Logout Button */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  isLoading={isLoggingOut}
                  disabled={isLoggingOut}
                  className="text-sm px-3 sm:px-4 py-2"
                >
                  <span className="hidden sm:inline">{isLoggingOut ? "Logging out..." : "Logout"}</span>
                  <span className="sm:hidden">{isLoggingOut ? "..." : "Logout"}</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={() => router.push("/auth/login")}
                variant="default"
                className="text-sm px-4 py-2"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

