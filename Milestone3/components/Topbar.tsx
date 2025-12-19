'use client'

import { useState, useEffect } from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { timeManagementApi } from '@/services/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  _id: string;
  to: string;
  type: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [imageError, setImageError] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?._id, user?.profilePictureUrl]);

  // Load notifications when user is available
  useEffect(() => {
    // Don't load notifications on login page
    if (pathname === '/auth/login') {
      return;
    }
    
    if (user?._id) {
      // Add a small delay to ensure authentication is fully established
      const timeoutId = setTimeout(() => {
        loadNotifications();
      }, 1000);
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => {
        clearTimeout(timeoutId);
        clearInterval(interval);
      };
    }
  }, [user?._id, pathname]);

  const loadNotifications = async () => {
    if (!user?._id) return;
    
    try {
      setLoadingNotifications(true);
      const response = await timeManagementApi.getNotifications(user._id);
      setNotifications(response.data || []);
    } catch (error: any) {
      // Silently handle errors - don't let notification failures break the app
      // Check if it's a 401/403 - these might happen if user doesn't have access
      // or if the endpoint doesn't exist yet
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Notifications not accessible for this user or endpoint not available');
        setNotifications([]);
      } else if (error.response?.status === 404) {
        console.log('Notifications endpoint not found - may not be implemented yet');
        setNotifications([]);
      } else {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      }
    } finally {
      setLoadingNotifications(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MISSED_PUNCH':
        return '⏰';
      case 'ATTENDANCE_CORRECTED':
        return '✅';
      case 'EXCEPTION_ESCALATED':
        return '⚠️';
      case 'REQUEST_ESCALATED':
        return '📢';
      case 'SHIFT_ASSIGNED':
        return '📅';
      case 'CORRECTION_APPROVED':
        return '✓';
      case 'CORRECTION_REJECTED':
        return '✗';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'MISSED_PUNCH':
        return 'bg-yellow-50 border-yellow-200';
      case 'ATTENDANCE_CORRECTED':
        return 'bg-green-50 border-green-200';
      case 'EXCEPTION_ESCALATED':
      case 'REQUEST_ESCALATED':
        return 'bg-red-50 border-red-200';
      case 'CORRECTION_APPROVED':
        return 'bg-green-50 border-green-200';
      case 'CORRECTION_REJECTED':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  // Debug: Log user data to see if profilePictureUrl is present
  useEffect(() => {
    if (user) {
      console.log('Topbar - User data:', {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePictureUrl: user.profilePictureUrl,
        hasProfilePicture: !!user.profilePictureUrl
      });
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
  };

  const getUserRole = () => {
    if (!user || !user.roles || user.roles.length === 0) return 'User';
    return user.roles[0] || 'User';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 left-64 right-0 z-10 shadow-sm">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employees, departments, or documents..."
              className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4 ml-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <div className="p-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
                  {notifications.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {notifications.length}
                    </Badge>
                  )}
                </div>
                {loadingNotifications ? (
                  <div className="text-sm text-slate-500 py-4 text-center">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="text-sm text-slate-500 py-4 text-center">No notifications</div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-3 rounded-lg border ${getNotificationColor(notification.type)}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 break-words">
                              {notification.message || 'New notification'}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <button
                onClick={() => {
                  if (user?._id) {
                    router.push(`/admin/employee-profile/${user._id}`);
                  }
                }}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
              >
                {user.profilePictureUrl && user.profilePictureUrl.trim() !== '' && !imageError ? (
                  <img
                    src={user.profilePictureUrl}
                    alt={getUserDisplayName()}
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 group-hover:border-blue-500 transition-colors"
                    onError={(e) => {
                      console.error('Topbar - Image failed to load:', user.profilePictureUrl);
                      setImageError(true);
                    }}
                    onLoad={() => {
                      console.log('Topbar - Image loaded successfully:', user.profilePictureUrl);
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                    {getUserInitials()}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-slate-500">{getUserRole()}</p>
                </div>
              </button>
              <div className="relative group">
                <button className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        if (user?._id) {
                          router.push(`/admin/employee-profile/${user._id}`);
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => router.push('/auth/login')}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

