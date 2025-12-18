'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Clock, 
  UserPlus, 
  FileText 
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

function MetricCard({ title, value, icon, iconBgColor, iconColor }: MetricCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${iconBgColor} flex items-center justify-center`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActivityItemProps {
  title: string;
  subtitle: string;
  time: string;
  color: 'green' | 'blue' | 'yellow';
}

function ActivityItem({ title, subtitle, time, color }: ActivityItemProps) {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`w-2 h-2 rounded-full mt-2 ${colorClasses[color]}`}></div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-600">{subtitle}</p>
        <p className="text-xs text-slate-400 mt-1">{time}</p>
      </div>
    </div>
  );
}

interface TaskItemProps {
  title: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
}

function TaskItem({ title, dueDate, priority }: TaskItemProps) {
  const priorityColors = {
    High: 'text-red-600 bg-red-50',
    Medium: 'text-orange-600 bg-orange-50',
    Low: 'text-blue-600 bg-blue-50'
  };

  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-1">{dueDate}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${priorityColors[priority]}`}>
          {priority}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect candidates to the candidate portal
  useEffect(() => {
    if (!loading && user) {
      const isCandidate = user.roles?.some(
        (r: string) => r.toLowerCase() === 'job candidate'
      );
      if (isCandidate) {
        router.replace('/candidate');
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't render for candidates (they will be redirected)
  if (user?.roles?.some((r: string) => r.toLowerCase() === 'job candidate')) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome to your HR Management System</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Employees"
          value="248"
          icon={<Users className="w-6 h-6" />}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Departments"
          value="12"
          icon={<Building2 className="w-6 h-6" />}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <MetricCard
          title="Avg Performance"
          value="4.2/5"
          icon={<TrendingUp className="w-6 h-6" />}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <MetricCard
          title="Monthly Payroll"
          value="$455K"
          icon={<DollarSign className="w-6 h-6" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Second Row Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pending Leaves"
          value="18"
          icon={<Calendar className="w-6 h-6" />}
          iconBgColor="bg-orange-50"
          iconColor="text-orange-600"
        />
        <MetricCard
          title="Attendance Rate"
          value="94%"
          icon={<Clock className="w-6 h-6" />}
          iconBgColor="bg-cyan-50"
          iconColor="text-cyan-600"
        />
        <MetricCard
          title="Open Positions"
          value="7"
          icon={<UserPlus className="w-6 h-6" />}
          iconBgColor="bg-red-50"
          iconColor="text-red-600"
        />
        <MetricCard
          title="Active Cycles"
          value="2"
          icon={<FileText className="w-6 h-6" />}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {/* Activities and Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activities</h2>
          <div className="space-y-1">
            <ActivityItem
              title="New employee onboarded"
              subtitle="Sarah Johnson"
              time="2 hours ago"
              color="green"
            />
            <ActivityItem
              title="Leave request approved"
              subtitle="James Martinez"
              time="4 hours ago"
              color="green"
            />
            <ActivityItem
              title="Performance review completed"
              subtitle="Emma Davis"
              time="1 day ago"
              color="blue"
            />
            <ActivityItem
              title="Payroll processed"
              subtitle="November 2025"
              time="2 days ago"
              color="blue"
            />
            <ActivityItem
              title="New job posting created"
              subtitle="Senior Developer"
              time="3 days ago"
              color="yellow"
            />
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Tasks</h2>
          <div className="space-y-1">
            <TaskItem
              title="Q1 2025 Performance Reviews"
              dueDate="Due: Dec 15, 2025"
              priority="High"
            />
            <TaskItem
              title="December Payroll Processing"
              dueDate="Due: Dec 25, 2025"
              priority="High"
            />
            <TaskItem
              title="Annual Leave Policy Update"
              dueDate="Due: Dec 20, 2025"
              priority="Medium"
            />
            <TaskItem
              title="New Hire Orientation"
              dueDate="Due: Dec 12, 2025"
              priority="Medium"
            />
            <TaskItem
              title="Department Budget Review"
              dueDate="Due: Dec 30, 2025"
              priority="Low"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
