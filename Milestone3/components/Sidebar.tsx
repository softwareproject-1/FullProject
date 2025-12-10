'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Network,
  TrendingUp,
  Clock,
  UserPlus,
  Calendar,
  DollarSign,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Employee Profile', href: '/employee-profile', icon: <Users className="w-5 h-5" /> },
  { name: 'Org Structure', href: '/organization-structure', icon: <Network className="w-5 h-5" /> },
  { name: 'Performance', href: '/performance', icon: <TrendingUp className="w-5 h-5" /> },
  { name: 'Time Management', href: '/time-management', icon: <Clock className="w-5 h-5" /> },
  { name: 'Recruitment', href: '/recruitment', icon: <UserPlus className="w-5 h-5" /> },
  { name: 'Leaves', href: '/leaves', icon: <Calendar className="w-5 h-5" /> },
  { name: 'Payroll', href: '/payroll-tracking', icon: <DollarSign className="w-5 h-5" /> },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-[#1e293b] text-white min-h-screen flex flex-col fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">HR</h1>
        <h1 className="text-2xl font-bold text-white">Management</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
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
