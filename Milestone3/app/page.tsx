'use client'

import {
  Users,
  Building2,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { listEmployeeProfiles, getChangeRequests, ChangeRequest } from '@/utils/employeeProfileApi';
import { getAllDepartments } from '@/utils/organizationStructureApi';
import { PerformanceApi } from '@/utils/performanceApi';

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


export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [metrics, setMetrics] = useState({
    employees: 0,
    departments: 0,
    activeCycles: 0,
  });
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Array<{
    title: string;
    subtitle: string;
    time: string;
    color: 'green' | 'blue' | 'yellow';
  }>>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  const loadMetrics = async () => {
    try {
      setMetricsLoading(true);
      setMetricsError(null);

      const [employeesRes, departmentsRes, cyclesRes] = await Promise.all([
        listEmployeeProfiles({}),
        getAllDepartments(),
        PerformanceApi.listCycles(),
      ]);

      // Handle paginated or array response for employees
      let employeesCount = 0;
      if (Array.isArray(employeesRes)) {
        employeesCount = employeesRes.length;
      } else if (employeesRes?.data && Array.isArray(employeesRes.data)) {
        employeesCount = employeesRes.total || employeesRes.data.length;
      } else if (employeesRes?.total) {
        employeesCount = employeesRes.total;
      }

      const departmentsCount = Array.isArray(departmentsRes) ? departmentsRes.length : 0;
      const activeCyclesCount = (() => {
        const cyclesArray = Array.isArray(cyclesRes?.data) ? cyclesRes.data : Array.isArray(cyclesRes) ? cyclesRes : [];
        return cyclesArray.filter((cycle: any) => (cycle?.status || '').toString().toUpperCase() === 'ACTIVE').length;
      })();

      setMetrics({
        employees: employeesCount,
        departments: departmentsCount,
        activeCycles: activeCyclesCount,
      });
    } catch (err: any) {
      console.error("Error loading dashboard metrics:", err);
      setMetricsError(err?.response?.data?.message || "Failed to load metrics");
    } finally {
      setMetricsLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);
      
      // Get recent change requests
      const changeRequestsRes = await getChangeRequests();
      const changeRequests: ChangeRequest[] = Array.isArray(changeRequestsRes) 
        ? changeRequestsRes 
        : Array.isArray(changeRequestsRes?.data) 
        ? changeRequestsRes.data 
        : [];

      // Get recently created/updated employees (limit to 10 for recent)
      const recentEmployeesRes = await listEmployeeProfiles({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
      const recentEmployees = Array.isArray(recentEmployeesRes)
        ? recentEmployeesRes
        : Array.isArray(recentEmployeesRes?.data)
        ? recentEmployeesRes.data
        : [];

      // Combine and format activities
      const activitiesList: Array<{
        title: string;
        subtitle: string;
        time: string;
        color: 'green' | 'blue' | 'yellow';
        timestamp: Date;
      }> = [];

      // Add change request activities
      changeRequests.slice(0, 5).forEach((cr) => {
        const employeeName = cr.employeeProfile 
          ? `${cr.employeeProfile.firstName} ${cr.employeeProfile.lastName}`
          : 'Employee';
        
        let title = '';
        let color: 'green' | 'blue' | 'yellow' = 'blue';
        
        if (cr.status === 'APPROVED') {
          title = 'Change request approved';
          color = 'green';
        } else if (cr.status === 'REJECTED') {
          title = 'Change request rejected';
          color = 'yellow';
        } else if (cr.status === 'PENDING') {
          title = 'Change request submitted';
          color = 'blue';
        }

        if (title && cr.submittedAt) {
          activitiesList.push({
            title,
            subtitle: employeeName,
            time: formatTimeAgo(new Date(cr.submittedAt)),
            color,
            timestamp: new Date(cr.submittedAt),
          });
        }
      });

      // Add new employee activities
      recentEmployees.slice(0, 5).forEach((emp: any) => {
        if (emp.createdAt) {
          const createdDate = new Date(emp.createdAt);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Only show employees created in the last 30 days
          if (daysDiff <= 30) {
            activitiesList.push({
              title: 'New employee onboarded',
              subtitle: `${emp.firstName} ${emp.lastName}`,
              time: formatTimeAgo(createdDate),
              color: 'green',
              timestamp: createdDate,
            });
          }
        }
      });

      // Sort by timestamp (most recent first) and take top 5
      activitiesList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(activitiesList.slice(0, 5).map(({ timestamp, ...rest }) => rest));
    } catch (err: any) {
      console.error("Error loading activities:", err);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    if (user) {
      loadMetrics();
      loadActivities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back, {user.firstName} {user.lastName}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Employees"
          value={metricsLoading ? 'Loading...' : metrics.employees}
          icon={<Users className="w-6 h-6" />}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Departments"
          value={metricsLoading ? 'Loading...' : metrics.departments}
          icon={<Building2 className="w-6 h-6" />}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <MetricCard
          title="Active Cycles"
          value={metricsLoading ? 'Loading...' : metrics.activeCycles}
          icon={<FileText className="w-6 h-6" />}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {metricsError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
          {metricsError}
        </div>
      )}

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activities</h2>
        {activitiesLoading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-slate-600 text-sm">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-slate-600 text-sm">No recent activities</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity, index) => (
              <ActivityItem
                key={index}
                title={activity.title}
                subtitle={activity.subtitle}
                time={activity.time}
                color={activity.color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
