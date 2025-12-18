"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute, getCombinedAccess, hasRole, SystemRole } from "@/utils/roleAccess";
import {
  LayoutDashboard,
  Users,
  Network,
  TrendingUp,
  Clock,
  UserPlus,
  Calendar,
  DollarSign,
  Home,
  Gift,
  Settings,
  ChevronDown,
  ChevronRight,
  FileText,
  Briefcase,
} from "lucide-react";

interface SubNavItem {
  name: string;
  href: string;
  icon: ReactNode;
  checkRoute?: string;
  visibleForAllAuthenticated?: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: ReactNode;
  checkRoute?: string;
  children?: SubNavItem[];
  visibleForAllAuthenticated?: boolean;
}

const navItems: NavItem[] = [
  { name: "Home", href: "/", icon: <Home className="w-5 h-5" /> },
  {
    name: "Employee Profile",
    href: "/admin/employee-profile",
    icon: <Users className="w-5 h-5" />,
  },
  {
    name: "Org Structure",
    href: "/admin/organization-structure",
    icon: <Network className="w-5 h-5" />,
  },
  {
    name: "Performance",
    href: "/performance",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    name: "Time Management",
    href: "/time-management",
    icon: <Clock className="w-5 h-5" />,
  },
  {
    name: "Recruitment",
    href: "/recruitment",
    icon: <UserPlus className="w-5 h-5" />,
  },
  { name: "Leaves", href: "/leaves", icon: <Calendar className="w-5 h-5" /> },
  {
    name: "Payroll Execution",
    href: "/payroll-execution",
    icon: <DollarSign className="w-5 h-5" />,
    visibleForAllAuthenticated: true,
  },
  {
    name: "My Payroll",
    href: "/payroll/payroll-tracking/employee",
    icon: <Briefcase className="w-5 h-5" />,
    visibleForAllAuthenticated: true,
  },
  {
    name: "Payroll Config",
    href: "/payroll-configuration",
    icon: <DollarSign className="w-5 h-5" />,
    visibleForAllAuthenticated: true,
    children: [
      {
        name: "Policies",
        href: "/payroll-configuration?tab=policies",
        icon: <FileText className="w-4 h-4" />,
        visibleForAllAuthenticated: true,
      },
      {
        name: "Company Settings",
        href: "/payroll-configuration?tab=companyWideSettings",
        icon: <Settings className="w-4 h-4" />,
        visibleForAllAuthenticated: true,
      },
      {
        name: "Pay Grades",
        href: "/payroll-configuration?tab=payGrades",
        icon: <TrendingUp className="w-4 h-4" />,
        visibleForAllAuthenticated: true,
      },
      {
        name: "Pay Types",
        href: "/payroll-configuration?tab=payTypes",
        icon: <Clock className="w-4 h-4" />,
        visibleForAllAuthenticated: true,
      },
      {
        name: "Tax Rules",
        href: "/payroll-configuration?tab=taxRules",
        icon: <Clock className="w-4 h-4" />,
        visibleForAllAuthenticated: true,
      },
      {
        name: "Termination Benefits",
        href: "/payroll-configuration?tab=terminationBenefits",
        icon: <Briefcase className="w-4 h-4" />,
        visibleForAllAuthenticated: true,
      },
      {
        name: "Insurance Brackets",
        href: "/payroll-configuration?tab=insuranceBrackets",
        icon: <Briefcase className="w-4 h-4" />,
        visibleForAllAuthenticated: true,
      },
      {
        name: "Allowances",
        href: "/payroll-configuration?tab=allowances",
        icon: <DollarSign className="w-4 h-4" />,
        visibleForAllAuthenticated: true,
      },
      {
        name: "Signing Bonus",
        href: "/payroll-configuration?tab=signingBonus",
        icon: <Gift className="w-4 h-4" />,
        visibleForAllAuthenticated: true,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "Payroll Config",
  ]);

  const controlPath = useMemo(() => {
    if (!user || !user.roles) return "/";
    const access = getCombinedAccess(user.roles);
    return access.defaultRoute || "/";
  }, [user]);

  const availableNavItems = useMemo(() => {
    if (!user || !user.roles) return [];

    // Determine Payroll href based on user role
    const isPayrollSpecialist = hasRole(user.roles, SystemRole.PAYROLL_SPECIALIST);
    const payrollHref = isPayrollSpecialist
      ? "/payroll/payroll-tracking/specialist"
      : "/payroll";

    // Create dynamic Payroll item
    const payrollItem: NavItem = {
      name: "Payroll",
      href: payrollHref,
      icon: <DollarSign className="w-5 h-5" />,
    };

    return navItems
      .map((item) => {
        if (item.href === "/") {
          return item;
        }

        // Insert Payroll item after My Payroll
        if (item.name === "My Payroll") {
          return [item, payrollItem];
        }

        if (item.visibleForAllAuthenticated) {
          if (item.children?.length) {
            return {
              ...item,
              children: item.children,
            } as NavItem;
          }
          return item;
        }

        const routeToCheck = item.checkRoute || item.href;

        if (item.children?.length) {
          const visibleChildren = item.children.filter((child) => {
            if (child.visibleForAllAuthenticated) {
              return true;
            }
            const childRoute = child.checkRoute || child.href;
            return canAccessRoute(user.roles, childRoute);
          });

          const canAccessSelf = canAccessRoute(user.roles, routeToCheck);

          if (!visibleChildren.length && !canAccessSelf) {
            return null;
          }

          return {
            ...item,
            children: visibleChildren,
          } as NavItem;
        }

        return canAccessRoute(user.roles, routeToCheck) ? item : null;
      })
      .flat()
      .filter(Boolean) as NavItem[];
  }, [user]);

  useEffect(() => {
    setExpandedItems((prev) =>
      prev.filter((name) =>
        availableNavItems.some(
          (item) => item.name === name && item.children?.length
        )
      )
    );
  }, [availableNavItems]);

  const activeTab = searchParams?.get("tab");

  const isControlActive =
    pathname === controlPath ||
    (controlPath !== "/" && pathname?.startsWith(controlPath));

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isSubItemActive = (child: SubNavItem) => {
    const [childPath, childQuery] = child.href.split("?");
    const matchesPath =
      pathname === childPath ||
      (childPath !== "/" && pathname?.startsWith(`${childPath}/`));

    if (!matchesPath) {
      return false;
    }

    if (!childQuery) {
      return matchesPath;
    }

    const childParams = new URLSearchParams(childQuery);
    const childTab = childParams.get("tab");
    return childTab ? activeTab === childTab : matchesPath;
  };

  return (
    <aside className="w-64 bg-[#1e293b] text-white h-screen overflow-y-auto no-scrollbar flex flex-col fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">HR</h1>
        <h1 className="text-2xl font-bold text-white">Management</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
        <Link
          href={controlPath}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isControlActive
            ? "bg-slate-700 text-white shadow-sm"
            : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
            }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>

        {availableNavItems.map((item) => {
          const hasChildren = Boolean(item.children?.length);
          const parentPath = item.href.split("?")[0];
          const isParentActive =
            parentPath === "/"
              ? pathname === "/"
              : pathname === parentPath ||
              pathname?.startsWith(`${parentPath}/`);
          const childActive =
            item.children?.some((child) => isSubItemActive(child)) ?? false;
          const isExpanded = expandedItems.includes(item.name);
          const shouldHighlight = hasChildren
            ? isParentActive || childActive
            : isParentActive;

          if (hasChildren) {
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleExpanded(item.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${shouldHighlight
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    }`}
                >
                  {item.icon}
                  <span className="text-sm font-medium flex-1 text-left">
                    {item.name}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {isExpanded && item.children && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const childIsActive = isSubItemActive(child);
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${childIsActive
                            ? "bg-slate-700 text-white shadow-sm"
                            : "text-slate-300 hover:bg-blue-600/70 hover:text-white"
                            }`}
                        >
                          {child.icon}
                          <span>{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${shouldHighlight
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <p className="text-slate-400 text-xs text-center">
          © 2025 HR System v1.0
        </p>
      </div>
    </aside>
  );
}

/*
================================================================================
Legacy teammate sidebar (kept commented as requested)
================================================================================
'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute, getCombinedAccess } from '@/utils/roleAccess';
import {
  LayoutDashboard,
  Users,
  Network,
  TrendingUp,
  Clock,
  UserPlus,
  Calendar,
  DollarSign,
  Home,
  FileText,
  AlertCircle,
  Wallet,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  // Optional: specific route to check (if different from href)
  checkRoute?: string;
}

// Define all navigation items - access will be checked dynamically
const navItems: NavItem[] = [
  { name: 'Home', href: '/', icon: <Home className="w-5 h-5" /> },
  { name: 'Employee Profile', href: '/admin/employee-profile', icon: <Users className="w-5 h-5" />, roles: ['System Admin', 'HR Manager', 'Recruiter'] },
  { name: 'Org Structure', href: '/admin/organization-structure', icon: <Network className="w-5 h-5" />, roles: ['System Admin', 'HR Manager'] },
  { name: 'Performance', href: '/performance', icon: <TrendingUp className="w-5 h-5" /> },
  { name: 'Time Management', href: '/time-management', icon: <Clock className="w-5 h-5" /> },
  { name: 'Recruitment', href: '/recruitment', icon: <UserPlus className="w-5 h-5" />, roles: ['System Admin', 'HR Manager', 'Recruiter'] },
  { name: 'Leaves', href: '/leaves', icon: <Calendar className="w-5 h-5" /> },
  { name: 'My Payroll', href: '/payroll/payroll-tracking/employee', icon: <Wallet className="w-5 h-5" /> },
  { name: 'Payroll Execution', href: '/payroll-execution', icon: <DollarSign className="w-5 h-5" /> },
  { name: 'Payroll', href: '/payroll', icon: <DollarSign className="w-5 h-5" /> },
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Get user's default route (control dashboard) based on their roles
  const getControlPath = () => {
    if (!user || !user.roles) return '/';
    const access = getCombinedAccess(user.roles);
    return access.defaultRoute || '/';
  };

  const controlPath = getControlPath();

  // Filter nav items based on route access control
  const filteredNavItems = navItems.filter((item) => {
    if (!user || !user.roles) return false;

    // Home route is accessible to all authenticated users
    if (item.href === '/') {
      return true;
    }

    // Check route access using canAccessRoute
    const routeToCheck = item.checkRoute || item.href;
    return canAccessRoute(user.roles, routeToCheck);
  });

  // Check if control path is active
  const isControlActive = pathname === controlPath || (controlPath !== '/' && pathname?.startsWith(controlPath));

  return (
    <aside className="w-64 bg-[#1e293b] text-white min-h-screen flex flex-col fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">HR</h1>
        <h1 className="text-2xl font-bold text-white">Management</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        // Dashboard option - always visible, redirects to user's dashboard
        <Link
          href={controlPath}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isControlActive
            ? 'bg-slate-700 text-white shadow-sm'
            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>

        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <p className="text-slate-400 text-xs text-center">
          © 2025 HR System v1.0
        </p>
      </div>
    </aside>
  );
}
*/
