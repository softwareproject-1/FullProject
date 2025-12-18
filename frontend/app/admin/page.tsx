'use client'

import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Clock, 
  UserPlus, 
  FileText,
  Shield,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import RouteGuard from '../../components/RouteGuard';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  trend?: { value: string; positive: boolean };
}

function MetricCard({ title, value, icon, iconBgColor, iconColor, trend }: MetricCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
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
  color: 'green' | 'blue' | 'yellow' | 'red';
}

function ActivityItem({ title, subtitle, time, color }: ActivityItemProps) {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
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

interface SystemStatusProps {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: string;
}

function SystemStatus({ name, status, uptime }: SystemStatusProps) {
  const statusConfig = {
    operational: { color: 'text-green-600 bg-green-50', icon: <CheckCircle className="w-4 h-4" />, label: 'Operational' },
    degraded: { color: 'text-yellow-600 bg-yellow-50', icon: <AlertTriangle className="w-4 h-4" />, label: 'Degraded' },
    down: { color: 'text-red-600 bg-red-50', icon: <AlertTriangle className="w-4 h-4" />, label: 'Down' }
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded ${config.color}`}>
          {config.icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">Uptime: {uptime}</p>
        </div>
      </div>
      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <RouteGuard requiredRoles={['System Admin', 'HR Admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-600 mt-1">System overview and administration</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              All Systems Operational
            </span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Employees"
            value="248"
            icon={<Users className="w-6 h-6" />}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
            trend={{ value: '12% from last month', positive: true }}
          />
          <MetricCard
            title="Departments"
            value="12"
            icon={<Building2 className="w-6 h-6" />}
            iconBgColor="bg-green-50"
            iconColor="text-green-600"
          />
          <MetricCard
            title="Active Users"
            value="186"
            icon={<Activity className="w-6 h-6" />}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
            trend={{ value: '8% this week', positive: true }}
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
            title="Active Roles"
            value="12"
            icon={<Shield className="w-6 h-6" />}
            iconBgColor="bg-indigo-50"
            iconColor="text-indigo-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent System Activity</h2>
            <div className="space-y-1">
              <ActivityItem
                title="New employee onboarded"
                subtitle="Sarah Johnson added to Engineering"
                time="2 hours ago"
                color="green"
              />
              <ActivityItem
                title="Role permissions updated"
                subtitle="HR Manager role updated by System Admin"
                time="4 hours ago"
                color="blue"
              />
              <ActivityItem
                title="Department structure modified"
                subtitle="New sub-department created under IT"
                time="1 day ago"
                color="blue"
              />
              <ActivityItem
                title="Security alert resolved"
                subtitle="Failed login attempts flagged and reviewed"
                time="2 days ago"
                color="yellow"
              />
              <ActivityItem
                title="Payroll processed"
                subtitle="November 2025 payroll completed"
                time="3 days ago"
                color="green"
              />
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">System Status</h2>
            <div className="space-y-1">
              <SystemStatus
                name="Authentication Service"
                status="operational"
                uptime="99.99%"
              />
              <SystemStatus
                name="Employee Database"
                status="operational"
                uptime="99.95%"
              />
              <SystemStatus
                name="Payroll System"
                status="operational"
                uptime="99.98%"
              />
              <SystemStatus
                name="Recruitment Portal"
                status="operational"
                uptime="99.97%"
              />
              <SystemStatus
                name="Email Service"
                status="operational"
                uptime="99.90%"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <a href="/employee-profile" className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-slate-700 text-center">Manage Employees</span>
            </a>
            <a href="/organization-structure" className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-slate-700 text-center">Org Structure</span>
            </a>
            <a href="/recruitment" className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-slate-700 text-center">Recruitment</span>
            </a>
            <a href="/payroll" className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-slate-700 text-center">Payroll</span>
            </a>
            <a href="/performance" className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-slate-700 text-center">Performance</span>
            </a>
            <a href="/leaves" className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-cyan-600" />
              </div>
              <span className="text-sm font-medium text-slate-700 text-center">Leaves</span>
            </a>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
