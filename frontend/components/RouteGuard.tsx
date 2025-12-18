"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { canAccessRoute, getDefaultRoute, hasFeature, getCombinedAccess } from "../utils/roleAccess";

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

      const userRoles = user.roles || [];

      // Check route access
      if (requiredRoute) {
        const access = getCombinedAccess(userRoles);
        const hasAccess = access.routes.some(route => {
          return pathname === route || pathname.startsWith(route + "/");
        }) || pathname === requiredRoute || pathname.startsWith(requiredRoute + "/");

        if (!hasAccess) {
          const defaultRoute = redirectTo || getDefaultRoute(userRoles);
          console.warn(`Access denied to ${requiredRoute}. Redirecting to ${defaultRoute}`);
          router.replace(defaultRoute);
          return;
        }
      }

      // Check role OR feature requirements (user needs at least one of them)
      const hasRolesRequirement = requiredRoles && requiredRoles.length > 0;
      const hasFeaturesRequirement = requiredFeatures && requiredFeatures.length > 0;

      if (hasRolesRequirement || hasFeaturesRequirement) {
        // Check if user has any of the required roles
        const hasRequiredRole = hasRolesRequirement ? requiredRoles.some(role => {
          const normalizedRole = role.toLowerCase().trim();
          return userRoles.some((userRole: string) =>
            userRole.toLowerCase().trim() === normalizedRole
          );
        }) : false;

        // Check if user has any of the required features
        const hasRequiredFeature = hasFeaturesRequirement ? requiredFeatures.some(feature =>
          hasFeature(userRoles, feature)
        ) : false;

        // User must have either a matching role OR a matching feature (OR logic)
        if (!hasRequiredRole && !hasRequiredFeature) {
          const defaultRoute = redirectTo || getDefaultRoute(userRoles);
          console.warn(`User does not have required role or feature. Roles: ${userRoles.join(', ')}. Redirecting to ${defaultRoute}`);
          router.replace(defaultRoute);
          return;
        }
      }
    }
  }, [user, loading, requiredRoute, requiredRoles, requiredFeatures, redirectTo, router, pathname]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-500 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if user is not authenticated
  if (!user) {
    return null;
  }

  const userRoles = user.roles || [];

  // Check route access
  if (requiredRoute) {
    const access = getCombinedAccess(userRoles);
    const hasAccess = access.routes.some(route => {
      return pathname === route || pathname.startsWith(route + "/");
    }) || pathname === requiredRoute || pathname.startsWith(requiredRoute + "/");

    if (!hasAccess) {
      return null;
    }
  }

  // Check role OR feature requirements (user needs at least one)
  const hasRolesRequirement = requiredRoles && requiredRoles.length > 0;
  const hasFeaturesRequirement = requiredFeatures && requiredFeatures.length > 0;

  if (hasRolesRequirement || hasFeaturesRequirement) {
    const hasRequiredRole = hasRolesRequirement ? requiredRoles.some(role => {
      const normalizedRole = role.toLowerCase().trim();
      return userRoles.some((userRole: string) =>
        userRole.toLowerCase().trim() === normalizedRole
      );
    }) : false;

    const hasRequiredFeature = hasFeaturesRequirement ? requiredFeatures.some(feature =>
      hasFeature(userRoles, feature)
    ) : false;

    // User must have either a matching role OR a matching feature (OR logic)
    if (!hasRequiredRole && !hasRequiredFeature) {
      return null;
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
}
