"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute, getDefaultRoute, hasFeature, getCombinedAccess } from "@/utils/roleAccess";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRoute?: string;
  requiredRoles?: string[];
  requiredFeatures?: string[];
  redirectTo?: string;
}

/**
 * RouteGuard component that protects routes based on user roles and permissions
 */
export default function RouteGuard({
  children,
  requiredRoute,
  requiredRoles,
  requiredFeatures,
  redirectTo,
}: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in - redirect to login
        router.replace("/auth/login");
        return;
      }

      // Check route access - support prefix matching for sub-routes
      if (requiredRoute) {
        const access = getCombinedAccess(user.roles);
        // Check if pathname matches any of the user's allowed routes (with prefix matching)
        // or if pathname starts with the requiredRoute
        const hasAccess = access.routes.some(route => {
          // Exact match or pathname starts with route + "/" (prefix match)
          return pathname === route || pathname.startsWith(route + "/");
        }) || pathname === requiredRoute || pathname.startsWith(requiredRoute + "/");
        
        if (!hasAccess) {
          // User doesn't have access to this route - redirect to default route
          const defaultRoute = redirectTo || getDefaultRoute(user.roles);
          console.warn(`Access denied to ${requiredRoute} (current: ${pathname}). Redirecting to ${defaultRoute}`);
          router.replace(defaultRoute);
          return;
        }
      }

      // Check role requirements
      if (requiredRoles && requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => {
          const normalizedRole = role.toLowerCase().trim();
          return (user.roles || []).some(userRole => 
            userRole.toLowerCase().trim() === normalizedRole
          );
        });

        if (!hasRequiredRole) {
          const defaultRoute = redirectTo || getDefaultRoute(user.roles);
          console.warn(`User does not have required role. Redirecting to ${defaultRoute}`);
          router.replace(defaultRoute);
          return;
        }
      }

      // Check feature requirements
      if (requiredFeatures && requiredFeatures.length > 0) {
        const hasRequiredFeature = requiredFeatures.some(feature => 
          hasFeature(user.roles, feature)
        );

        if (!hasRequiredFeature) {
          const defaultRoute = redirectTo || getDefaultRoute(user.roles);
          console.warn(`User does not have required feature. Redirecting to ${defaultRoute}`);
          router.replace(defaultRoute);
          return;
        }
      }
    }
  }, [user, loading, requiredRoute, requiredRoles, requiredFeatures, redirectTo, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-muted text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if user is not authenticated
  if (!user) {
    return null;
  }

  // Check route access - support prefix matching for sub-routes
  if (requiredRoute) {
    const access = getCombinedAccess(user.roles);
    // Check if pathname matches any of the user's allowed routes (with prefix matching)
    // or if pathname starts with the requiredRoute
    const hasAccess = access.routes.some(route => {
      // Exact match or pathname starts with route + "/" (prefix match)
      return pathname === route || pathname.startsWith(route + "/");
    }) || pathname === requiredRoute || pathname.startsWith(requiredRoute + "/");
    
    if (!hasAccess) {
      return null;
    }
  }

  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => {
      const normalizedRole = role.toLowerCase().trim();
      return (user.roles || []).some(userRole => 
        userRole.toLowerCase().trim() === normalizedRole
      );
    });

    if (!hasRequiredRole) {
      return null;
    }
  }

  // Check feature requirements
  if (requiredFeatures && requiredFeatures.length > 0) {
    const hasRequiredFeature = requiredFeatures.some(feature => 
      hasFeature(user.roles, feature)
    );

    if (!hasRequiredFeature) {
      return null;
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
}

