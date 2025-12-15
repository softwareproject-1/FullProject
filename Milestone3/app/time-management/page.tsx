'use client'

import Link from 'next/link';
import { 
  Clock, Calendar, AlertTriangle, Settings, 
  FileText, Users, TrendingUp, Bell
} from 'lucide-react';

export default function TimeManagement() {
  const menuItems = [
    { 
      id: 'shifts', 
      label: 'Shifts', 
      icon: Clock,
      description: 'Manage shift templates and configurations',
      href: '/time-management/shifts'
    },
    { 
      id: 'shift-types', 
      label: 'Shift Types', 
      icon: Settings,
      description: 'Define shift type categories',
      href: '/time-management/shift-types'
    },
    { 
      id: 'schedule-rules', 
      label: 'Schedule Rules', 
      icon: Calendar,
      description: 'Configure scheduling patterns and rules',
      href: '/time-management/schedule-rules'
    },
    { 
      id: 'shift-assignments', 
      label: 'Shift Assignments', 
      icon: Users,
      description: 'Assign shifts to employees individually or in bulk',
      href: '/time-management/shift-assignments'
    },
    { 
      id: 'attendance', 
      label: 'Attendance Records', 
      icon: FileText,
      description: 'View and manage attendance logs',
      href: '/time-management/attendance'
    },
    { 
      id: 'clock-in-out', 
      label: 'Clock In/Out', 
      icon: Clock,
      description: 'Record employee clock in and out times',
      href: '/time-management/clock-in-out'
    },
    { 
      id: 'correction-requests', 
      label: 'Correction Requests', 
      icon: AlertTriangle,
      description: 'Manage attendance correction requests',
      href: '/time-management/correction-requests'
    },
    { 
      id: 'time-exceptions', 
      label: 'Time Exceptions', 
      icon: AlertTriangle,
      description: 'Handle time-related exceptions and issues',
      href: '/time-management/time-exceptions'
    },
    { 
      id: 'overtime-rules', 
      label: 'Overtime Rules', 
      icon: TrendingUp,
      description: 'Configure overtime policies and rules',
      href: '/time-management/overtime-rules'
    },
    { 
      id: 'lateness-rules', 
      label: 'Lateness Rules', 
      icon: Bell,
      description: 'Set up lateness policies and penalties',
      href: '/time-management/lateness-rules'
    },
    { 
      id: 'holidays', 
      label: 'Holidays', 
      icon: Calendar,
      description: 'Manage holiday calendar and rest days',
      href: '/time-management/holidays'
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: FileText,
      description: 'Generate attendance, overtime, and exception reports',
      href: '/time-management/reports'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-slate-900 mb-2">Time Management</h1>
        <p className="text-slate-600">Manage shifts, attendance, and time tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={false}
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow hover:border-slate-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Icon className="w-6 h-6 text-slate-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-slate-900 font-semibold mb-1">{item.label}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
